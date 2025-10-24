#!/usr/bin/env python3
"""
Build FAISS Index Script
Builds FAISS index from product embeddings in PostgreSQL.

Usage:
    python scripts/ml/build_faiss_index.py [--index-type Flat|IVF|HNSW] [--force-rebuild]
"""

import sys
import argparse
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.retrieval.index_manager import FAISSIndexManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_db_session():
    """
    Create database session.
    This is a placeholder - replace with your actual DB setup.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import os

    # Get database URL from environment
    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/greenthumb'
    )

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def main():
    parser = argparse.ArgumentParser(description='Build FAISS index from database embeddings')
    parser.add_argument(
        '--index-type',
        type=str,
        choices=['Flat', 'IVF', 'HNSW'],
        help='FAISS index type (default: from config)'
    )
    parser.add_argument(
        '--force-rebuild',
        action='store_true',
        help='Force rebuild even if index exists'
    )
    parser.add_argument(
        '--load-only',
        action='store_true',
        help='Only load existing index from disk (do not rebuild)'
    )
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show index statistics and exit'
    )

    args = parser.parse_args()

    # Load config
    config = get_ml_config()

    # Override index type if specified
    if args.index_type:
        config.storage.faiss_index_type = args.index_type
        logger.info(f"Using index type: {args.index_type}")

    # Create index manager
    manager = FAISSIndexManager(config=config)

    # Show stats if requested
    if args.stats:
        try:
            manager.load_index_from_disk()
        except Exception as e:
            logger.warning(f"Could not load index: {e}")

        stats = manager.get_stats()
        print("\n=== FAISS Index Statistics ===")
        for key, value in stats.items():
            print(f"{key}: {value}")
        return

    # Load only mode
    if args.load_only:
        logger.info("Loading existing index from disk...")
        try:
            manager.load_index_from_disk()
            logger.info("✓ Index loaded successfully")

            stats = manager.get_stats()
            print(f"\nLoaded index with {stats['num_vectors']} vectors")
            print(f"Index type: {stats['index_type']}")
            return
        except Exception as e:
            logger.error(f"✗ Failed to load index: {e}")
            sys.exit(1)

    # Build from database
    logger.info("Building FAISS index from database...")

    try:
        # Get database session
        session = get_db_session()

        # Check if index exists and force rebuild not specified
        if not args.force_rebuild:
            try:
                manager.load_index_from_disk()
                logger.info("Index already exists. Use --force-rebuild to rebuild.")

                stats = manager.get_stats()
                print(f"\nExisting index: {stats['num_vectors']} vectors")
                print("Use --force-rebuild to rebuild from database")
                return
            except Exception:
                logger.info("No existing index found, building new one...")

        # Build index
        manager.build_index_from_db(session)

        logger.info("✓ FAISS index built successfully")

        # Show stats
        stats = manager.get_stats()
        print("\n=== Build Summary ===")
        print(f"Index type: {stats['index_type']}")
        print(f"Vectors indexed: {stats['num_vectors']}")
        print(f"Dimension: {stats['dimension']}")
        print(f"Index path: {config.storage.faiss_index_path}")

        if stats['index_type'] == 'IVF':
            print(f"nlist: {stats['nlist']}")
            print(f"nprobe: {stats['nprobe']}")
        elif stats['index_type'] == 'HNSW':
            print(f"M: {stats['M']}")
            print(f"efSearch: {stats['efSearch']}")

    except Exception as e:
        logger.error(f"✗ Failed to build index: {e}", exc_info=True)
        sys.exit(1)
    finally:
        session.close()


if __name__ == '__main__':
    main()
