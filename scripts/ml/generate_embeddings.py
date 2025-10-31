#!/usr/bin/env python3
"""
Generate Product Embeddings
Creates text embeddings for all products using CLIP.

Usage:
    python scripts/ml/generate_embeddings.py
    python scripts/ml/generate_embeddings.py --batch-size 16
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, text as sql_text
from sqlalchemy.orm import sessionmaker
from backend.ml.model_loader import model_registry
from backend.ml.config import TORCH_AVAILABLE

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_text_representation(product: dict) -> str:
    """Create text representation for CLIP encoding."""
    parts = []

    if product.get('product_name'):
        parts.append(product['product_name'])

    if product.get('brand_name'):
        parts.append(f"by {product['brand_name']}")

    if product.get('description'):
        desc = product['description']
        if len(desc) > 200:
            desc = desc[:197] + "..."
        parts.append(desc)

    if product.get('colour'):
        parts.append(f"color: {product['colour']}")

    if product.get('fashion_size'):
        parts.append(f"size: {product['fashion_size']}")

    return " ".join(parts)


def generate_embeddings(batch_size=16):
    """Generate text embeddings for all products."""

    # Database connection
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
    )
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get all products
        logger.info("Fetching products from database...")
        result = session.execute(sql_text("""
            SELECT
                id,
                product_name,
                brand_name,
                description,
                colour,
                fashion_size
            FROM products
            WHERE is_duplicate = false
            ORDER BY id
        """))

        products = [dict(row._mapping) for row in result]
        total = len(products)

        logger.info(f"Found {total} products to process")

        if total == 0:
            logger.warning("No products found")
            return

        # Load CLIP model
        logger.info("Loading CLIP model...")
        model_registry.get_clip_model()
        logger.info(f"✅ Model loaded on {model_registry.get_device()}")

        # Process in batches
        successful = 0
        failed = 0

        for i in range(0, total, batch_size):
            batch = products[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total + batch_size - 1) // batch_size

            logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} products)")

            try:
                # Create text representations
                texts = [create_text_representation(p) for p in batch]

                # Generate embeddings
                embeddings = model_registry.encode_text_batch(texts)

                # Store in database
                for product, embedding in zip(batch, embeddings):
                    try:
                        session.execute(sql_text("""
                            INSERT INTO product_embeddings (
                                product_id,
                                embedding_type,
                                embedding,
                                model_version
                            ) VALUES (
                                :product_id,
                                'text',
                                :embedding,
                                'ViT-B-32'
                            )
                            ON CONFLICT (product_id, embedding_type)
                            DO UPDATE SET
                                embedding = EXCLUDED.embedding,
                                model_version = EXCLUDED.model_version,
                                updated_at = now()
                        """), {
                            'product_id': product['id'],
                            'embedding': embedding.tolist()
                        })

                        successful += 1

                    except Exception as e:
                        failed += 1
                        logger.error(f"Failed for product {product['id']}: {e}")

                # Commit batch
                session.commit()
                logger.info(f"  ✅ Batch {batch_num} complete ({successful}/{total} total)")

            except Exception as e:
                session.rollback()
                logger.error(f"Batch {batch_num} failed: {e}", exc_info=True)
                failed += len(batch)

        # Summary
        logger.info("=" * 60)
        logger.info("Embedding Generation Complete")
        logger.info("=" * 60)
        logger.info(f"Total: {total}")
        logger.info(f"Successful: {successful}")
        logger.info(f"Failed: {failed}")
        logger.info(f"Success rate: {successful/total*100:.1f}%")

    finally:
        session.close()


def main():
    """Main entry point."""
    if not TORCH_AVAILABLE:
        print("❌ PyTorch not available")
        return 1

    logger.info("=" * 60)
    logger.info("Product Embedding Generation")
    logger.info("=" * 60)

    try:
        generate_embeddings(batch_size=16)
        return 0
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
