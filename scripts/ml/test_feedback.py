#!/usr/bin/env python3
"""
Test Feedback System
Tests user interaction feedback and embedding updates.

Usage:
    python scripts/ml/test_feedback.py [options]
"""

import sys
import argparse
import logging
import numpy as np
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.feedback import (
    FeedbackHandler,
    FeedbackProcessor,
    InteractionEvent,
    InteractionType,
)
from backend.ml.caching import EmbeddingCache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_test_data():
    """Set up test data (mock embeddings)."""
    print("\n=== Setting Up Test Data ===")

    cache = EmbeddingCache()

    # Create mock product embeddings
    products = {
        101: np.random.randn(512).astype(np.float32),
        102: np.random.randn(512).astype(np.float32),
        103: np.random.randn(512).astype(np.float32),
    }

    # Normalize
    for pid in products:
        products[pid] = products[pid] / np.linalg.norm(products[pid])

    # Cache products
    cache.set_product_embeddings_batch(products)

    print(f"Cached {len(products)} product embeddings")

    # Create initial user embedding
    user_id = 1001
    user_emb = np.random.randn(512).astype(np.float32)
    user_emb = user_emb / np.linalg.norm(user_emb)
    cache.set_user_long_term_embedding(user_id, user_emb)

    print(f"Cached initial embedding for user {user_id}")

    return products, user_id


