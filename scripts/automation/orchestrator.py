#!/usr/bin/env python
"""
Main Automation Orchestrator for GreenThumb Discovery Pipeline
Coordinates ingestion, transformation, and monitoring processes.
"""

import argparse
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import logging
import json
import time
from typing import Dict, List, Optional, Any
import schedule
import subprocess

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ingestion.csv_processor import CSVIngestionPipeline
from scripts.monitoring.data_quality_monitor import DataQualityMonitor
from scripts.monitoring.pipeline_health import PipelineHealthMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/automation/orchestrator_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Orchestrates the entire data pipeline including:
    - CSV ingestion
    - DBT transformations
    - Quality monitoring
    - Health checks
    """
    
    def __init__(self, config_file: Optional[str] = None):
        """Initialize the orchestrator with configuration."""
        self.config = self._load_config(config_file)
        self.db_url = os.getenv(
            'DATABASE_URL',
            self.config.get('database_url', 'postgresql://postgres:postgres@localhost:5432/greenthumb_dev')
        )
        
        # Initialize monitors
        self.quality_monitor = DataQualityMonitor(self.db_url)
        self.health_monitor = PipelineHealthMonitor(self.db_url)
        
        # Pipeline state
        self.state = {
            'last_ingestion': None,
            'last_transformation': None,
            'last_monitoring': None,
            'active_jobs': [],
            'failed_jobs': []
        }
        
    def _load_config(self, config_file: Optional[str]) -> Dict:
        """Load configuration from file or use defaults."""
        default_config = {
            'ingestion': {
                'chunk_size': 1000,
                'quality_threshold': 0.3,
                'enable_dedup': True,
                'max_retries': 3
            },
            'transformation': {
                'dbt_project_path': 'dbt-project',
                'full_refresh_interval_days': 7,
                'models_to_run': None  # Run all models
            },
            'monitoring': {
                'check_interval_minutes': 30,
                'alert_thresholds': {
                    'quality_score': 0.5,
                    'success_rate': 0.8,
                    'stale_percentage': 0.2
                }
            },
            'scheduling': {
                'ingestion_schedule': '0 */6 * * *',  # Every 6 hours
                'transformation_schedule': '0 */4 * * *',  # Every 4 hours
                'monitoring_schedule': '*/30 * * * *'  # Every 30 minutes
            }
        }
        
        if config_file and Path(config_file).exists():
            with open(config_file, 'r') as f:
                user_config = json.load(f)
                # Merge with defaults
                for key, value in user_config.items():
                    if isinstance(value, dict):
                        default_config[key].update(value)
                    else:
                        default_config[key] = value
        
        return default_config
    
    def run_ingestion(
        self,
        csv_file: str,
        merchant_id: int,
        merchant_name: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run CSV ingestion with monitoring and error handling.
        
        Args:
            csv_file: Path to CSV file
            merchant_id: Merchant identifier
            merchant_name: Optional merchant name
            **kwargs: Additional parameters for ingestion
            
        Returns:
            Ingestion statistics
        """
        logger.info(f"Starting ingestion for {csv_file}")
        job_id = f"ingest_{merchant_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.state['active_jobs'].append({
            'id': job_id,
            'type': 'ingestion',
            'started_at': datetime.now(),
            'file': csv_file,
            'merchant_id': merchant_id
        })
        
        try:
            # Create pipeline with config
            pipeline = CSVIngestionPipeline(
                db_url=self.db_url,
                chunk_size=kwargs.get('chunk_size', self.config['ingestion']['chunk_size']),
                quality_threshold=kwargs.get('quality_threshold', self.config['ingestion']['quality_threshold']),
                enable_dedup=kwargs.get('enable_dedup', self.config['ingestion']['enable_dedup'])
            )
            
            # Run ingestion
            stats = pipeline.process_csv(
                file_path=csv_file,
                merchant_id=merchant_id,
                merchant_name=merchant_name,
                resume_from_row=kwargs.get('resume_from_row', 0)
            )
            
            # Update state
            self.state['last_ingestion'] = {
                'timestamp': datetime.now(),
                'file': csv_file,
                'merchant_id': merchant_id,
                'stats': stats
            }
            
            # Remove from active jobs
            self.state['active_jobs'] = [
                job for job in self.state['active_jobs'] 
                if job['id'] != job_id
            ]
            
            logger.info(f"Ingestion completed: {stats}")
            
            # Trigger transformation if configured
            if self.config.get('auto_transform', True):
                self.run_transformation()
            
            return stats
            
        except Exception as e:
            logger.error(f"Ingestion failed: {str(e)}")
            
            # Track failed job
            self.state['failed_jobs'].append({
                'id': job_id,
                'type': 'ingestion',
                'failed_at': datetime.now(),
                'error': str(e)
            })
            
            # Retry logic
            retries = kwargs.get('retries', 0)
            if retries < self.config['ingestion']['max_retries']:
                logger.info(f"Retrying ingestion (attempt {retries + 1})")
                time.sleep(10 * (retries + 1))  # Exponential backoff
                return self.run_ingestion(
                    csv_file, merchant_id, merchant_name,
                    retries=retries + 1,
                    **kwargs
                )
            
            raise
    
    def run_transformation(self, full_refresh: bool = False) -> bool:
        """
        Run DBT transformations.
        
        Args:
            full_refresh: Whether to rebuild all tables
            
        Returns:
            Success status
        """
        logger.info("Starting DBT transformation")
        job_id = f"transform_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.state['active_jobs'].append({
            'id': job_id,
            'type': 'transformation',
            'started_at': datetime.now()
        })
        
        try:
            # Determine if full refresh needed
            if not full_refresh and self.state['last_transformation']:
                days_since = (datetime.now() - self.state['last_transformation']['timestamp']).days
                if days_since >= self.config['transformation']['full_refresh_interval_days']:
                    logger.info(f"Triggering full refresh (last was {days_since} days ago)")
                    full_refresh = True
            
            # Build DBT command
            cmd = ['dbt', 'run']
            
            if full_refresh:
                cmd.append('--full-refresh')
            
            if self.config['transformation']['models_to_run']:
                cmd.extend(['--select', self.config['transformation']['models_to_run']])
            
            # Run DBT
            logger.info(f"Running command: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                cwd=self.config['transformation']['dbt_project_path'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("DBT transformation successful")
                
                # Run tests
                test_result = subprocess.run(
                    ['dbt', 'test'],
                    cwd=self.config['transformation']['dbt_project_path'],
                    capture_output=True,
                    text=True
                )
                
                if test_result.returncode != 0:
                    logger.warning("Some DBT tests failed")
                
                # Update state
                self.state['last_transformation'] = {
                    'timestamp': datetime.now(),
                    'full_refresh': full_refresh,
                    'success': True
                }
                
                return True
            else:
                raise Exception(f"DBT failed: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Transformation failed: {str(e)}")
            
            self.state['failed_jobs'].append({
                'id': job_id,
                'type': 'transformation',
                'failed_at': datetime.now(),
                'error': str(e)
            })
            
            return False
        finally:
            # Remove from active jobs
            self.state['active_jobs'] = [
                job for job in self.state['active_jobs'] 
                if job['id'] != job_id
            ]
    
    def run_monitoring(self) -> Dict[str, Any]:
        """
        Run all monitoring checks.
        
        Returns:
            Monitoring results
        """
        logger.info("Running monitoring checks")
        
        results = {
            'timestamp': datetime.now(),
            'quality_metrics': {},
            'health_metrics': {},
            'alerts': []
        }
        
        try:
            # Run quality monitoring
            quality_results = self.quality_monitor.run_all_checks()
            results['quality_metrics'] = quality_results
            
            # Run health monitoring
            health_results = self.health_monitor.check_health()
            results['health_metrics'] = health_results
            
            # Check for alerts
            alerts = self._check_alert_conditions(quality_results, health_results)
            results['alerts'] = alerts
            
            if alerts:
                logger.warning(f"Monitoring alerts: {alerts}")
                self._send_alerts(alerts)
            
            # Update state
            self.state['last_monitoring'] = results
            
            return results
            
        except Exception as e:
            logger.error(f"Monitoring failed: {str(e)}")
            results['error'] = str(e)
            return results
    
    def _check_alert_conditions(
        self,
        quality_results: Dict,
        health_results: Dict
    ) -> List[Dict]:
        """Check for alert conditions based on thresholds."""
        alerts = []
        thresholds = self.config['monitoring']['alert_thresholds']
        
        # Check quality score
        if quality_results.get('avg_quality_score', 1) < thresholds['quality_score']:
            alerts.append({
                'type': 'quality',
                'severity': 'high',
                'message': f"Average quality score below threshold: {quality_results['avg_quality_score']:.2f}",
                'threshold': thresholds['quality_score'],
                'value': quality_results['avg_quality_score']
            })
        
        # Check success rate
        if health_results.get('ingestion_success_rate', 1) < thresholds['success_rate']:
            alerts.append({
                'type': 'ingestion',
                'severity': 'high',
                'message': f"Ingestion success rate below threshold: {health_results['ingestion_success_rate']:.2%}",
                'threshold': thresholds['success_rate'],
                'value': health_results['ingestion_success_rate']
            })
        
        # Check stale data
        if quality_results.get('stale_percentage', 0) > thresholds['stale_percentage']:
            alerts.append({
                'type': 'freshness',
                'severity': 'medium',
                'message': f"High percentage of stale data: {quality_results['stale_percentage']:.2%}",
                'threshold': thresholds['stale_percentage'],
                'value': quality_results['stale_percentage']
            })
        
        return alerts
    
    def _send_alerts(self, alerts: List[Dict]):
        """Send alerts via configured channels."""
        # This would integrate with your alerting system
        # For now, just log them
        for alert in alerts:
            logger.warning(f"ALERT [{alert['severity']}]: {alert['message']}")
    
    def schedule_jobs(self):
        """
        Set up scheduled jobs based on configuration.
        """
        logger.info("Setting up scheduled jobs")
        
        # Schedule monitoring
        schedule.every(self.config['monitoring']['check_interval_minutes']).minutes.do(
            self.run_monitoring
        )
        
        logger.info(f"Scheduled monitoring every {self.config['monitoring']['check_interval_minutes']} minutes")
        
        # Note: For production, you'd use proper cron scheduling
        # This is a simple example
    
    def run_scheduler(self):
        """Run the scheduler loop."""
        logger.info("Starting scheduler")
        
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def get_status(self) -> Dict[str, Any]:
        """Get current orchestrator status."""
        return {
            'state': self.state,
            'config': self.config,
            'active_jobs': len(self.state['active_jobs']),
            'failed_jobs': len(self.state['failed_jobs'][-10:])  # Last 10 failures
        }


def main():
    """Main orchestrator CLI."""
    parser = argparse.ArgumentParser(description='GreenThumb Pipeline Orchestrator')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Ingestion command
    ingest_parser = subparsers.add_parser('ingest', help='Run ingestion')
    ingest_parser.add_argument('csv_file', help='Path to CSV file')
    ingest_parser.add_argument('--merchant-id', type=int, required=True)
    ingest_parser.add_argument('--merchant-name', help='Merchant name')
    ingest_parser.add_argument('--chunk-size', type=int, default=1000)
    ingest_parser.add_argument('--quality-threshold', type=float, default=0.3)
    ingest_parser.add_argument('--no-dedup', action='store_true')
    
    # Transform command
    transform_parser = subparsers.add_parser('transform', help='Run DBT transformation')
    transform_parser.add_argument('--full-refresh', action='store_true')
    transform_parser.add_argument('--models', help='Specific models to run')
    
    # Monitor command
    monitor_parser = subparsers.add_parser('monitor', help='Run monitoring checks')
    monitor_parser.add_argument('--output-format', choices=['json', 'text'], default='text')
    
    # Schedule command
    schedule_parser = subparsers.add_parser('schedule', help='Start scheduler')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Get orchestrator status')
    
    # Full pipeline command
    pipeline_parser = subparsers.add_parser('pipeline', help='Run full pipeline')
    pipeline_parser.add_argument('csv_file', help='Path to CSV file')
    pipeline_parser.add_argument('--merchant-id', type=int, required=True)
    pipeline_parser.add_argument('--merchant-name', help='Merchant name')
    
    # Config option
    parser.add_argument('--config', help='Configuration file path')
    
    args = parser.parse_args()
    
    # Initialize orchestrator
    orchestrator = PipelineOrchestrator(args.config)
    
    if args.command == 'ingest':
        stats = orchestrator.run_ingestion(
            args.csv_file,
            args.merchant_id,
            args.merchant_name,
            chunk_size=args.chunk_size,
            quality_threshold=args.quality_threshold,
            enable_dedup=not args.no_dedup
        )
        print(json.dumps(stats, indent=2))
    
    elif args.command == 'transform':
        success = orchestrator.run_transformation(args.full_refresh)
        sys.exit(0 if success else 1)
    
    elif args.command == 'monitor':
        results = orchestrator.run_monitoring()
        if args.output_format == 'json':
            print(json.dumps(results, indent=2, default=str))
        else:
            print(f"Quality Metrics: {results['quality_metrics']}")
            print(f"Health Metrics: {results['health_metrics']}")
            if results['alerts']:
                print(f"Alerts: {results['alerts']}")
    
    elif args.command == 'schedule':
        orchestrator.schedule_jobs()
        orchestrator.run_scheduler()
    
    elif args.command == 'status':
        status = orchestrator.get_status()
        print(json.dumps(status, indent=2, default=str))
    
    elif args.command == 'pipeline':
        # Run full pipeline
        logger.info("Running full pipeline")
        
        # 1. Ingestion
        stats = orchestrator.run_ingestion(
            args.csv_file,
            args.merchant_id,
            args.merchant_name
        )
        
        # 2. Transformation
        orchestrator.run_transformation()
        
        # 3. Monitoring
        results = orchestrator.run_monitoring()
        
        print("Pipeline completed successfully!")
        print(f"Ingestion: {stats['processed']} rows processed")
        print(f"Quality: {results['quality_metrics'].get('avg_quality_score', 'N/A')}")
        print(f"Alerts: {len(results['alerts'])}")
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()