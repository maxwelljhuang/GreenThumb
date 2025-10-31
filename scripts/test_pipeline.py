#!/usr/bin/env python3
"""
Test Data Pipeline: Ingestion → Embedding → FAISS Index
Validates the complete ML pipeline with a 100-item sample dataset.
"""

import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.ingestion.csv_processor import CSVIngestionPipeline
from backend.ml.model_loader import model_registry
from backend.ml.retrieval.index_builder import FAISSIndexBuilder
from backend.api.dependencies import get_db_engine, get_session_factory
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_sample_dataset(input_csv: str, output_csv: str, n_samples: int = 100):
    """Create a random sample of n_samples from the input CSV."""
    logger.info(f"Creating {n_samples}-item sample from {input_csv}")

    # Read CSV with pandas
    df = pd.read_csv(input_csv, low_memory=False)
    logger.info(f"Original dataset: {len(df)} rows, {len(df.columns)} columns")

    # Take random sample
    sample_df = df.sample(n=min(n_samples, len(df)), random_state=42)

    # Save sample
    sample_df.to_csv(output_csv, index=False)
    logger.info(f"Sample saved to {output_csv}: {len(sample_df)} rows")

    return output_csv


def run_ingestion(csv_path: str):
    """Run CSV ingestion pipeline."""
    logger.info(f"Starting ingestion for {csv_path}")

    # Get database URL from environment
    import os
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/greenthumb_dev")

    # Initialize pipeline
    pipeline = CSVIngestionPipeline(db_url)

    # Process CSV (merchant_id=1 for test data)
    result = pipeline.process_csv(csv_path, merchant_id=1, merchant_name="TestMerchant")

    logger.info(f"Ingestion complete: {result}")
    return result


def generate_embeddings():
    """Generate CLIP embeddings for all products in database."""
    logger.info("Generating CLIP embeddings...")

    # Load CLIP model
    import open_clip
    import torch

    clip_model, preprocess = model_registry.get_clip_model()
    logger.info(f"CLIP model loaded")

    # Get tokenizer
    tokenizer = open_clip.get_tokenizer('ViT-B-32')

    # Get database session
    SessionLocal = get_session_factory()
    session = SessionLocal()

    try:
        # Get all products
        result = session.execute(text("""
            SELECT id, product_name, description, merchant_image_url
            FROM products
            WHERE is_active = true
        """))
        products = result.fetchall()

        logger.info(f"Found {len(products)} products to embed")

        embeddings = []
        product_ids = []

        for product in products:
            product_id, name, description, image_url = product

            # Create text for embedding (name + description)
            text = f"{name or ''} {description or ''}"[:500]  # Limit text length

            # Tokenize text
            tokens = tokenizer([text])

            # Generate text embedding using CLIP
            with torch.no_grad():
                text_embedding = clip_model.encode_text(tokens)
                text_embedding = text_embedding / text_embedding.norm(dim=-1, keepdim=True)  # Normalize
                text_embedding = text_embedding.cpu().numpy()[0]

            embeddings.append(text_embedding)
            product_ids.append(product_id)

            # Update product with embedding in database
            session.execute(text("""
                UPDATE products
                SET text_embedding = :embedding,
                    embedding_model_version = 'clip-vit-b-32',
                    embedding_generated_at = NOW()
                WHERE id = :product_id
            """), {"embedding": text_embedding.tolist(), "product_id": str(product_id)})

        session.commit()
        logger.info(f"Generated and saved {len(embeddings)} embeddings")

        return np.array(embeddings), product_ids

    finally:
        session.close()


def build_faiss_index(embeddings: np.ndarray, product_ids: list):
    """Build FAISS index from embeddings."""
    logger.info(f"Building FAISS index with {len(embeddings)} vectors...")

    # Initialize FAISS builder
    builder = FAISSIndexBuilder()

    # Build index
    index, id_mapping = builder.build_index(embeddings, product_ids)

    # Save index
    output_path = Path("models/cache/faiss_index")
    output_path.mkdir(parents=True, exist_ok=True)

    builder.save_index(index, str(output_path / "index.faiss"))

    # Save ID mapping
    import json
    with open(output_path / "id_mapping.json", "w") as f:
        json.dump({str(k): v for k, v in id_mapping.items()}, f)

    logger.info(f"FAISS index saved to {output_path}")
    logger.info(f"Index stats: {index.ntotal} vectors, dimension {index.d}")

    return index, id_mapping


def main():
    """Run complete pipeline test."""
    logger.info("=" * 80)
    logger.info("STARTING PIPELINE VALIDATION TEST")
    logger.info("=" * 80)

    # Paths
    input_csv = "data/raw/products.csv"
    sample_csv = "data/raw/products_sample_100.csv"

    try:
        # Step 1: Create sample dataset
        logger.info("\n[STEP 1/4] Creating sample dataset...")
        create_sample_dataset(input_csv, sample_csv, n_samples=100)

        # Step 2: Run ingestion
        logger.info("\n[STEP 2/4] Running CSV ingestion...")
        ingestion_result = run_ingestion(sample_csv)

        # Step 3: Generate embeddings
        logger.info("\n[STEP 3/4] Generating CLIP embeddings...")
        embeddings, product_ids = generate_embeddings()

        # Step 4: Build FAISS index
        logger.info("\n[STEP 4/4] Building FAISS index...")
        index, id_mapping = build_faiss_index(embeddings, product_ids)

        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("PIPELINE VALIDATION COMPLETE ✓")
        logger.info("=" * 80)
        logger.info(f"✓ Sample dataset: {sample_csv}")
        logger.info(f"✓ Products ingested: {ingestion_result.get('total_processed', 0)}")
        logger.info(f"✓ Embeddings generated: {len(embeddings)}")
        logger.info(f"✓ FAISS index size: {index.ntotal} vectors")
        logger.info(f"✓ Index dimension: {index.d}")
        logger.info("=" * 80)

    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
