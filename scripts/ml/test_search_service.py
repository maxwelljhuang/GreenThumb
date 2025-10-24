#!/usr/bin/env python3
"""
Test Search Service
Tests the unified search service API.

Usage:
    python scripts/ml/test_search_service.py [options]
"""

import sys
import argparse
import logging
import numpy as np
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.search import SearchService, SearchRequest, SearchMode
from backend.ml.retrieval import (
    ProductFilters,
    UserContext,
    create_user_context,
    get_index_manager,
)
from backend.ml.caching import EmbeddingCache
from backend.ml.feedback import InteractionType

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_test_data():
    """Set up test data."""
    print("\n=== Setting Up Test Data ===")

    cache = EmbeddingCache()

    # Create mock user embeddings
    user_id = 2001
    long_term = np.random.randn(512).astype(np.float32)
    long_term = long_term / np.linalg.norm(long_term)

    session = np.random.randn(512).astype(np.float32)
    session = session / np.linalg.norm(session)

    cache.set_user_long_term_embedding(user_id, long_term)
    cache.set_user_session_embedding(user_id, session)

    print(f"Created test user: {user_id}")

    return user_id


def test_personalized_feed():
    """Test personalized feed recommendations."""
    print("\n=== Test 1: Personalized Feed ===")

    user_id = setup_test_data()
    service = SearchService()

    request = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        limit=10,
        context="feed",
        use_ranking=False  # Disable for now
    )

    print(f"Requesting personalized feed for user {user_id}")

    response = service.search(request)

    print(f"\nResponse:")
    print(f"  Mode: {response.mode.value}")
    print(f"  Total results: {response.total_results}")
    print(f"  Returned: {len(response.results.results)}")
    print(f"  Search time: {response.search_time_ms:.2f}ms")
    print(f"  Total time: {response.total_time_ms:.2f}ms")
    print(f"  Ranking applied: {response.ranking_applied}")

    if response.results.results:
        print(f"\nTop 3 recommendations:")
        for result in response.results.results[:3]:
            print(f"  {result.rank + 1}. Product {result.product_id}: {result.similarity:.4f}")


def test_similar_items():
    """Test similar items search."""
    print("\n=== Test 2: Similar Items ===")

    user_id = setup_test_data()
    service = SearchService()

    # Get a product from the index
    manager = get_index_manager()
    manager.ensure_index_loaded()
    id_mapping = manager.get_id_mapping()

    if len(id_mapping) == 0:
        print("No products in index, skipping test")
        return

    product_id = id_mapping[0]

    request = SearchRequest(
        user_id=user_id,
        mode=SearchMode.SIMILAR_ITEMS,
        product_id=product_id,
        limit=10,
        use_ranking=False
    )

    print(f"Finding similar items to Product {product_id}")

    response = service.search(request)

    print(f"\nResponse:")
    print(f"  Total results: {response.total_results}")
    print(f"  Search time: {response.search_time_ms:.2f}ms")

    if response.results.results:
        print(f"\nTop 3 similar items:")
        for result in response.results.results[:3]:
            print(f"  {result.rank + 1}. Product {result.product_id}: {result.similarity:.4f}")


def test_with_filters():
    """Test search with filters."""
    print("\n=== Test 3: Search with Filters ===")

    user_id = setup_test_data()
    service = SearchService()

    filters = ProductFilters(
        min_price=30.0,
        max_price=100.0,
        in_stock_only=True
    )

    request = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        filters=filters,
        limit=10,
        use_ranking=False
    )

    print(f"Searching with filters: price $30-$100, in stock")
    print("Note: Requires database connection")


def test_pagination():
    """Test pagination."""
    print("\n=== Test 4: Pagination ===")

    user_id = setup_test_data()
    service = SearchService()

    # Page 1
    request_page1 = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        offset=0,
        limit=5,
        use_ranking=False
    )

    response_page1 = service.search(request_page1)

    print(f"Page 1:")
    print(f"  Offset: {response_page1.offset}")
    print(f"  Limit: {response_page1.limit}")
    print(f"  Returned: {len(response_page1.results.results)}")

    if response_page1.results.results:
        print(f"  First result: Product {response_page1.results.results[0].product_id}")

    # Page 2
    request_page2 = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        offset=5,
        limit=5,
        use_ranking=False
    )

    response_page2 = service.search(request_page2)

    print(f"\nPage 2:")
    print(f"  Offset: {response_page2.offset}")
    print(f"  Returned: {len(response_page2.results.results)}")

    if response_page2.results.results:
        print(f"  First result: Product {response_page2.results.results[0].product_id}")


def test_diversity():
    """Test result diversity."""
    print("\n=== Test 5: Diversity ===")

    user_id = setup_test_data()
    service = SearchService()

    # Without diversity
    request_no_div = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        limit=20,
        enable_diversity=False,
        use_ranking=False
    )

    response_no_div = service.search(request_no_div)

    # With diversity
    request_with_div = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        limit=20,
        enable_diversity=True,
        diversity_weight=0.15,
        use_ranking=False
    )

    response_with_div = service.search(request_with_div)

    print(f"Without diversity:")
    print(f"  Results: {response_no_div.total_results}")
    print(f"  Diversity applied: {response_no_div.diversity_applied}")

    print(f"\nWith diversity:")
    print(f"  Results: {response_with_div.total_results}")
    print(f"  Diversity applied: {response_with_div.diversity_applied}")


