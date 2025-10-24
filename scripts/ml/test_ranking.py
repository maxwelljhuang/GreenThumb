#!/usr/bin/env python3
"""
Test Heuristic Ranking
Tests multi-signal ranking system.

Usage:
    python scripts/ml/test_ranking.py [options]
"""

import sys
import argparse
import logging
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.retrieval import (
    get_index_manager,
    SimilaritySearch,
    SearchResult,
    SearchResults,
    RankingConfig,
    PopularityScorer,
    PriceAffinityScorer,
    BrandMatchScorer,
    HeuristicRanker,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_popularity_scorer():
    """Test popularity scoring."""
    print("\n=== Test 1: Popularity Scorer ===")

    scorer = PopularityScorer()

    # Mock product stats
    product_stats = {
        1: {  # Popular recent product
            'views': 1000,
            'likes': 50,
            'carts': 20,
            'purchases': 10,
            'last_interaction': datetime.utcnow() - timedelta(days=5)
        },
        2: {  # Popular old product
            'views': 2000,
            'likes': 100,
            'carts': 40,
            'purchases': 20,
            'last_interaction': datetime.utcnow() - timedelta(days=90)
        },
        3: {  # Unpopular product
            'views': 50,
            'likes': 2,
            'carts': 1,
            'purchases': 0,
            'last_interaction': datetime.utcnow() - timedelta(days=10)
        },
    }

    scores = scorer.score_batch(product_stats)

    print("\nPopularity Scores:")
    for pid, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        stats = product_stats[pid]
        print(f"  Product {pid}: {score:.4f}")
        print(f"    Stats: {stats['views']} views, {stats['purchases']} purchases")
        print(f"    Last interaction: {stats['last_interaction'].date()}")


def test_price_affinity_scorer():
    """Test price affinity scoring."""
    print("\n=== Test 2: Price Affinity Scorer ===")

    scorer = PriceAffinityScorer()

    # Mock user's purchase history
    user_purchases = [50.0, 60.0, 55.0, 65.0, 52.0]  # Average ~$56

    # Calculate user's price profile
    price_profile = scorer.calculate_user_price_profile(user_purchases)

    print(f"\nUser Price Profile:")
    print(f"  Mean: ${price_profile['mean']:.2f}")
    print(f"  Std: ${price_profile['std']:.2f}")
    print(f"  Range: ${price_profile['min']:.2f} - ${price_profile['max']:.2f}")

    # Test products at different price points
    test_products = {
        1: 55.0,   # Perfect match
        2: 70.0,   # Slightly higher
        3: 40.0,   # Slightly lower
        4: 100.0,  # Much higher
        5: 20.0,   # Much lower
    }

    scores = scorer.score_batch(test_products, price_profile)

    print(f"\nPrice Affinity Scores (user avg: ${price_profile['mean']:.2f}):")
    for pid, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        price = test_products[pid]
        print(f"  Product {pid} (${price:.2f}): {score:.4f}")


def test_brand_match_scorer():
    """Test brand match scoring."""
    print("\n=== Test 3: Brand Match Scorer ===")

    scorer = BrandMatchScorer()

    # Mock user's brand interaction history
    # User has interacted with brands: 1, 2, 1, 3, 1
    brand_interactions = [1, 2, 1, 3, 1]
    interaction_weights = [1.0, 1.0, 2.0, 1.0, 5.0]  # Last is a purchase

    # Calculate brand preferences
    brand_prefs = scorer.calculate_user_brand_preferences(
        brand_interactions,
        interaction_weights
    )

    print("\nUser Brand Preferences:")
    for brand_id, pref in sorted(brand_prefs.items(), key=lambda x: x[1], reverse=True):
        print(f"  Brand {brand_id}: {pref:.4f}")

    # Test products from different brands
    test_products = {
        1: 1,  # Favorite brand
        2: 2,  # Known brand
        3: 3,  # Less preferred brand
        4: 99, # Unknown brand
    }

    scores = scorer.score_batch(test_products, brand_prefs)

    print("\nBrand Match Scores:")
    for pid, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        brand = test_products[pid]
        print(f"  Product {pid} (Brand {brand}): {score:.4f}")


def test_combined_ranking():
    """Test combined multi-signal ranking."""
    print("\n=== Test 4: Combined Heuristic Ranking ===")

    # Create mock search results
    results = [
        SearchResult(product_id=1, distance=0.1, similarity=0.95, rank=0),
        SearchResult(product_id=2, distance=0.2, similarity=0.90, rank=1),
        SearchResult(product_id=3, distance=0.3, similarity=0.85, rank=2),
        SearchResult(product_id=4, distance=0.4, similarity=0.80, rank=3),
        SearchResult(product_id=5, distance=0.5, similarity=0.75, rank=4),
    ]

    search_results = SearchResults(
        results=results,
        query_vector_shape=(1, 512),
        k=5,
        total_found=5,
        search_time_ms=10.0
    )

    print("\nOriginal Ranking (by similarity only):")
    for r in search_results.results:
        print(f"  Rank {r.rank + 1}: Product {r.product_id}, similarity={r.similarity:.4f}")

    # Mock additional signals
    popularity_scores = {
        1: 0.5,   # Medium popularity
        2: 0.9,   # Very popular
        3: 0.3,   # Less popular
        4: 0.7,   # Popular
        5: 0.1,   # Unpopular
    }

    price_affinity_scores = {
        1: 0.8,   # Good price match
        2: 0.4,   # Poor price match
        3: 1.0,   # Perfect price match
        4: 0.6,   # OK price match
        5: 0.2,   # Bad price match
    }

    brand_match_scores = {
        1: 0.9,   # Favorite brand
        2: 0.5,   # Known brand
        3: 0.7,   # Liked brand
        4: 0.3,   # Less known
        5: 0.0,   # Unknown brand
    }

    # Re-rank with all signals
    ranker = HeuristicRanker()
    ranked_results = ranker.rank_results(
        search_results=search_results,
        popularity_scores=popularity_scores,
        price_affinity_scores=price_affinity_scores,
        brand_match_scores=brand_match_scores
    )

    print("\n\nRe-ranked with Multi-Signal Scoring:")
    for r in ranked_results.results:
        print(f"\n  Rank {r.rank + 1}: Product {r.product_id}")
        print(f"    Final Score: {r.metadata['final_score']:.4f}")
        print(f"    Similarity:     {r.metadata['similarity_score']:.4f}")
        print(f"    Popularity:     {r.metadata['popularity_score']:.4f}")
        print(f"    Price Affinity: {r.metadata['price_affinity_score']:.4f}")
        print(f"    Brand Match:    {r.metadata['brand_match_score']:.4f}")


def test_ranking_explanation():
    """Test ranking explanation generation."""
    print("\n=== Test 5: Ranking Explanation ===")

    ranker = HeuristicRanker()

    # Create a result with metadata
    result = SearchResult(
        product_id=42,
        distance=0.2,
        similarity=0.90,
        rank=0,
        metadata={
            'final_score': 0.785,
            'similarity_score': 0.90,
            'popularity_score': 0.75,
            'price_affinity_score': 0.60,
            'brand_match_score': 0.40,
        }
    )

    explanation = ranker.explain_ranking(result)
    print(f"\n{explanation}")


def test_custom_weights():
    """Test ranking with custom weights."""
    print("\n=== Test 6: Custom Ranking Weights ===")

    # Create config with different weights
    # Emphasize popularity more
    config = RankingConfig(
        similarity_weight=0.4,
        popularity_weight=0.4,
        price_affinity_weight=0.15,
        brand_match_weight=0.05
    )

    print("\nCustom Weights:")
    print(f"  Similarity: {config.similarity_weight}")
    print(f"  Popularity: {config.popularity_weight}")
    print(f"  Price Affinity: {config.price_affinity_weight}")
    print(f"  Brand Match: {config.brand_match_weight}")

    # Mock results
    results = [
        SearchResult(product_id=1, distance=0.1, similarity=0.95, rank=0),
        SearchResult(product_id=2, distance=0.2, similarity=0.90, rank=1),
    ]

    search_results = SearchResults(
        results=results,
        query_vector_shape=(1, 512),
        k=2,
        total_found=2,
        search_time_ms=10.0
    )

    popularity_scores = {1: 0.5, 2: 0.9}
    price_affinity_scores = {1: 0.8, 2: 0.4}
    brand_match_scores = {1: 0.9, 2: 0.5}

    ranker = HeuristicRanker(config=config)
    ranked_results = ranker.rank_results(
        search_results=search_results,
        popularity_scores=popularity_scores,
        price_affinity_scores=price_affinity_scores,
        brand_match_scores=brand_match_scores
    )

    print("\nRanked Results:")
    for r in ranked_results.results:
        print(f"  Product {r.product_id}: final={r.metadata['final_score']:.4f}, "
              f"sim={r.metadata['similarity_score']:.4f}, "
              f"pop={r.metadata['popularity_score']:.4f}")


def main():
    parser = argparse.ArgumentParser(description='Test heuristic ranking system')
    parser.add_argument(
        '--test',
        type=str,
        choices=['all', 'popularity', 'price', 'brand', 'combined', 'explanation', 'weights'],
        default='all',
        help='Which test to run (default: all)'
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Heuristic Ranking System Tests")
    print("=" * 60)

    # Run tests
    if args.test in ['all', 'popularity']:
        test_popularity_scorer()

    if args.test in ['all', 'price']:
        test_price_affinity_scorer()

    if args.test in ['all', 'brand']:
        test_brand_match_scorer()

    if args.test in ['all', 'combined']:
        test_combined_ranking()

    if args.test in ['all', 'explanation']:
        test_ranking_explanation()

    if args.test in ['all', 'weights']:
        test_custom_weights()

    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
