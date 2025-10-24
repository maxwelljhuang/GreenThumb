#!/usr/bin/env python3
"""
Test Redis Cache
Tests Redis caching for embeddings.

Usage:
    python scripts/ml/test_redis_cache.py [options]

Requirements:
    - Redis server running (default: localhost:6379)
    - Install redis: pip install redis
"""

import sys
import argparse
import logging
import numpy as np
from pathlib import Path
import time

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import get_ml_config
from backend.ml.caching import RedisCache, get_redis_cache, EmbeddingCache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_redis_connection():
    """Test basic Redis connection."""
    print("\n=== Test 1: Redis Connection ===")

    try:
        cache = get_redis_cache()
        connected = cache.ping()

        if connected:
            print("✓ Redis connection successful")

            info = cache.get_info()
            print(f"  Redis version: {info.get('redis_version', 'unknown')}")
            print(f"  Used memory: {info.get('used_memory_human', 'unknown')}")
            return True
        else:
            print("✗ Redis connection failed")
            return False

    except Exception as e:
        print(f"✗ Redis connection error: {e}")
        print("\nMake sure Redis is running:")
        print("  brew services start redis  # macOS")
        print("  sudo systemctl start redis  # Linux")
        return False


def test_basic_cache_operations():
    """Test basic get/set operations."""
    print("\n=== Test 2: Basic Cache Operations ===")

    cache = get_redis_cache()

    # Test set/get
    key = "test:basic"
    value = {"message": "Hello Redis!", "number": 42}

    print(f"Setting key '{key}'...")
    success = cache.set(key, value)
    print(f"  Set: {'✓' if success else '✗'}")

    retrieved = cache.get(key)
    print(f"  Get: {'✓' if retrieved == value else '✗'}")
    print(f"  Value: {retrieved}")

    # Test exists
    exists = cache.exists(key)
    print(f"  Exists: {'✓' if exists else '✗'}")

    # Test delete
    deleted = cache.delete(key)
    print(f"  Delete: {'✓' if deleted else '✗'}")

    exists_after = cache.exists(key)
    print(f"  Exists after delete: {'✗ (correct)' if not exists_after else '✓ (incorrect)'}")


def test_ttl():
    """Test TTL (time-to-live) functionality."""
    print("\n=== Test 3: TTL (Time-To-Live) ===")

    cache = get_redis_cache()

    key = "test:ttl"
    value = "This will expire"
    ttl = 5  # 5 seconds

    print(f"Setting key with TTL={ttl}s...")
    cache.set(key, value, ttl=ttl)

    ttl_remaining = cache.get_ttl(key)
    print(f"  TTL remaining: {ttl_remaining}s")

    print(f"  Waiting 2 seconds...")
    time.sleep(2)

    still_exists = cache.exists(key)
    print(f"  Still exists after 2s: {'✓' if still_exists else '✗'}")

    ttl_remaining = cache.get_ttl(key)
    print(f"  TTL remaining: ~{ttl_remaining}s")

    print(f"  Waiting {ttl}s for expiration...")
    time.sleep(ttl)

    expired = not cache.exists(key)
    print(f"  Expired after {ttl}s: {'✓' if expired else '✗'}")


def test_batch_operations():
    """Test batch get/set operations."""
    print("\n=== Test 4: Batch Operations ===")

    cache = get_redis_cache()

    # Set multiple keys
    data = {
        "test:batch:1": "value1",
        "test:batch:2": "value2",
        "test:batch:3": "value3",
    }

    print(f"Setting {len(data)} keys in batch...")
    success = cache.set_many(data)
    print(f"  Set batch: {'✓' if success else '✗'}")

    # Get multiple keys
    keys = list(data.keys())
    retrieved = cache.get_many(keys)

    print(f"  Get batch: {'✓' if len(retrieved) == len(data) else '✗'}")
    print(f"  Retrieved {len(retrieved)}/{len(data)} keys")

    # Cleanup
    cache.delete_pattern("test:batch:*")


