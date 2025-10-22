#!/usr/bin/env python
"""
GreenThumb Discovery Pipeline CLI
Main command-line interface for managing the entire data pipeline.
"""

import click
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import json
import logging
from tabulate import tabulate

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.automation.orchestrator import PipelineOrchestrator
from scripts.automation.config_manager import get_config_manager, Environment
from scripts.monitoring.data_quality_monitor import DataQualityMonitor
from scripts.monitoring.pipeline_health import PipelineHealthMonitor
from scripts.database.connection_manager import get_connection_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
@click.option('--config', help='Configuration file path')
@click.option('--env', type=click.Choice(['development', 'staging', 'production', 'test']),
              help='Environment')
@click.pass_context
def cli(ctx, config, env):
    """GreenThumb Discovery Pipeline Management CLI"""
    # Set up context
    ctx.ensure_object(dict)
    
    # Load configuration
    if env:
        os.environ['APP_ENV'] = env
    
    config_manager = get_config_manager()
    if config:
        config_manager.config_path = config
        config_manager.reload()
    
    ctx.obj['config'] = config_manager.get_config()
    ctx.obj['orchestrator'] = PipelineOrchestrator(config)


@cli.group()
def ingest():
    """Data ingestion commands"""
    pass


@ingest.command('csv')
@click.argument('file_path', type=click.Path(exists=True))
@click.option('--merchant-id', type=int, required=True, help='Merchant ID')
@click.option('--merchant-name', help='Merchant name')
@click.option('--chunk-size', type=int, help='Processing chunk size')
@click.option('--quality-threshold', type=float, help='Minimum quality score')
@click.option('--no-dedup', is_flag=True, help='Disable deduplication')
@click.option('--dry-run', is_flag=True, help='Validate without saving')
@click.pass_context
def ingest_csv(ctx, file_path, merchant_id, merchant_name, chunk_size, 
               quality_threshold, no_dedup, dry_run):
    """Ingest products from CSV file"""
    orchestrator = ctx.obj['orchestrator']
    
    click.echo(f"Starting ingestion for {file_path}")
    click.echo(f"Merchant: {merchant_name or 'Unknown'} (ID: {merchant_id})")
    
    if dry_run:
        click.echo("DRY RUN MODE - Validation only")
        # TODO: Implement validation-only mode
        return
    
    try:
        with click.progressbar(length=100, label='Processing') as bar:
            stats = orchestrator.run_ingestion(
                file_path,
                merchant_id,
                merchant_name,
                chunk_size=chunk_size or ctx.obj['config'].ingestion.chunk_size,
                quality_threshold=quality_threshold or ctx.obj['config'].ingestion.quality_threshold,
                enable_dedup=not no_dedup
            )
            bar.update(100)
        
        # Display results
        click.echo("\n✅ Ingestion Complete!")
        click.echo(f"Total Rows: {stats['total_rows']}")
        click.echo(f"Processed: {stats['processed']}")
        click.echo(f"Valid: {stats['valid']}")
        click.echo(f"Invalid: {stats['invalid']}")
        click.echo(f"Duplicates: {stats['duplicates']}")
        click.echo(f"New Products: {stats['new_products']}")
        click.echo(f"Updated Products: {stats['updated_products']}")
        
        if stats['errors']:
            click.echo(f"\n⚠️  Sample errors:")
            for error in stats['errors'][:3]:
                click.echo(f"  Row {error['row']}: {error['error']}")
    
    except Exception as e:
        click.echo(f"❌ Ingestion failed: {str(e)}", err=True)
        sys.exit(1)


@ingest.command('status')
@click.option('--last', type=int, default=10, help='Show last N ingestions')
@click.pass_context
def ingestion_status(ctx, last):
    """Check ingestion status and history"""
    manager = get_connection_manager()
    
    results = manager.execute_query("""
        SELECT 
            merchant_name,
            status,
            total_rows,
            new_products,
            processing_time_seconds,
            started_at
        FROM ingestion_logs
        ORDER BY started_at DESC
        LIMIT %s
    """, (last,))
    
    if results:
        headers = ['Merchant', 'Status', 'Rows', 'New Products', 'Time (s)', 'Started']
        rows = [
            [
                r['merchant_name'] or 'Unknown',
                r['status'],
                r['total_rows'],
                r['new_products'],
                r['processing_time_seconds'],
                r['started_at'].strftime('%Y-%m-%d %H:%M')
            ]
            for r in results
        ]
        click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    else:
        click.echo("No ingestion history found")


