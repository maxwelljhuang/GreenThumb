"""
CSV Ingestion Pipeline
Processes large CSV files in chunks with validation and error handling.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any
import logging
from datetime import datetime
import asyncio
from uuid import uuid4
import traceback

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

from backend.models.product import ProductIngestion, ProductCanonical
from backend.models.quality import ContentModerator, PriceValidator

from backend.ingestion.deduplication import AdvancedDeduplicator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CSVIngestionPipeline:
    """
    Main CSV ingestion pipeline.
    Handles chunked reading, validation, and database operations.
    """
    
    def __init__(
        self, 
        db_url: str,
        chunk_size: int = 1000,
        quality_threshold: float = 0.3,
        enable_dedup: bool = True
    ):
        """
        Initialize the ingestion pipeline.
        
        Args:
            db_url: Database connection URL
            chunk_size: Number of rows to process at once
            quality_threshold: Minimum quality score to accept product
            enable_dedup: Whether to check for duplicates
        """
        self.chunk_size = chunk_size
        self.quality_threshold = quality_threshold
        self.enable_dedup = enable_dedup
        
        # Database setup
        self.engine = create_engine(
            db_url,
            poolclass=NullPool,  # Don't pool connections for batch operations
            echo=False
        )
        self.Session = sessionmaker(bind=self.engine)
        
        # Statistics tracking
        self.stats = {
            'total_rows': 0,
            'processed': 0,
            'valid': 0,
            'invalid': 0,
            'duplicates': 0,
            'low_quality': 0,
            'new_products': 0,
            'updated_products': 0,
            'errors': []
        }
        self.deduplicator = AdvancedDeduplicator(
                            fuzzy_threshold=0.85,
                            cluster_min_similarity=0.70
                            ) 
        if enable_dedup else None
        
    def process_csv(
        self,
        file_path: str,
        merchant_id: int,
        merchant_name: str = None,
        resume_from_row: int = 0
    ) -> Dict[str, Any]:
        """
        Process a CSV file with products.
        
        Args:
            file_path: Path to CSV file
            merchant_id: Merchant identifier
            merchant_name: Optional merchant name
            resume_from_row: Row to resume from (for recovery)
            
        Returns:
            Processing statistics
        """
        start_time = datetime.now()
        ingestion_log_id = self._create_ingestion_log(
            file_path, merchant_id, merchant_name
        )
        
        logger.info(f"Starting ingestion for {file_path}")
        logger.info(f"Merchant: {merchant_name} (ID: {merchant_id})")
        
        try:
            # Count total rows first
            total_rows = sum(1 for _ in open(file_path)) - 1  # Subtract header
            self.stats['total_rows'] = total_rows
            logger.info(f"Total rows to process: {total_rows}")
            
            # Process in chunks
            chunk_iterator = pd.read_csv(
                file_path,
                chunksize=self.chunk_size,
                skiprows=range(1, resume_from_row + 1) if resume_from_row > 0 else None,
                na_values=['', 'N/A', 'None', 'null'],
                low_memory=False,
                encoding='utf-8',
                on_bad_lines='skip'
            )
            
            for chunk_num, chunk_df in enumerate(chunk_iterator):
                current_row = resume_from_row + (chunk_num * self.chunk_size)
                logger.info(f"Processing chunk {chunk_num + 1} (rows {current_row}-{current_row + len(chunk_df)})")
                
                # Add merchant info to chunk
                chunk_df['merchant_id'] = merchant_id
                if merchant_name:
                    chunk_df['merchant_name'] = merchant_name
                
                # Process chunk
                self._process_chunk(chunk_df, ingestion_log_id)
                
                # Log progress
                progress_pct = (self.stats['processed'] / total_rows) * 100
                logger.info(f"Progress: {self.stats['processed']}/{total_rows} ({progress_pct:.1f}%)")
                
                # Periodic stats logging
                if chunk_num % 10 == 0:
                    self._log_statistics()
            
            # Final statistics
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            self._complete_ingestion_log(
                ingestion_log_id,
                processing_time,
                'completed'
            )
            
            logger.info(f"Ingestion completed in {processing_time:.1f} seconds")
            self._log_statistics()
            
            return self.stats
            
        except Exception as e:
            logger.error(f"Ingestion failed: {str(e)}")
            logger.error(traceback.format_exc())
            
            self._complete_ingestion_log(
                ingestion_log_id,
                0,
                'failed',
                str(e)
            )
            
            raise
    
    def _process_chunk(self, df: pd.DataFrame, ingestion_log_id: str):
        """Process a single chunk of data."""
        session = self.Session()
        
        try:
            # Convert DataFrame rows to dicts
            records = df.to_dict('records')
            
            validated_products = []
            invalid_products = []
            
            for row_idx, record in enumerate(records):
                self.stats['processed'] += 1
                
                # Clean the record
                record = self._clean_record(record)
                
                try:
                    # Validate with Pydantic
                    product = ProductIngestion(**record)
                    
                    # Check quality threshold
                    if product.quality_score < self.quality_threshold:
                        self.stats['low_quality'] += 1
                        self._log_quality_issue(
                            session,
                            product,
                            ingestion_log_id,
                            'low_quality_score'
                        )
                        continue
                    
                    # Check for NSFW/spam
                    is_nsfw, nsfw_reason = ContentModerator.check_nsfw(record)
                    if is_nsfw:
                        self._log_quality_issue(
                            session,
                            product,
                            ingestion_log_id,
                            'nsfw_content',
                            nsfw_reason
                        )
                        continue
                    
                    validated_products.append(product)
                    self.stats['valid'] += 1
                    
                except Exception as e:
                    self.stats['invalid'] += 1
                    invalid_products.append({
                        'record': record,
                        'error': str(e),
                        'row': self.stats['processed']
                    })
                    
                    # Log first few errors in detail
                    if len(self.stats['errors']) < 10:
                        self.stats['errors'].append({
                            'row': self.stats['processed'],
                            'error': str(e)[:200]
                        })
            
            # Process validated products
            if validated_products:
                if self.enable_dedup:
                    unique_products = self._deduplicate_batch(
                        session, validated_products
                    )
                else:
                    unique_products = validated_products
                
                # Save to database
                self._save_products(session, unique_products, ingestion_log_id)
            
            session.commit()
            
        except Exception as e:
            session.rollback()
            logger.error(f"Chunk processing failed: {str(e)}")
            raise
        finally:
            session.close()
    
    def _clean_record(self, record: Dict) -> Dict:
        """Clean a record before validation."""
        # Remove completely empty values
        cleaned = {}
        for key, value in record.items():
            if pd.notna(value) and value != '':
                # Convert numpy types to Python types
                if isinstance(value, np.integer):
                    value = int(value)
                elif isinstance(value, np.floating):
                    value = float(value)
                elif isinstance(value, np.bool_):
                    value = bool(value)
                    
                cleaned[key] = value
        
        return cleaned
    
    def _deduplicate_batch(
        self,
        session: Session,
        products: List[ProductIngestion]
        ) -> List[ProductIngestion]:
        """Use advanced deduplication service."""
        if not self.deduplicator:
            return products
        
        # Run advanced deduplication
        unique_products, duplicate_clusters = self.deduplicator.deduplicate_batch(
            products,
            check_database=True,
            session=session
        )
        
        # Merge duplicate clusters in database
        if duplicate_clusters:
            self.deduplicator.merge_duplicate_clusters(session, duplicate_clusters)
    
        return unique_products
    
    def _get_existing_hashes(
        self,
        session: Session,
        hashes: List[str]
    ) -> set:
        """Get existing product hashes from database."""
        if not hashes:
            return set()
        
        result = session.execute(
            text("""
                SELECT DISTINCT product_hash 
                FROM products 
                WHERE product_hash = ANY(:hashes)
            """),
            {"hashes": hashes}
        )
        
        return {row[0] for row in result}
    
    def _save_products(
        self,
        session: Session,
        products: List[ProductIngestion],
        ingestion_log_id: str
    ):
        """Save products to database."""
        for product in products:
            # Convert to canonical model
            canonical = ProductCanonical.from_ingestion(product)
            
            # Check if product exists (by merchant_id + merchant_product_id)
            existing = session.execute(
                text("""
                    SELECT id FROM products 
                    WHERE merchant_id = :merchant_id 
                    AND merchant_product_id = :product_id
                    LIMIT 1
                """),
                {
                    'merchant_id': canonical.merchant_id,
                    'product_id': canonical.merchant_product_id
                }
            ).first()
            
            if existing:
                # Update existing product
                self._update_product(session, existing[0], canonical)
                self.stats['updated_products'] += 1
            else:
                # Insert new product
                self._insert_product(session, canonical, ingestion_log_id)
                self.stats['new_products'] += 1
    
    def _insert_product(
        self,
        session: Session,
        product: ProductCanonical,
        ingestion_log_id: str
    ):
        """Insert a new product."""
        product_id = str(uuid4())
        
        session.execute(
            text("""
                INSERT INTO products (
                    id, merchant_product_id, merchant_id, product_name,
                    merchant_name, aw_product_id, brand_name, brand_id,
                    description, category_name, category_id,
                    search_price, store_price, rrp_price, currency,
                    merchant_image_url, aw_image_url, alternate_images,
                    fashion_category, fashion_size, colour,
                    in_stock, stock_quantity,
                    quality_score, product_hash, is_active
                ) VALUES (
                    :id, :merchant_product_id, :merchant_id, :product_name,
                    :merchant_name, :aw_product_id, :brand_name, :brand_id,
                    :description, :category_name, :category_id,
                    :search_price, :store_price, :rrp_price, :currency,
                    :merchant_image_url, :aw_image_url, :alternate_images,
                    :fashion_category, :fashion_size, :colour,
                    :in_stock, :stock_quantity,
                    :quality_score, :product_hash, :is_active
                )
            """),
            {
                'id': product_id,
                'merchant_product_id': product.merchant_product_id,
                'merchant_id': product.merchant_id,
                'product_name': product.product_name,
                'merchant_name': product.merchant_name,
                'aw_product_id': product.aw_product_id,
                'brand_name': product.brand_name,
                'brand_id': product.brand_id,
                'description': product.description,
                'category_name': product.category_name,
                'category_id': product.category_id,
                'search_price': product.search_price,
                'store_price': product.store_price,
                'rrp_price': product.rrp_price,
                'currency': product.currency,
                'merchant_image_url': product.merchant_image_url,
                'aw_image_url': product.aw_image_url,
                'alternate_images': product.alternate_images,
                'fashion_category': product.fashion_category,
                'fashion_size': product.fashion_size,
                'colour': product.colour,
                'in_stock': product.in_stock,
                'stock_quantity': product.stock_quantity,
                'quality_score': product.quality_score,
                'product_hash': product.dedup_hash,
                'is_active': True
            }
        )
        
        # Log quality issues if any
        if product.quality_issues:
            for issue in product.quality_issues:
                self._log_quality_issue(
                    session,
                    product,
                    ingestion_log_id,
                    issue.get('issue', 'unknown'),
                    details=issue
                )
    
    def _update_product(
        self,
        session: Session,
        product_id: str,
        product: ProductCanonical
    ):
        """Update an existing product."""
        session.execute(
            text("""
                UPDATE products SET
                    product_name = :product_name,
                    description = :description,
                    search_price = :search_price,
                    store_price = :store_price,
                    rrp_price = :rrp_price,
                    merchant_image_url = :merchant_image_url,
                    in_stock = :in_stock,
                    stock_quantity = :stock_quantity,
                    quality_score = :quality_score,
                    updated_at = NOW()
                WHERE id = :id
            """),
            {
                'id': product_id,
                'product_name': product.product_name,
                'description': product.description,
                'search_price': product.search_price,
                'store_price': product.store_price,
                'rrp_price': product.rrp_price,
                'merchant_image_url': product.merchant_image_url,
                'in_stock': product.in_stock,
                'stock_quantity': product.stock_quantity,
                'quality_score': product.quality_score
            }
        )
    
    def _log_quality_issue(
        self,
        session: Session,
        product: Any,
        ingestion_log_id: str,
        issue_type: str,
        details: Any = None
    ):
        """Log a quality issue."""
        session.execute(
            text("""
                INSERT INTO data_quality_issues (
                    ingestion_log_id, issue_type, severity,
                    field_name, details
                ) VALUES (
                    :log_id, :issue_type, :severity,
                    :field_name, :details
                )
            """),
            {
                'log_id': ingestion_log_id,
                'issue_type': issue_type,
                'severity': 'warning',
                'field_name': 'product',
                'details': str(details)[:500] if details else None
            }
        )
    
    def _create_ingestion_log(
        self,
        file_path: str,
        merchant_id: int,
        merchant_name: str = None
    ) -> str:
        """Create an ingestion log entry."""
        session = self.Session()
        log_id = str(uuid4())
        
        try:
            session.execute(
                text("""
                    INSERT INTO ingestion_logs (
                        id, feed_name, merchant_id, merchant_name,
                        status, started_at
                    ) VALUES (
                        :id, :feed_name, :merchant_id, :merchant_name,
                        'running', NOW()
                    )
                """),
                {
                    'id': log_id,
                    'feed_name': Path(file_path).name,
                    'merchant_id': merchant_id,
                    'merchant_name': merchant_name
                }
            )
            session.commit()
            return log_id
            
        finally:
            session.close()
    
    def _complete_ingestion_log(
        self,
        log_id: str,
        processing_time: float,
        status: str,
        error_message: str = None
    ):
        """Update ingestion log with results."""
        session = self.Session()
        
        try:
            rows_per_second = (
                self.stats['processed'] / processing_time 
                if processing_time > 0 else 0
            )
            
            session.execute(
                text("""
                    UPDATE ingestion_logs SET
                        completed_at = NOW(),
                        status = :status,
                        total_rows = :total_rows,
                        processed_rows = :processed_rows,
                        new_products = :new_products,
                        updated_products = :updated_products,
                        failed_rows = :failed_rows,
                        duplicates_found = :duplicates,
                        processing_time_seconds = :processing_time,
                        rows_per_second = :rows_per_second,
                        error_message = :error_message
                    WHERE id = :id
                """),
                {
                    'id': log_id,
                    'status': status,
                    'total_rows': self.stats['total_rows'],
                    'processed_rows': self.stats['processed'],
                    'new_products': self.stats['new_products'],
                    'updated_products': self.stats['updated_products'],
                    'failed_rows': self.stats['invalid'],
                    'duplicates': self.stats['duplicates'],
                    'processing_time': int(processing_time),
                    'rows_per_second': rows_per_second,
                    'error_message': error_message
                }
            )
            session.commit()
            
        finally:
            session.close()
    
    def _log_statistics(self):
        """Log current statistics."""
        logger.info("=== Current Statistics ===")
        logger.info(f"Processed: {self.stats['processed']}")
        logger.info(f"Valid: {self.stats['valid']}")
        logger.info(f"Invalid: {self.stats['invalid']}")
        logger.info(f"Duplicates: {self.stats['duplicates']}")
        logger.info(f"Low Quality: {self.stats['low_quality']}")
        logger.info(f"New Products: {self.stats['new_products']}")
        logger.info(f"Updated Products: {self.stats['updated_products']}")
        
        if self.stats['errors']:
            logger.warning(f"Sample errors: {self.stats['errors'][:3]}")
            