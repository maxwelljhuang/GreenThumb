#!/usr/bin/env python3
"""
Test Personalized Search
Tests user embedding integration with search.

Usage:
    python scripts/ml/test_personalized_search.py [options]
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
    PersonalizedSearch,
    UserContext,
    create_user_context,
    ProductFilters,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_mock_user_context(user_id: int, embedding_dim: int = 512) -> UserContext:
    """Create mock user context with random embeddings."""
    # Generate random normalized embeddings
    long_term = np.random.randn(embedding_dim).astype(np.float32)
    long_term = long_term / np.linalg.norm(long_term)

    session = np.random.randn(embedding_dim).astype(np.float32)
    session = session / np.linalg.norm(session)

    # Mock price profile
    price_profile = {
        'mean': 75.0,
        'std': 25.0,
        'min': 30.0,
        'max': 150.0
    }

    # Mock brand preferences
    brand_prefs = {
        1: 1.0,
        2: 0.8,
        3: 0.6,
    }

    return create_user_context(
        user_id=user_id,
        long_term_embedding=long_term,
        session_embedding=session,
        price_profile=price_profile,
        brand_preferences=brand_prefs
    )


def test_user_recommendations():
    """Test personalized recommendations for user."""
    print("\n=== Test 1: User Recommendations ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    # Create mock user
    user_context = create_mock_user_context(user_id=123)

    print(f"Generating recommendations for User {user_context.user_id}")
    print(f"  Long-term embedding: shape {user_context.long_term_embedding.shape}")
    print(f"  Session embedding: shape {user_context.session_embedding.shape}")

    # Get recommendations
    results = search.recommend_for_user(
        user_context=user_context,
        k=10,
        context="feed",
        use_ranking=False  # Disable ranking for now (no DB data)
    )

    print(f"\nFound {results.total_found} recommendations in {results.search_time_ms:.2f}ms")

    if results.total_found > 0:
        print("\nTop 5 recommendations:")
        for result in results.results[:5]:
            print(f"  Rank {result.rank + 1}: Product {result.product_id}")
            print(f"    Similarity: {result.similarity:.4f}")


def test_search_context_blending():
    """Test different blending for different contexts."""
    print("\n=== Test 2: Context-Aware Blending ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    user_context = create_mock_user_context(user_id=456)

    contexts = ["feed", "search", "similar"]

    for context in contexts:
        results = search.recommend_for_user(
            user_context=user_context,
            k=5,
            context=context,
            use_ranking=False
        )

        print(f"\nContext '{context}': {results.total_found} results")
        if results.total_found > 0:
            print(f"  Top result: Product {results.results[0].product_id}, "
                  f"similarity {results.results[0].similarity:.4f}")


def test_filtered_recommendations():
    """Test recommendations with filters."""
    print("\n=== Test 3: Filtered Recommendations ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    user_context = create_mock_user_context(user_id=789)

    # Create filters
    filters = ProductFilters(
        min_price=30.0,
        max_price=100.0,
        in_stock_only=True
    )

    print(f"Generating recommendations with filters:")
    print(f"  Price: $30-$100")
    print(f"  In stock only: True")

    # Note: This requires a DB session, will show how to use it
    print("\nNote: Filtered search requires database connection")
    print("Skipping actual search (requires DB setup)")


def test_similar_items_personalized():
    """Test similar items with user personalization."""
    print("\n=== Test 4: Personalized Similar Items ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    user_context = create_mock_user_context(user_id=321)

    # Get first product from index
    manager = get_index_manager()
    manager.ensure_index_loaded()

    id_mapping = manager.get_id_mapping()
    if len(id_mapping) > 0:
        product_id = id_mapping[0]

        print(f"Finding similar items to Product {product_id}")
        print(f"  With user personalization (10% user, 90% product)")

        results = search.find_similar_for_user(
            product_id=product_id,
            user_context=user_context,
            k=10,
            blend_ratio=0.9,
            use_ranking=False
        )

        print(f"\nFound {results.total_found} similar items in {results.search_time_ms:.2f}ms")

        if results.total_found > 0:
            print("\nTop 5 similar items:")
            for result in results.results[:5]:
                print(f"  Rank {result.rank + 1}: Product {result.product_id}")
                print(f"    Similarity: {result.similarity:.4f}")
    else:
        print("No products in index")


def test_anonymous_user():
    """Test recommendations for anonymous user."""
    print("\n=== Test 5: Anonymous User ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    # Create anonymous user context
    anonymous_context = create_user_context()

    print(f"User is anonymous: {anonymous_context.is_anonymous}")
    print(f"User ID: {anonymous_context.user_id}")

    results = search.recommend_for_user(
        user_context=anonymous_context,
        k=10,
        use_ranking=False
    )

    print(f"\nAnonymous user recommendations: {results.total_found} results")
    print("Note: Anonymous recommendations not yet implemented")


def test_blend_ratios():
    """Test different user/product blend ratios."""
    print("\n=== Test 6: Blend Ratio Testing ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    user_context = create_mock_user_context(user_id=555)

    manager = get_index_manager()
    manager.ensure_index_loaded()

    id_mapping = manager.get_id_mapping()
    if len(id_mapping) > 0:
        product_id = id_mapping[0]

        blend_ratios = [1.0, 0.9, 0.7, 0.5, 0.3]

        print(f"Testing different blend ratios for Product {product_id}")
        print("(ratio = emphasis on product vs user)")

        for ratio in blend_ratios:
            results = search.find_similar_for_user(
                product_id=product_id,
                user_context=user_context,
                k=5,
                blend_ratio=ratio,
                use_ranking=False
            )

            print(f"\n  Ratio {ratio:.1f} (product) / {1-ratio:.1f} (user):")
            if results.total_found > 0:
                print(f"    Top result: Product {results.results[0].product_id}, "
                      f"similarity {results.results[0].similarity:.4f}")


def test_with_ranking():
    """Test personalized search with ranking enabled."""
    print("\n=== Test 7: With Heuristic Ranking ===")

    config = get_ml_config()
    search = PersonalizedSearch(config=config)

    user_context = create_mock_user_context(user_id=999)

    print("Generating recommendations with ranking enabled")
    print("Note: Ranking scores will be neutral (no DB data)")

    results = search.recommend_for_user(
        user_context=user_context,
        k=10,
        context="feed",
        use_ranking=True  # Enable ranking
    )

    print(f"\nFound {results.total_found} ranked recommendations")

    if results.total_found > 0:
        print("\nTop 5 with ranking metadata:")
        for result in results.results[:5]:
            if 'final_score' in result.metadata:
                print(f"  Product {result.product_id}:")
                print(f"    Final score: {result.metadata['final_score']:.4f}")
                print(f"    Similarity: {result.metadata['similarity_score']:.4f}")
                print(f"    Popularity: {result.metadata['popularity_score']:.4f}")
            else:
                print(f"  Product {result.product_id}: similarity {result.similarity:.4f}")


def main():
    parser = argparse.ArgumentParser(description='Test personalized search')
    parser.add_argument(
        '--test',
        type=str,
        choices=['all', 'recommend', 'context', 'filtered', 'similar', 'anonymous', 'blend', 'ranking'],
        default='all',
        help='Which test to run (default: all)'
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Personalized Search Tests")
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
    if args.test in ['all', 'recommend']:
        test_user_recommendations()

    if args.test in ['all', 'context']:
        test_search_context_blending()

    if args.test in ['all', 'filtered']:
        test_filtered_recommendations()

    if args.test in ['all', 'similar']:
        test_similar_items_personalized()

    if args.test in ['all', 'anonymous']:
        test_anonymous_user()

    if args.test in ['all', 'blend']:
        test_blend_ratios()

    if args.test in ['all', 'ranking']:
        test_with_ranking()

    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
