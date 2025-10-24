#!/usr/bin/env python3
"""
Test Filtered Search
Tests two-stage filtered similarity search.

Usage:
    python scripts/ml/test_filtered_search.py [options]
"""

import sys
import argparse
import logging
import numpy as np
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.retrieval import (
    get_index_manager,
    ProductFilters,
    FilteredSimilaritySearch,
    FilterOperator,
    create_price_filter,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_db_session():
    """Create database session."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import os

    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/greenthumb'
    )

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def test_price_filter(searcher: FilteredSimilaritySearch):
    """Test search with price filter."""
    print("\n=== Test 1: Price Filter ===")

    # Create random query vector
    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Search with price filter
    filters = ProductFilters(
        min_price=20.0,
        max_price=100.0,
        in_stock_only=True
    )

    print(f"Searching with filters: price $20-$100, in stock only")

    session = get_db_session()
    try:
        results = searcher.search_with_filters(
            query_vector=query_vector,
            filters=filters,
            k=10,
            session=session
        )

        print(f"Found {results.total_found} results in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print(f"\nTop 5 results:")
            for result in results.results[:5]:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")
        else:
            print("No products found matching filters")

    finally:
        session.close()


def test_merchant_filter(searcher: FilteredSimilaritySearch):
    """Test search with merchant filter."""
    print("\n=== Test 2: Merchant Filter ===")

    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Filter to specific merchants
    filters = ProductFilters(
        merchant_ids=[1, 2, 3],
        in_stock_only=True
    )

    print(f"Searching with filters: merchants [1, 2, 3], in stock only")

    session = get_db_session()
    try:
        results = searcher.search_with_filters(
            query_vector=query_vector,
            filters=filters,
            k=10,
            session=session
        )

        print(f"Found {results.total_found} results in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print(f"\nTop 5 results:")
            for result in results.results[:5]:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")

    finally:
        session.close()


def test_category_filter(searcher: FilteredSimilaritySearch):
    """Test search with category filter."""
    print("\n=== Test 3: Category Filter ===")

    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Filter to specific categories
    filters = ProductFilters(
        category_ids=[10, 20],
        in_stock_only=True
    )

    print(f"Searching with filters: categories [10, 20], in stock only")

    session = get_db_session()
    try:
        results = searcher.search_with_filters(
            query_vector=query_vector,
            filters=filters,
            k=10,
            session=session
        )

        print(f"Found {results.total_found} results in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print(f"\nTop 5 results:")
            for result in results.results[:5]:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")

    finally:
        session.close()


def test_combined_filters(searcher: FilteredSimilaritySearch):
    """Test search with multiple filters combined."""
    print("\n=== Test 4: Combined Filters ===")

    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Multiple filters
    filters = ProductFilters(
        min_price=30.0,
        max_price=150.0,
        in_stock_only=True,
        min_stock_quantity=5,
        merchant_ids=[1, 2],
    )

    print(f"Searching with combined filters:")
    print(f"  Price: $30-$150")
    print(f"  Stock: min 5 units")
    print(f"  Merchants: [1, 2]")

    session = get_db_session()
    try:
        results = searcher.search_with_filters(
            query_vector=query_vector,
            filters=filters,
            k=10,
            session=session
        )

        print(f"\nFound {results.total_found} results in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print(f"\nTop 5 results:")
            for result in results.results[:5]:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")

    finally:
        session.close()


def test_similar_with_filters(searcher: FilteredSimilaritySearch, product_id: int):
    """Test finding similar products with filters."""
    print(f"\n=== Test 5: Similar Products with Filters ===")

    filters = ProductFilters(
        max_price=200.0,
        in_stock_only=True
    )

    print(f"Finding similar products to {product_id}")
    print(f"Filters: max price $200, in stock only")

    session = get_db_session()
    try:
        results = searcher.search_similar_with_filters(
            product_id=product_id,
            filters=filters,
            k=10,
            exclude_self=True,
            session=session
        )

        print(f"\nFound {results.total_found} similar products in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print(f"\nTop 5 similar products:")
            for result in results.results[:5]:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()


def test_strategy_comparison(searcher: FilteredSimilaritySearch):
    """Test and compare subset vs postfilter strategies."""
    print("\n=== Test 6: Strategy Comparison ===")

    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Very restrictive filter (should use subset strategy)
    restrictive_filters = ProductFilters(
        min_price=200.0,
        max_price=300.0,
        in_stock_only=True,
        min_stock_quantity=10,
    )

    session = get_db_session()
    try:
        print("\n1. Restrictive filters (auto strategy):")
        results_auto = searcher.search_with_filters(
            query_vector=query_vector,
            filters=restrictive_filters,
            k=10,
            session=session
        )
        print(f"   Found {results_auto.total_found} results in {results_auto.search_time_ms:.2f}ms")

        print("\n2. Force subset strategy:")
        results_subset = searcher.search_with_filters(
            query_vector=query_vector,
            filters=restrictive_filters,
            k=10,
            strategy='subset',
            session=session
        )
        print(f"   Found {results_subset.total_found} results in {results_subset.search_time_ms:.2f}ms")

        print("\n3. Force postfilter strategy:")
        results_postfilter = searcher.search_with_filters(
            query_vector=query_vector,
            filters=restrictive_filters,
            k=10,
            strategy='postfilter',
            session=session
        )
        print(f"   Found {results_postfilter.total_found} results in {results_postfilter.search_time_ms:.2f}ms")

    finally:
        session.close()


def test_empty_results(searcher: FilteredSimilaritySearch):
    """Test handling of filters that return no results."""
    print("\n=== Test 7: Empty Results Handling ===")

    dimension = 512
    query_vector = np.random.randn(dimension).astype(np.float32)
    query_vector = query_vector / np.linalg.norm(query_vector)

    # Impossible filter (should return no results)
    filters = ProductFilters(
        min_price=1000000.0,  # Very high price
        in_stock_only=True
    )

    print(f"Searching with impossible filter (price > $1,000,000)")

    session = get_db_session()
    try:
        results = searcher.search_with_filters(
            query_vector=query_vector,
            filters=filters,
            k=10,
            session=session
        )

        print(f"Found {results.total_found} results in {results.search_time_ms:.2f}ms")
        print("✓ Handled empty results gracefully")

    finally:
        session.close()


def main():
    parser = argparse.ArgumentParser(description='Test filtered similarity search')
    parser.add_argument(
        '--product-id',
        type=int,
        help='Product ID for similar product test'
    )
    parser.add_argument(
        '--test',
        type=str,
        choices=['all', 'price', 'merchant', 'category', 'combined', 'similar', 'strategy', 'empty'],
        default='all',
        help='Which test to run (default: all)'
    )

    args = parser.parse_args()

    # Initialize
    config = get_ml_config()
    print(f"Using FAISS index type: {config.storage.faiss_index_type}")

    try:
        manager = get_index_manager()
        manager.ensure_index_loaded()

        stats = manager.get_stats()
        print(f"\n=== FAISS Index Stats ===")
        print(f"Vectors: {stats['num_vectors']}")
        print(f"Index type: {stats['index_type']}")

        # Create filtered searcher
        def session_factory():
            return get_db_session()

        searcher = FilteredSimilaritySearch(
            config=config,
            index_manager=manager,
            db_session_factory=session_factory
        )

    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        print("\nMake sure to:")
        print("  1. Build FAISS index: python scripts/ml/build_faiss_index.py")
        print("  2. Configure database connection")
        sys.exit(1)

    # Get product ID for tests
    product_id = args.product_id
    if product_id is None:
        id_mapping = manager.get_id_mapping()
        if len(id_mapping) > 0:
            product_id = id_mapping[0]
        else:
            product_id = 1

    # Run tests
    if args.test in ['all', 'price']:
        test_price_filter(searcher)

    if args.test in ['all', 'merchant']:
        test_merchant_filter(searcher)

    if args.test in ['all', 'category']:
        test_category_filter(searcher)

    if args.test in ['all', 'combined']:
        test_combined_filters(searcher)

    if args.test in ['all', 'similar']:
        test_similar_with_filters(searcher, product_id)

    if args.test in ['all', 'strategy']:
        test_strategy_comparison(searcher)

    if args.test in ['all', 'empty']:
        test_empty_results(searcher)

    print("\n✓ All tests completed!")


if __name__ == '__main__':
    main()
