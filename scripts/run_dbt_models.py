#!/usr/bin/env python
"""
Run DBT models for data transformation.
This script orchestrates the DBT transformation pipeline.
"""

import subprocess
import sys
import os
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_dbt_command(command: str, check=True):
    """Run a DBT command and return the result."""
    cmd_list = command.split()
    logger.info(f"Running: {command}")
    
    try:
        result = subprocess.run(
            cmd_list,
            capture_output=True,
            text=True,
            check=check,
            cwd='dbt-project'
        )
        
        if result.stdout:
            logger.info(result.stdout)
        
        if result.stderr and result.returncode != 0:
            logger.error(result.stderr)
        
        return result
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {e}")
        if e.stdout:
            logger.error(f"stdout: {e.stdout}")
        if e.stderr:
            logger.error(f"stderr: {e.stderr}")
        raise


def setup_dbt():
    """Setup DBT environment."""
    logger.info("Setting up DBT environment...")
    
    # Set environment variables
    os.environ['DB_HOST'] = os.getenv('DB_HOST', 'localhost')
    os.environ['DB_PORT'] = os.getenv('DB_PORT', '5432')
    os.environ['DB_USER'] = os.getenv('DB_USER', 'postgres')
    os.environ['DB_PASSWORD'] = os.getenv('DB_PASSWORD', 'postgres')
    os.environ['DB_NAME'] = os.getenv('DB_NAME', 'greenthumb_dev')
    
    # Check DBT installation
    try:
        result = subprocess.run(['dbt', '--version'], capture_output=True, text=True)
        logger.info(f"DBT Version: {result.stdout.split()[2] if result.stdout else 'Unknown'}")
    except FileNotFoundError:
        logger.error("DBT is not installed. Install with: pip install dbt-postgres")
        sys.exit(1)


def run_dbt_pipeline(full_refresh=False, models=None, test=True):
    """
    Run the DBT transformation pipeline.
    
    Args:
        full_refresh: Whether to rebuild all tables from scratch
        models: Specific models to run (None for all)
        test: Whether to run tests after transformation
    """
    logger.info("=" * 60)
    logger.info("Starting DBT Transformation Pipeline")
    logger.info("=" * 60)
    
    setup_dbt()
    
    # Test connection
    logger.info("Testing database connection...")
    run_dbt_command("dbt debug")
    
    # Run seeds (reference data)
    logger.info("Loading seed data...")
    run_dbt_command("dbt seed")
    
    # Run models
    if models:
        model_selector = f"--select {models}"
    else:
        model_selector = ""
    
    refresh_flag = "--full-refresh" if full_refresh else ""
    
    logger.info(f"Running models{' (full refresh)' if full_refresh else ''}...")
    run_dbt_command(f"dbt run {model_selector} {refresh_flag}")
    
    # Run tests
    if test:
        logger.info("Running tests...")
        result = run_dbt_command(f"dbt test {model_selector}", check=False)
        
        if result.returncode != 0:
            logger.warning("Some tests failed. Check the output above.")
    
    logger.info("=" * 60)
    logger.info("DBT Pipeline Complete!")
    logger.info("=" * 60)
    
    # Print summary
    print_summary()


def print_summary():
    """Print a summary of the transformed data."""
    try:
        import psycopg2
        from psycopg2 import sql
        
        # Connect to database
        conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            port=os.environ['DB_PORT'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )
        
        cursor = conn.cursor()
        
        # Check product catalog
        cursor.execute("""
            SELECT 
                COUNT(*) as total_products,
                COUNT(DISTINCT merchant_id) as merchants,
                COUNT(DISTINCT brand_name) as brands,
                COUNT(DISTINCT category_name) as categories,
                AVG(quality_score) as avg_quality,
                AVG(search_price) as avg_price
            FROM marts.product_catalog
        """)
        
        result = cursor.fetchone()
        
        if result:
            logger.info("\n=== Product Catalog Summary ===")
            logger.info(f"Total Products: {result[0]:,}")
            logger.info(f"Merchants: {result[1]}")
            logger.info(f"Brands: {result[2]}")
            logger.info(f"Categories: {result[3]}")
            logger.info(f"Avg Quality Score: {result[4]:.3f}")
            logger.info(f"Avg Price: £{result[5]:.2f}")
        
        # Check quality distribution
        cursor.execute("""
            SELECT 
                quality_tier,
                COUNT(*) as count
            FROM marts.product_catalog
            GROUP BY quality_tier
            ORDER BY quality_tier
        """)
        
        logger.info("\n=== Quality Distribution ===")
        for row in cursor.fetchall():
            logger.info(f"{row[0]}: {row[1]:,} products")
        
        # Check freshness
        cursor.execute("""
            SELECT 
                freshness_status,
                COUNT(*) as count
            FROM marts.product_catalog
            GROUP BY freshness_status
            ORDER BY 
                CASE freshness_status
                    WHEN 'fresh' THEN 1
                    WHEN 'recent' THEN 2
                    WHEN 'aging' THEN 3
                    WHEN 'stale' THEN 4
                    WHEN 'very_stale' THEN 5
                END
        """)
        
        logger.info("\n=== Freshness Distribution ===")
        for row in cursor.fetchall():
            logger.info(f"{row[0]}: {row[1]:,} products")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        logger.warning(f"Could not generate summary: {e}")


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run DBT transformation pipeline')
    parser.add_argument(
        '--full-refresh',
        action='store_true',
        help='Rebuild all tables from scratch'
    )
    parser.add_argument(
        '--models',
        help='Specific models to run (e.g., stg_products or +product_catalog)'
    )
    parser.add_argument(
        '--no-test',
        action='store_true',
        help='Skip running tests'
    )
    
    args = parser.parse_args()
    
    try:
        run_dbt_pipeline(
            full_refresh=args.full_refresh,
            models=args.models,
            test=not args.no_test
        )
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()