def test_embedding_cache():
    """Test embedding-specific caching."""
    print("\n=== Test 5: Embedding Cache ===")

    emb_cache = EmbeddingCache()

    # Create mock embeddings
    product_id = 123
    user_id = 456

    product_emb = np.random.randn(512).astype(np.float32)
    product_emb = product_emb / np.linalg.norm(product_emb)

    user_emb = np.random.randn(512).astype(np.float32)
    user_emb = user_emb / np.linalg.norm(user_emb)

    # Test product embedding cache
    print(f"\nProduct Embedding (ID={product_id}):")
    emb_cache.set_product_embedding(product_id, product_emb)
    cached_product = emb_cache.get_product_embedding(product_id)

    if cached_product is not None:
        match = np.allclose(cached_product, product_emb)
        print(f"  Set/Get: {'✓' if match else '✗'}")
        print(f"  Shape: {cached_product.shape}")
        print(f"  L2 norm: {np.linalg.norm(cached_product):.6f}")
    else:
        print(f"  Set/Get: ✗ (not found)")

    # Test user embedding cache
    print(f"\nUser Embedding (ID={user_id}):")
    emb_cache.set_user_long_term_embedding(user_id, user_emb)
    cached_user = emb_cache.get_user_long_term_embedding(user_id)

    if cached_user is not None:
        match = np.allclose(cached_user, user_emb)
        print(f"  Set/Get: {'✓' if match else '✗'}")
        print(f"  Shape: {cached_user.shape}")
    else:
        print(f"  Set/Get: ✗ (not found)")

    # Cleanup
    emb_cache.delete_product_embedding(product_id)
    emb_cache.delete_user_embeddings(user_id)


def test_batch_embedding_cache():
    """Test batch embedding caching."""
    print("\n=== Test 6: Batch Embedding Cache ===")

    emb_cache = EmbeddingCache()

    # Create multiple mock embeddings
    num_products = 10
    embeddings = {}

    for i in range(num_products):
        emb = np.random.randn(512).astype(np.float32)
        emb = emb / np.linalg.norm(emb)
        embeddings[1000 + i] = emb

    print(f"Caching {len(embeddings)} product embeddings...")
    start_time = time.time()
    emb_cache.set_product_embeddings_batch(embeddings)
    set_time = (time.time() - start_time) * 1000

    print(f"  Set batch time: {set_time:.2f}ms")

    # Retrieve batch
    product_ids = list(embeddings.keys())
    start_time = time.time()
    cached = emb_cache.get_product_embeddings_batch(product_ids)
    get_time = (time.time() - start_time) * 1000

    print(f"  Get batch time: {get_time:.2f}ms")
    print(f"  Cache hit rate: {len(cached)}/{len(product_ids)} ({len(cached)/len(product_ids)*100:.0f}%)")

    # Verify one embedding
    if 1000 in cached:
        match = np.allclose(cached[1000], embeddings[1000])
        print(f"  Data integrity: {'✓' if match else '✗'}")

    # Cleanup
    for pid in product_ids:
        emb_cache.delete_product_embedding(pid)


def test_hot_products_tracking():
    """Test hot products tracking."""
    print("\n=== Test 7: Hot Products Tracking ===")

    emb_cache = EmbeddingCache()

    # Simulate product views
    product_ids = [101, 102, 103, 101, 102, 101]  # 101 viewed 3x, 102 2x, 103 1x

    print(f"Tracking {len(product_ids)} product views...")
    for pid in product_ids:
        emb_cache.track_product_view(pid)

    # Get hot products
    hot_products = emb_cache.get_hot_products(limit=10)

    print(f"  Hot products: {hot_products}")
    print(f"  Top product: {hot_products[0] if hot_products else 'None'}")

    # Check if a product is hot
    is_hot = emb_cache.is_hot_product(101, threshold=2)
    print(f"  Product 101 is hot (threshold=2): {'✓' if is_hot else '✗'}")


def test_cache_stats():
    """Test cache statistics."""
    print("\n=== Test 8: Cache Statistics ===")

    emb_cache = EmbeddingCache()

    stats = emb_cache.get_cache_stats()

    print("\nCache Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")


def cleanup():
    """Clean up test data."""
    print("\n=== Cleanup ===")

    cache = get_redis_cache()

    # Delete all test keys
    count = cache.delete_pattern("test:*")
    print(f"Deleted {count} test keys")


def main():
    parser = argparse.ArgumentParser(description='Test Redis cache')
    parser.add_argument(
        '--test',
        type=str,
        choices=['all', 'connection', 'basic', 'ttl', 'batch', 'embedding', 'batch-emb', 'hot', 'stats'],
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
    print("Redis Cache Tests")
    print("=" * 60)

    # Test connection first
    if not test_redis_connection():
        print("\n✗ Cannot proceed without Redis connection")
        sys.exit(1)

    # Run tests
    if args.test in ['all', 'basic']:
        test_basic_cache_operations()

    if args.test in ['all', 'ttl']:
        test_ttl()

    if args.test in ['all', 'batch']:
        test_batch_operations()

    if args.test in ['all', 'embedding']:
        test_embedding_cache()

    if args.test in ['all', 'batch-emb']:
        test_batch_embedding_cache()

    if args.test in ['all', 'hot']:
        test_hot_products_tracking()

    if args.test in ['all', 'stats']:
        test_cache_stats()

    if args.cleanup or args.test == 'all':
        cleanup()

    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