@cli.group()
def transform():
    """DBT transformation commands"""
    pass


@transform.command('run')
@click.option('--full-refresh', is_flag=True, help='Rebuild all tables')
@click.option('--models', help='Specific models to run')
@click.option('--exclude', help='Models to exclude')
@click.pass_context
def run_transformation(ctx, full_refresh, models, exclude):
    """Run DBT transformations"""
    orchestrator = ctx.obj['orchestrator']
    
    click.echo("Starting DBT transformation...")
    
    try:
        success = orchestrator.run_transformation(full_refresh)
        
        if success:
            click.echo("✅ Transformation completed successfully!")
        else:
            click.echo("❌ Transformation failed!", err=True)
            sys.exit(1)
    
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@transform.command('test')
@click.option('--models', help='Specific models to test')
@click.pass_context
def test_models(ctx, models):
    """Run DBT tests"""
    import subprocess
    
    cmd = ['dbt', 'test']
    if models:
        cmd.extend(['--select', models])
    
    click.echo("Running DBT tests...")
    result = subprocess.run(
        cmd,
        cwd=ctx.obj['config'].transformation.dbt_project_path,
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        click.echo("✅ All tests passed!")
    else:
        click.echo("❌ Some tests failed!", err=True)
        click.echo(result.stdout)
        sys.exit(1)


@cli.group()
def monitor():
    """Monitoring and health check commands"""
    pass


@monitor.command('quality')
@click.option('--format', type=click.Choice(['text', 'json', 'html']), default='text')
@click.option('--output', help='Output file path')
@click.pass_context
def check_quality(ctx, format, output):
    """Check data quality metrics"""
    db_url = ctx.obj['config'].database.url
    
    with DataQualityMonitor(db_url) as monitor:
        metrics = monitor.run_all_checks()
        report = monitor.generate_report(metrics, format=format)
        
        if output:
            with open(output, 'w') as f:
                f.write(report)
            click.echo(f"Report saved to {output}")
        else:
            click.echo(report)
        
        # Show alerts
        if metrics.alerts:
            click.echo("\n⚠️  ALERTS:")
            for alert in metrics.alerts:
                click.echo(f"  • {alert}")


@monitor.command('health')
@click.option('--continuous', is_flag=True, help='Run continuous monitoring')
@click.option('--interval', type=int, default=60, help='Check interval (seconds)')
@click.pass_context
def check_health(ctx, continuous, interval):
    """Check pipeline health"""
    db_url = ctx.obj['config'].database.url
    
    monitor = PipelineHealthMonitor(db_url)
    
    if continuous:
        click.echo(f"Starting continuous monitoring (interval: {interval}s)")
        click.echo("Press Ctrl+C to stop")
        monitor.monitor_continuous(interval)
    else:
        health = monitor.check_health()
        
        # Display health status
        status_colors = {
            'healthy': 'green',
            'degraded': 'yellow',
            'unhealthy': 'red',
            'critical': 'red'
        }
        
        click.secho(f"\nOVERALL STATUS: {health.overall_status.value.upper()}", 
                   fg=status_colors.get(health.overall_status.value, 'white'),
                   bold=True)
        
        # Show component health
        click.echo("\nCOMPONENT HEALTH:")
        click.echo(f"  Ingestion: {health.ingestion_health['status'].value}")
        click.echo(f"  Transformation: {health.transformation_health['status'].value}")
        click.echo(f"  Database: {health.database_health['status'].value}")
        
        # Show recommendations
        if health.recommendations:
            click.echo("\nRECOMMENDATIONS:")
            for rec in health.recommendations:
                click.echo(f"  • {rec}")


@cli.group()
def database():
    """Database management commands"""
    pass


@database.command('stats')
@click.pass_context
def db_stats(ctx):
    """Show database statistics"""
    manager = get_connection_manager()
    
    # Get table statistics
    results = manager.execute_query("""
        SELECT 
            schemaname,
            tablename,
            n_live_tup as rows,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY n_live_tup DESC
        LIMIT 20
    """)
    
    if results:
        headers = ['Schema', 'Table', 'Rows', 'Size']
        rows = [[r['schemaname'], r['tablename'], r['rows'], r['size']] for r in results]
        click.echo(tabulate(rows, headers=headers, tablefmt='grid'))
    
    # Show connection pool stats
    pool_stats = manager.get_pool_stats()
    click.echo(f"\nConnection Pool Statistics:")
    click.echo(json.dumps(pool_stats, indent=2))


@database.command('cleanup')
@click.option('--stale-days', type=int, default=180, help='Days to consider stale')
@click.option('--dry-run', is_flag=True, help='Show what would be deleted')
@click.pass_context
def cleanup_data(ctx, stale_days, dry_run):
    """Clean up stale data"""
    manager = get_connection_manager()
    
    # Find stale products
    results = manager.execute_query("""
        SELECT COUNT(*) as count
        FROM products
        WHERE updated_at < NOW() - INTERVAL '%s days'
            AND is_active = true
    """, (stale_days,), fetch='one')
    
    stale_count = results['count']
    
    if stale_count == 0:
        click.echo("No stale products found")
        return
    
    click.echo(f"Found {stale_count} stale products (>{stale_days} days old)")
    
    if dry_run:
        click.echo("DRY RUN - No data will be deleted")
    else:
        if click.confirm(f"Delete {stale_count} products?"):
            manager.execute_query("""
                UPDATE products
                SET is_active = false
                WHERE updated_at < NOW() - INTERVAL '%s days'
                    AND is_active = true
            """, (stale_days,), fetch='none')
            click.echo(f"✅ Marked {stale_count} products as inactive")


@cli.command('pipeline')
@click.argument('file_path', type=click.Path(exists=True))
@click.option('--merchant-id', type=int, required=True, help='Merchant ID')
@click.option('--merchant-name', help='Merchant name')
@click.pass_context
def run_pipeline(ctx, file_path, merchant_id, merchant_name):
    """Run complete pipeline (ingest + transform + monitor)"""
    orchestrator = ctx.obj['orchestrator']
    
    click.echo("Running complete pipeline...")
    
    try:
        # 1. Ingestion
        click.echo("\n1️⃣  INGESTION")
        stats = orchestrator.run_ingestion(file_path, merchant_id, merchant_name)
        click.echo(f"   ✅ Processed {stats['processed']} rows")
        
        # 2. Transformation
        click.echo("\n2️⃣  TRANSFORMATION")
        success = orchestrator.run_transformation()
        if success:
            click.echo("   ✅ DBT models updated")
        
        # 3. Monitoring
        click.echo("\n3️⃣  MONITORING")
        results = orchestrator.run_monitoring()
        click.echo(f"   Quality Score: {results['quality_metrics'].get('avg_quality_score', 'N/A'):.3f}")
        
        if results['alerts']:
            click.echo(f"   ⚠️  {len(results['alerts'])} alerts generated")
        
        click.echo("\n✅ Pipeline completed successfully!")
        
    except Exception as e:
        click.echo(f"\n❌ Pipeline failed: {str(e)}", err=True)
        sys.exit(1)


@cli.command('schedule')
@click.pass_context
def start_scheduler(ctx):
    """Start the pipeline scheduler"""
    orchestrator = ctx.obj['orchestrator']
    
    click.echo("Starting pipeline scheduler...")
    click.echo(f"Environment: {ctx.obj['config'].environment.value}")
    click.echo(f"Monitoring interval: {ctx.obj['config'].monitoring.check_interval_minutes} minutes")
    click.echo("\nPress Ctrl+C to stop")
    
    orchestrator.schedule_jobs()
    orchestrator.run_scheduler()


@cli.command('config')
@click.option('--show', is_flag=True, help='Show configuration')
@click.option('--save', help='Save configuration to file')
@click.pass_context
def manage_config(ctx, show, save):
    """Manage pipeline configuration"""
    config_manager = get_config_manager()
    
    if show:
        import yaml
        from dataclasses import asdict
        config_dict = asdict(ctx.obj['config'])
        config_dict['environment'] = ctx.obj['config'].environment.value
        click.echo(yaml.dump(config_dict, default_flow_style=False, indent=2))
    
    if save:
        config_manager.save_config(save)
        click.echo(f"Configuration saved to {save}")


if __name__ == '__main__':
    cli(obj={})