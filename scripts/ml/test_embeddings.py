#!/usr/bin/env python3
"""
Test Embedding Generation
Quick test of image, text, and fusion without database.

Usage:
    python scripts/ml/test_embeddings.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ml.config import TORCH_AVAILABLE

if not TORCH_AVAILABLE:
    print("❌ ML dependencies not installed")
    print("Install with: pip install -r requirements-ml.txt")
    sys.exit(1)

from backend.ml.embeddings import (
    get_image_encoder,
    get_text_encoder,
    get_embedding_fusion
)
import numpy as np


def test_text_encoding():
    """Test text embedding generation."""
    print("\n" + "=" * 60)
    print("Testing Text Encoding")
    print("=" * 60)

    encoder = get_text_encoder()

    # Test product
    product = {
        'title': 'Vintage Floral Summer Dress',
        'description': 'Beautiful flowing dress perfect for summer occasions',
        'brand': 'Free People',
        'category': 'Dresses',
        'color': 'Blue',
        'material': 'Cotton',
    }

    # Build text
    text = encoder.build_product_text(**product)
    print(f"\nCombined text:")
    print(f"  '{text}'")

    # Encode
    result = encoder.encode_product_text(
        product_id='test-123',
        **product
    )

    if result['success']:
        emb = result['embedding']
        print(f"\n✓ Text embedding generated:")
        print(f"  Shape: {emb.shape}")
        print(f"  Dtype: {emb.dtype}")
        print(f"  Norm: {np.linalg.norm(emb):.4f}")
        print(f"  First 5 values: {emb[:5]}")
        return emb
    else:
        print(f"✗ Text encoding failed: {result.get('error')}")
        return None


def test_image_encoding():
    """Test image embedding generation."""
    print("\n" + "=" * 60)
    print("Testing Image Encoding")
    print("=" * 60)

    encoder = get_image_encoder()

    # Use a sample image from Unsplash
    test_url = "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400"
    print(f"\nDownloading image: {test_url}")

    try:
        emb, metadata = encoder.encode_image_from_url(test_url)

        print(f"\n✓ Image embedding generated:")
        print(f"  Image size: {metadata['image_size']}")
        print(f"  Download time: {metadata['download_time_ms']:.1f}ms")
        print(f"  Encode time: {metadata['encode_time_ms']:.1f}ms")
        print(f"  Embedding shape: {emb.shape}")
        print(f"  Embedding norm: {np.linalg.norm(emb):.4f}")
        print(f"  First 5 values: {emb[:5]}")
        return emb

    except Exception as e:
        print(f"✗ Image encoding failed: {e}")
        return None


def test_fusion(img_emb, txt_emb):
    """Test embedding fusion."""
    print("\n" + "=" * 60)
    print("Testing Embedding Fusion")
    print("=" * 60)

    fusion = get_embedding_fusion()

    # Test fusion
    fused, metadata = fusion.fuse(img_emb, txt_emb)

    if metadata['success']:
        print(f"\n✓ Fusion successful:")
        print(f"  Strategy: {metadata['strategy']}")
        print(f"  Has image: {metadata['has_image']}")
        print(f"  Has text: {metadata['has_text']}")
        print(f"  Fused shape: {fused.shape}")
        print(f"  Fused norm: {np.linalg.norm(fused):.4f}")
        print(f"  First 5 values: {fused[:5]}")
        return fused
    else:
        print(f"✗ Fusion failed: {metadata.get('error')}")
        return None


def test_similarity():
    """Test semantic similarity."""
    print("\n" + "=" * 60)
    print("Testing Semantic Similarity")
    print("=" * 60)

    encoder = get_text_encoder()

    # Test similar vs dissimilar products
    products = [
        "Vintage floral summer dress",
        "Retro flower pattern dress",
        "Black leather motorcycle jacket",
    ]

    embeddings = []
    for text in products:
        emb = encoder.encode_text(text)
        embeddings.append(emb)

    # Compute similarities
    def cosine_sim(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    sim_similar = cosine_sim(embeddings[0], embeddings[1])
    sim_different = cosine_sim(embeddings[0], embeddings[2])

    print(f"\nSimilarity scores (cosine):")
    print(f"  '{products[0]}' vs")
    print(f"  '{products[1]}': {sim_similar:.4f}")
    print()
    print(f"  '{products[0]}' vs")
    print(f"  '{products[2]}': {sim_different:.4f}")

    if sim_similar > sim_different:
        print(f"\n✓ Similar items have higher similarity ({sim_similar:.4f} > {sim_different:.4f})")
    else:
        print(f"\n⚠  Unexpected: dissimilar items have higher similarity")


def main():
    print("=" * 60)
    print("  Embedding Generation Test")
    print("=" * 60)

    # Test text encoding
    txt_emb = test_text_encoding()

    # Test image encoding
    img_emb = test_image_encoding()

    # Test fusion
    if txt_emb is not None and img_emb is not None:
        fused_emb = test_fusion(img_emb, txt_emb)
    else:
        print("\n⚠  Skipping fusion test (missing embeddings)")

    # Test similarity
    test_similarity()

    print("\n" + "=" * 60)
    print("✅ All tests complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Generate embeddings for products:")
    print("   python scripts/ml/generate_embeddings.py --max-products 100")
    print("2. Create vector indexes:")
    print("   python scripts/database/create_vector_indexes.py")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
