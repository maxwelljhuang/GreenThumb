#!/usr/bin/env python3
"""
Test FAISS Search
Quick test of FAISS vector similarity search.
"""

import sys
from pathlib import Path
import numpy as np

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, text as sql_text
from sqlalchemy.orm import sessionmaker
from backend.ml.model_loader import model_registry
from backend.ml.retrieval.index_builder import FAISSIndexBuilder
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    # Database connection
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
    )
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Load CLIP model
        logger.info("Loading CLIP model...")
        model_registry.get_clip_model()
        logger.info("✅ CLIP model loaded")

        # Load FAISS index
        logger.info("Loading FAISS index...")
        builder = FAISSIndexBuilder()
        index, id_mapping, metadata = builder.load_index()
        logger.info(f"✅ FAISS index loaded: {len(id_mapping)} products")
        logger.info(f"   Index type: {metadata.get('index_type')}")
        logger.info(f"   Dimension: {metadata.get('dimension')}")

        # Test queries
        test_queries = [
            "linen dress",
            "casual shirt",
            "azure blue top",
        ]

        for query in test_queries:
            logger.info(f"\n{'='*60}")
            logger.info(f"Query: '{query}'")
            logger.info(f"{'='*60}")

            # Encode query
            query_embedding = model_registry.encode_text_batch([query])[0]
            query_embedding = query_embedding.reshape(1, -1).astype(np.float32)

            # Search FAISS
            k = min(5, len(id_mapping))  # Don't ask for more than available
            distances, indices = index.search(query_embedding, k)

            # Get product IDs from indices
            product_ids = [id_mapping[int(idx)] for idx in indices[0]]

            # Fetch product details from database
            if product_ids:
                id_list = [f"'{str(pid)}'" for pid in product_ids]
                placeholders = ','.join(id_list)

                result = session.execute(sql_text(f"""
                    SELECT id, product_name, brand_name, colour
                    FROM products
                    WHERE id::text IN ({placeholders})
                """))
                products = list(result.fetchall())

                # Reorder products to match search order
                product_dict = {str(p[0]): p for p in products}
                ordered_products = [product_dict.get(str(pid)) for pid in product_ids if str(pid) in product_dict]

                logger.info(f"Top {len(ordered_products)} results:")
                for i, product in enumerate(ordered_products):
                    if product:
                        _, name, brand, colour = product
                        dist = distances[0][i]
                        logger.info(f"  {i+1}. {name}")
                        logger.info(f"     Brand: {brand or 'N/A'}, Color: {colour or 'N/A'}")
                        logger.info(f"     Distance: {dist:.4f}")
            else:
                logger.info("No results found")

        logger.info("\n" + "="*60)
        logger.info("✅ FAISS search test complete!")
        logger.info("="*60)

    finally:
        session.close()


if __name__ == "__main__":
    main()
