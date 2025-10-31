#!/usr/bin/env python
"""
Product Ingestion Script
Ingests product data from CSV files into the database.
"""

import argparse
import sys
import os
from pathlib import Path
import logging
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ingestion.csv_processor import CSVIngestionPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/ingestion/ingestion_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def main():
    """Main ingestion function."""
    parser = argparse.ArgumentParser(description='Ingest product CSV data')
    parser.add_argument(
        'csv_file',
        help='Path to CSV file'
    )
    parser.add_argument(
        '--merchant-id',
        type=int,
        required=True,
        help='Merchant ID'
    )
    parser.add_argument(
        '--merchant-name',
        help='Merchant name'
    )
    parser.add_argument(
        '--chunk-size',
        type=int,
        default=1000,
        help='Number of rows to process at once (default: 1000)'
    )
    parser.add_argument(
        '--quality-threshold',
        type=float,
        default=0.3,
        help='Minimum quality score to accept (default: 0.3)'
    )
    parser.add_argument(
        '--no-dedup',
        action='store_true',
        help='Disable deduplication'
    )
    parser.add_argument(
        '--resume-from',
        type=int,
        default=0,
        help='Resume from specific row (for recovery)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate without saving to database'
    )
    
    args = parser.parse_args()
    
    # Validate file exists
    if not Path(args.csv_file).exists():
        logger.error(f"File not found: {args.csv_file}")
        sys.exit(1)
    
    # Get database URL
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
    )
    
    # Log configuration
    logger.info("=" * 60)
    logger.info("Product Ingestion Starting")
    logger.info("=" * 60)
    logger.info(f"CSV File: {args.csv_file}")
    logger.info(f"File Size: {Path(args.csv_file).stat().st_size / (1024*1024):.1f} MB")
    logger.info(f"Merchant: {args.merchant_name} (ID: {args.merchant_id})")
    logger.info(f"Chunk Size: {args.chunk_size}")
    logger.info(f"Quality Threshold: {args.quality_threshold}")
    logger.info(f"Deduplication: {not args.no_dedup}")
    
    if args.dry_run:
        logger.info("DRY RUN MODE - No data will be saved")
        return
    
    try:
        # Create pipeline
        pipeline = CSVIngestionPipeline(
            db_url=db_url,
            chunk_size=args.chunk_size,
            quality_threshold=args.quality_threshold,
            enable_dedup=not args.no_dedup
        )
        
        # Process CSV
        stats = pipeline.process_csv(
            file_path=args.csv_file,
            merchant_id=args.merchant_id,
            merchant_name=args.merchant_name,
            resume_from_row=args.resume_from
        )
        
        # Print summary
        logger.info("=" * 60)
        logger.info("Ingestion Complete!")
        logger.info("=" * 60)
        logger.info("Summary:")
        logger.info(f"  Total Rows: {stats['total_rows']}")
        logger.info(f"  Processed: {stats['processed']}")
        logger.info(f"  Valid: {stats['valid']}")
        logger.info(f"  Invalid: {stats['invalid']}")
        logger.info(f"  Duplicates: {stats['duplicates']}")
        logger.info(f"  Low Quality: {stats['low_quality']}")
        logger.info(f"  New Products: {stats['new_products']}")
        logger.info(f"  Updated Products: {stats['updated_products']}")
        
        if stats['invalid'] > 0:
            logger.warning(f"  {stats['invalid']} rows failed validation")
            
        if stats['errors']:
            logger.warning("Sample validation errors:")
            for error in stats['errors'][:5]:
                logger.warning(f"  Row {error['row']}: {error['error']}")
        
        # Success rate
        success_rate = (stats['valid'] / stats['processed'] * 100) if stats['processed'] > 0 else 0
        logger.info(f"  Success Rate: {success_rate:.1f}%")
        
    except Exception as e:
        logger.error(f"Ingestion failed: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
    