def test_anonymous_user():
    """Test search for anonymous user."""
    print("\n=== Test 6: Anonymous User ===")

    service = SearchService()

    request = SearchRequest(
        mode=SearchMode.PERSONALIZED_FEED,
        limit=10,
        use_ranking=False
    )

    print("Requesting recommendations for anonymous user")

    response = service.search(request)

    print(f"\nResponse:")
    print(f"  User ID: {response.user_id}")
    print(f"  Total results: {response.total_results}")
    print("Note: Anonymous recommendations return empty (not yet implemented)")


def test_interaction_recording():
    """Test recording user interactions."""
    print("\n=== Test 7: Interaction Recording ===")

    user_id = setup_test_data()
    service = SearchService()

    # Record thumbs up
    result = service.record_interaction(
        user_id=user_id,
        product_id=101,
        interaction_type=InteractionType.THUMBS_UP,
        context="feed"
    )

    print(f"Recorded thumbs up interaction:")
    print(f"  Long-term updated: {result.get('long_term_updated', False)}")
    print(f"  Session updated: {result.get('session_updated', False)}")


def test_service_stats():
    """Test service statistics."""
    print("\n=== Test 8: Service Statistics ===")

    service = SearchService()

    stats = service.get_service_stats()

    print("\nService Statistics:")
    print(f"  Service: {stats['service']}")
    print(f"  Version: {stats['version']}")

    if 'index' in stats:
        print(f"\n  Index:")
        print(f"    Vectors: {stats['index'].get('num_vectors', 'N/A')}")
        print(f"    Type: {stats['index'].get('index_type', 'N/A')}")

    if 'cache' in stats:
        print(f"\n  Cache:")
        print(f"    Cached products: {stats['cache'].get('cached_products', 0)}")
        print(f"    Cached users: {stats['cache'].get('cached_user_long_term', 0)}")
        print(f"    Connected: {stats['cache'].get('redis_connected', False)}")


def test_response_format():
    """Test response format conversion."""
    print("\n=== Test 9: Response Format ===")

    user_id = setup_test_data()
    service = SearchService()

    request = SearchRequest(
        user_id=user_id,
        mode=SearchMode.PERSONALIZED_FEED,
        limit=5,
        use_ranking=False
    )

    response = service.search(request)
    response_dict = response.to_dict()

    print("\nResponse as dict (for API):")
    print(f"  Keys: {list(response_dict.keys())}")
    print(f"  Mode: {response_dict['mode']}")
    print(f"  Total results: {response_dict['total_results']}")
    print(f"  Search time: {response_dict['search_time_ms']:.2f}ms")


def test_different_contexts():
    """Test different search contexts."""
    print("\n=== Test 10: Different Contexts ===")

    user_id = setup_test_data()
    service = SearchService()

    contexts = ["feed", "search", "similar"]

    for context in contexts:
        request = SearchRequest(
            user_id=user_id,
            mode=SearchMode.PERSONALIZED_FEED,
            context=context,
            limit=5,
            use_ranking=False
        )

        response = service.search(request)

        print(f"\nContext '{context}':")
        print(f"  Results: {response.total_results}")
        print(f"  Search time: {response.search_time_ms:.2f}ms")


def cleanup():
    """Clean up test data."""
    print("\n=== Cleanup ===")

    cache = EmbeddingCache()
    cache.delete_user_embeddings(2001)

    print("Test data cleaned up")


def main():
    parser = argparse.ArgumentParser(description='Test search service')
    parser.add_argument(
        '--test',
        type=str,
        choices=[
            'all', 'feed', 'similar', 'filters', 'pagination',
            'diversity', 'anonymous', 'interaction', 'stats',
            'format', 'contexts'
        ],
        default='all',
        help='Which test to run (default: all)'
    )
    parser.add_argument(
        '--cleanup',
        action='store_true',
        help='Clean up test data after running'
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Search Service Tests")
    print("=" * 60)

    # Initialize index
    try:
        manager = get_index_manager()
        manager.ensure_index_loaded()

        stats = manager.get_stats()
        print(f"\nFAISS Index: {stats['num_vectors']} vectors loaded")
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        print("\nMake sure to build FAISS index first:")
        print("  python scripts/ml/build_faiss_index.py")
        sys.exit(1)

    # Run tests
    if args.test in ['all', 'feed']:
        test_personalized_feed()

    if args.test in ['all', 'similar']:
        test_similar_items()

    if args.test in ['all', 'filters']:
        test_with_filters()

    if args.test in ['all', 'pagination']:
        test_pagination()

    if args.test in ['all', 'diversity']:
        test_diversity()

    if args.test in ['all', 'anonymous']:
        test_anonymous_user()

    if args.test in ['all', 'interaction']:
        test_interaction_recording()

    if args.test in ['all', 'stats']:
        test_service_stats()

    if args.test in ['all', 'format']:
        test_response_format()

    if args.test in ['all', 'contexts']:
        test_different_contexts()

    if args.cleanup or args.test == 'all':
        cleanup()

    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