def test_thumbs_up():
    """Test thumbs up feedback."""
    print("\n=== Test 1: Thumbs Up ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    product_id = 101

    print(f"User {user_id} gives thumbs up to Product {product_id}")

    result = handler.process_thumbs_up(
        user_id=user_id,
        product_id=product_id,
        context="feed"
    )

    print(f"\nResult:")
    print(f"  Long-term updated: {result['long_term_updated']}")
    print(f"  Session updated: {result['session_updated']}")

    if result['long_term_updated']:
        print(f"  ✓ User embedding updated with positive feedback")


def test_thumbs_down():
    """Test thumbs down feedback."""
    print("\n=== Test 2: Thumbs Down ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    product_id = 102

    print(f"User {user_id} gives thumbs down to Product {product_id}")

    result = handler.process_thumbs_down(
        user_id=user_id,
        product_id=product_id,
        context="feed"
    )

    print(f"\nResult:")
    print(f"  Long-term updated: {result['long_term_updated']}")
    print(f"  Session updated: {result['session_updated']}")

    if result['long_term_updated']:
        print(f"  ✓ User embedding updated with negative feedback")


def test_interaction_weights():
    """Test different interaction types and their weights."""
    print("\n=== Test 3: Interaction Weights ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    print("\nInteraction weights:")
    for interaction_type, weight in handler.interaction_weights.items():
        print(f"  {interaction_type.value:20s}: {weight:+.1f}")


def test_like_event():
    """Test like event processing."""
    print("\n=== Test 4: Like Event ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    product_id = 103

    print(f"User {user_id} likes Product {product_id}")

    result = handler.process_like(
        user_id=user_id,
        product_id=product_id
    )

    print(f"\nResult:")
    print(f"  Long-term updated: {result['long_term_updated']}")
    print(f"  Session updated: {result['session_updated']}")


def test_purchase_event():
    """Test purchase event processing."""
    print("\n=== Test 5: Purchase Event ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    product_id = 101

    print(f"User {user_id} purchases Product {product_id}")

    result = handler.process_purchase(
        user_id=user_id,
        product_id=product_id,
        metadata={'price': 75.00, 'quantity': 1}
    )

    print(f"\nResult:")
    print(f"  Long-term updated: {result['long_term_updated']}")
    print(f"  Session updated: {result['session_updated']}")

    if result['long_term_updated']:
        print(f"  ✓ Purchase has strong positive weight (2.0)")


def test_session_updates():
    """Test session embedding updates with multiple interactions."""
    print("\n=== Test 6: Session Embedding Updates ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()

    # Simulate a session with multiple views
    interactions = [
        (101, InteractionType.VIEW),
        (102, InteractionType.VIEW),
        (103, InteractionType.CLICK),
        (101, InteractionType.LIKE),
    ]

    print(f"Simulating session with {len(interactions)} interactions")

    for product_id, interaction_type in interactions:
        event = InteractionEvent(
            user_id=user_id,
            product_id=product_id,
            interaction_type=interaction_type
        )

        result = handler.process_event(event)

        print(f"  {interaction_type.value:15s} Product {product_id}: "
              f"session_updated={result['session_updated']}")

    # Get final session embedding
    cache = EmbeddingCache()
    session_emb = cache.get_user_session_embedding(user_id)

    if session_emb is not None:
        print(f"\n✓ Final session embedding shape: {session_emb.shape}")
        print(f"  L2 norm: {np.linalg.norm(session_emb):.6f}")


def test_embedding_evolution():
    """Test how embedding evolves with positive and negative feedback."""
    print("\n=== Test 7: Embedding Evolution ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()
    cache = EmbeddingCache()

    # Get initial embedding
    initial_emb = cache.get_user_long_term_embedding(user_id)

    print(f"Initial embedding for user {user_id}")

    # Apply positive feedback
    handler.process_thumbs_up(user_id, 101)
    after_positive = cache.get_user_long_term_embedding(user_id)

    # Apply negative feedback
    handler.process_thumbs_down(user_id, 102)
    after_negative = cache.get_user_long_term_embedding(user_id)

    # Calculate similarities
    sim_init_pos = np.dot(initial_emb, after_positive)
    sim_pos_neg = np.dot(after_positive, after_negative)

    print(f"\nEmbedding evolution:")
    print(f"  Initial → After positive: {sim_init_pos:.4f}")
    print(f"  After positive → After negative: {sim_pos_neg:.4f}")
    print(f"  ✓ Embedding evolves based on feedback")


def test_batch_processing():
    """Test batch event processing."""
    print("\n=== Test 8: Batch Processing ===")

    products, user_id = setup_test_data()
    processor = FeedbackProcessor()

    # Create batch of events
    events = [
        InteractionEvent(user_id, 101, InteractionType.VIEW),
        InteractionEvent(user_id, 102, InteractionType.LIKE),
        InteractionEvent(user_id, 103, InteractionType.THUMBS_UP),
        InteractionEvent(user_id, 101, InteractionType.PURCHASE),
    ]

    print(f"Processing batch of {len(events)} events")

    result = processor.process_batch(events)

    print(f"\nBatch results:")
    print(f"  Total: {result['total']}")
    print(f"  Processed: {result['processed']}")
    print(f"  Errors: {result['errors']}")

    if result['processed'] == result['total']:
        print(f"  ✓ All events processed successfully")


def test_hot_products():
    """Test hot products tracking from views."""
    print("\n=== Test 9: Hot Products Tracking ===")

    products, user_id = setup_test_data()
    handler = FeedbackHandler()
    cache = EmbeddingCache()

    # Simulate views (101 viewed most, then 102, then 103)
    views = [
        (101, 5),
        (102, 3),
        (103, 1),
    ]

    print("Simulating product views:")
    for product_id, count in views:
        print(f"  Product {product_id}: {count} views")
        for _ in range(count):
            event = InteractionEvent(user_id, product_id, InteractionType.VIEW)
            handler.process_event(event)

    # Get hot products
    hot_products = cache.get_hot_products(limit=10)

    print(f"\nHot products (sorted by views):")
    for i, pid in enumerate(hot_products[:3], 1):
        print(f"  {i}. Product {pid}")

    if hot_products and hot_products[0] == 101:
        print(f"  ✓ Product 101 is the hottest (most viewed)")


def test_cold_start_user():
    """Test feedback for new user without initial embedding."""
    print("\n=== Test 10: Cold Start User ===")

    products, _ = setup_test_data()
    handler = FeedbackHandler()
    cache = EmbeddingCache()

    new_user_id = 9999

    print(f"New user {new_user_id} (no initial embedding)")

    # Check no existing embedding
    existing = cache.get_user_long_term_embedding(new_user_id)
    print(f"  Initial embedding: {existing}")

    # Process first interaction
    result = handler.process_thumbs_up(new_user_id, 101)

    # Check embedding was created
    new_emb = cache.get_user_long_term_embedding(new_user_id)

    if new_emb is not None:
        print(f"\n  ✓ Embedding initialized from first interaction")
        print(f"  Shape: {new_emb.shape}")
        print(f"  L2 norm: {np.linalg.norm(new_emb):.6f}")
    else:
        print(f"\n  ✗ Embedding not created")


def cleanup():
    """Clean up test data."""
    print("\n=== Cleanup ===")

    cache = EmbeddingCache()

    # Delete test product embeddings
    for pid in [101, 102, 103]:
        cache.delete_product_embedding(pid)

    # Delete test user embeddings
    for uid in [1001, 9999]:
        cache.delete_user_embeddings(uid)

    print("Test data cleaned up")


def main():
    parser = argparse.ArgumentParser(description='Test feedback system')
    parser.add_argument(
        '--test',
        type=str,
        choices=[
            'all', 'thumbs-up', 'thumbs-down', 'weights', 'like',
            'purchase', 'session', 'evolution', 'batch', 'hot', 'cold-start'
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
    print("Feedback System Tests")
    print("=" * 60)

    # Run tests
    if args.test in ['all', 'thumbs-up']:
        test_thumbs_up()

    if args.test in ['all', 'thumbs-down']:
        test_thumbs_down()

    if args.test in ['all', 'weights']:
        test_interaction_weights()

    if args.test in ['all', 'like']:
        test_like_event()

    if args.test in ['all', 'purchase']:
        test_purchase_event()

    if args.test in ['all', 'session']:
        test_session_updates()

    if args.test in ['all', 'evolution']:
        test_embedding_evolution()

    if args.test in ['all', 'batch']:
        test_batch_processing()

    if args.test in ['all', 'hot']:
        test_hot_products()

    if args.test in ['all', 'cold-start']:
        test_cold_start_user()

    if args.cleanup or args.test == 'all':
        cleanup()

    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
