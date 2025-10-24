#!/usr/bin/env python3
"""
Test Similarity Search
Tests FAISS-based similarity search functionality.

Usage:
    python scripts/ml/test_similarity_search.py [--product-id ID] [--k NUM]
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
    FAISSIndexManager,
    SimilaritySearch,
    get_index_manager
)
from backend.ml.model_loader import get_model_registry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_random_vector_search(search: SimilaritySearch, k: int = 10):
    """Test search with a random vector."""
    print("\n=== Test 1: Random Vector Search ===")

    # Generate random normalized vector
    dimension = 512
    random_vector = np.random.randn(dimension).astype(np.float32)
    random_vector = random_vector / np.linalg.norm(random_vector)

    print(f"Searching with random vector (dim={dimension})")

    results = search.search(random_vector, k=k)

    print(f"\nFound {results.total_found} results in {results.search_time_ms:.2f}ms")
    print(f"\nTop {min(5, len(results.results))} results:")

    for result in results.results[:5]:
        print(f"  Rank {result.rank + 1}: Product {result.product_id}")
        print(f"    Distance: {result.distance:.4f}")
        print(f"    Similarity: {result.similarity:.4f}")


def test_product_similarity_search(search: SimilaritySearch, product_id: int, k: int = 10):
    """Test finding similar products."""
    print(f"\n=== Test 2: Similar Products to ID {product_id} ===")

    try:
        results = search.search_by_product_id(
            product_id=product_id,
            k=k,
            exclude_self=True
        )

        print(f"\nFound {results.total_found} similar products in {results.search_time_ms:.2f}ms")
        print(f"\nTop {min(10, len(results.results))} similar products:")

        for result in results.results[:10]:
            print(f"  Rank {result.rank + 1}: Product {result.product_id}")
            print(f"    Similarity: {result.similarity:.4f} ({result.similarity*100:.1f}%)")

    except Exception as e:
        print(f"Error: {e}")


def test_batch_search(search: SimilaritySearch, k: int = 10):
    """Test batch search with multiple vectors."""
    print("\n=== Test 3: Batch Search ===")

    # Generate 3 random vectors
    batch_size = 3
    dimension = 512
    random_vectors = np.random.randn(batch_size, dimension).astype(np.float32)

    # Normalize
    norms = np.linalg.norm(random_vectors, axis=1, keepdims=True)
    random_vectors = random_vectors / norms

    print(f"Searching with {batch_size} random vectors")

    batch_results = search.search_batch(random_vectors, k=k)

    for i, results in enumerate(batch_results):
        print(f"\nQuery {i+1}: Found {results.total_found} results in {results.search_time_ms:.2f}ms")
        print(f"  Top result: Product {results.results[0].product_id} "
              f"(similarity: {results.results[0].similarity:.4f})")


def test_similarity_threshold(search: SimilaritySearch, product_id: int):
    """Test similarity threshold filtering."""
    print(f"\n=== Test 4: Similarity Threshold ===")

    try:
        # Search without threshold
        results_no_threshold = search.search_by_product_id(
            product_id=product_id,
            k=50,
            exclude_self=True
        )

        # Search with 80% similarity threshold
        results_with_threshold = search.search_by_product_id(
            product_id=product_id,
            k=50,
            exclude_self=True,
            min_similarity=0.8
        )

        print(f"Without threshold: {results_no_threshold.total_found} results")
        print(f"With 80% threshold: {results_with_threshold.total_found} results")

        if results_with_threshold.total_found > 0:
            print(f"\nHighly similar products (>80%):")
            for result in results_with_threshold.results[:5]:
                print(f"  Product {result.product_id}: {result.similarity:.4f} "
                      f"({result.similarity*100:.1f}%)")

    except Exception as e:
        print(f"Error: {e}")


def test_vector_reconstruction(search: SimilaritySearch, product_id: int):
    """Test getting product vectors."""
    print(f"\n=== Test 5: Vector Reconstruction ===")

    vector = search.get_product_vector(product_id)

    if vector is not None:
        print(f"Retrieved vector for Product {product_id}")
        print(f"  Shape: {vector.shape}")
        print(f"  L2 norm: {np.linalg.norm(vector):.6f}")
        print(f"  First 5 values: {vector[:5]}")
    else:
        print(f"Product {product_id} not found in index")


def main():
    parser = argparse.ArgumentParser(description='Test FAISS similarity search')
    parser.add_argument(
        '--product-id',
        type=int,
        help='Product ID to test similar product search'
    )
    parser.add_argument(
        '--k',
        type=int,
        default=10,
        help='Number of results to retrieve (default: 10)'
    )
    parser.add_argument(
        '--test',
        type=str,
        choices=['all', 'random', 'similar', 'batch', 'threshold', 'vector'],
        default='all',
        help='Which test to run (default: all)'
    )

    args = parser.parse_args()

    # Load config
    config = get_ml_config()
    print(f"Using FAISS index type: {config.storage.faiss_index_type}")

    # Initialize index manager and search
    try:
        manager = get_index_manager()
        manager.ensure_index_loaded()

        stats = manager.get_stats()
        print(f"\n=== FAISS Index Stats ===")
        print(f"Status: {stats['status']}")
        print(f"Vectors: {stats['num_vectors']}")
        print(f"Index type: {stats['index_type']}")

        search = SimilaritySearch(config=config, index_manager=manager)

    except Exception as e:
        logger.error(f"Failed to initialize search: {e}")
        print("\nMake sure to build the FAISS index first:")
        print("  python scripts/ml/build_faiss_index.py")
        sys.exit(1)

    # Determine product ID for tests
    product_id = args.product_id
    if product_id is None:
        # Use first product in index
        id_mapping = manager.get_id_mapping()
        if len(id_mapping) > 0:
            product_id = id_mapping[0]
        else:
            product_id = 1

    # Run tests
    if args.test in ['all', 'random']:
        test_random_vector_search(search, k=args.k)

    if args.test in ['all', 'similar']:
        test_product_similarity_search(search, product_id, k=args.k)

    if args.test in ['all', 'batch']:
        test_batch_search(search, k=args.k)

    if args.test in ['all', 'threshold']:
        test_similarity_threshold(search, product_id)

    if args.test in ['all', 'vector']:
        test_vector_reconstruction(search, product_id)

    print("\n✓ All tests completed!")


if __name__ == '__main__':
    main()
