#!/usr/bin/env python3
"""
Generate Product Embeddings
Creates image, text, and fused embeddings for all products.

Usage:
    python scripts/ml/generate_embeddings.py
    python scripts/ml/generate_embeddings.py --batch-size 64
    python scripts/ml/generate_embeddings.py --max-products 100 --dry-run
    python scripts/ml/generate_embeddings.py --reprocess-all
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Load environment
load_dotenv()

from backend.ml.embeddings.batch_processor import BatchEmbeddingProcessor
from backend.ml.config import TORCH_AVAILABLE

import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def main():
    parser = argparse.ArgumentParser(
        description='Generate embeddings for products'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=32,
        help='Number of products per batch (default: 32)'
    )
    parser.add_argument(
        '--max-products',
        type=int,
        help='Maximum products to process (for testing)'
    )
    parser.add_argument(
        '--reprocess-all',
        action='store_true',
        help='Reprocess all products, including those with embeddings'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Process but don\'t update database'
    )
    parser.add_argument(
        '--db-url',
        type=str,
        help='Database URL (default: from DATABASE_URL env var)'
    )

    args = parser.parse_args()

    # Check ML dependencies
    if not TORCH_AVAILABLE:
        print("❌ ML dependencies not installed")
        print("\nInstall with:")
        print("  pip install -r requirements-ml.txt")
        print("\nFor help, see: ML_SETUP.md")
        return 1

    # Get database URL
    db_url = args.db_url or os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ Database URL not provided")
        print("\nProvide via --db-url or set DATABASE_URL environment variable")
        return 1

    print("=" * 60)
    print("  Product Embedding Generation")
    print("=" * 60)
    print(f"Batch size: {args.batch_size}")
    print(f"Only missing: {not args.reprocess_all}")
    print(f"Dry run: {args.dry_run}")
    if args.max_products:
        print(f"Max products: {args.max_products}")
    print()

    if args.dry_run:
        print("⚠️  DRY RUN MODE - Database will not be updated")
        print()

    # Create processor
    try:
        processor = BatchEmbeddingProcessor(db_url)
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return 1

    # Process all products
    try:
        processor.process_all(
            batch_size=args.batch_size,
            only_missing=not args.reprocess_all,
            dry_run=args.dry_run,
            max_products=args.max_products
        )

        print("\n✅ Embedding generation complete!")
        print("\nNext steps:")
        print("1. Create vector indexes: python scripts/database/create_vector_indexes.py")
        print("2. Test similarity search: python scripts/ml/test_search.py")

        return 0

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        processor.print_summary()
        return 1
    except Exception as e:
        print(f"\n❌ Processing failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
