#!/usr/bin/env python
"""
Test the advanced deduplication service.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.ingestion.deduplication import AdvancedDeduplicator
from backend.models.product import ProductIngestion
import pandas as pd


def create_test_products():
    """Create test products with various duplicate patterns."""
    products = []
    
    # Exact duplicates
    base_product = {
        'aw_product_id': 'AW001',
        'merchant_product_id': 'MP001',
        'merchant_id': 1,
        'product_name': 'Nike Air Max 90 Black',
        'brand_name': 'Nike',
        'search_price': '99.99',
        'colour': 'Black'
    }
    products.append(ProductIngestion(**base_product))
    
    # Exact duplicate (different merchant_product_id)
    dup1 = base_product.copy()
    dup1['merchant_product_id'] = 'MP001-DUP'
    products.append(ProductIngestion(**dup1))
    
    # Fuzzy duplicate (slight name variation)
    fuzzy1 = base_product.copy()
    fuzzy1['merchant_product_id'] = 'MP002'
    fuzzy1['product_name'] = 'Nike Air Max 90 - Black'
    products.append(ProductIngestion(**fuzzy1))
    
    # Fuzzy duplicate (typo)
    fuzzy2 = base_product.copy()
    fuzzy2['merchant_product_id'] = 'MP003'
    fuzzy2['product_name'] = 'Nike Air Max 90 Blck'
    products.append(ProductIngestion(**fuzzy2))
    
    # Similar but different product
    similar = base_product.copy()
    similar['merchant_product_id'] = 'MP004'
    similar['product_name'] = 'Nike Air Max 90 White'
    similar['colour'] = 'White'
    products.append(ProductIngestion(**similar))
    
    # Different brand, same model
    different = base_product.copy()
    different['merchant_product_id'] = 'MP005'
    different['product_name'] = 'Adidas Air Max 90 Black'
    different['brand_name'] = 'Adidas'
    products.append(ProductIngestion(**different))
    
    # Add more diverse products
    for i in range(6, 20):
        products.append(ProductIngestion(**{
            'aw_product_id': f'AW{i:03d}',
            'merchant_product_id': f'MP{i:03d}',
            'merchant_id': 1,
            'product_name': f'Product {i}',
            'brand_name': f'Brand{i % 3}',
            'search_price': f'{50 + i * 5}'
        }))
    
    return products


def test_deduplication():
    """Test the deduplication service."""
    print("=" * 60)
    print("Testing Advanced Deduplication")
    print("=" * 60)
    
    # Create test products
    products = create_test_products()
    print(f"\nCreated {len(products)} test products")
    
    # Initialize deduplicator
    dedup = AdvancedDeduplicator(
        fuzzy_threshold=0.85,
        cluster_min_similarity=0.70
    )
    
    # Run deduplication
    unique_products, duplicate_clusters = dedup.deduplicate_batch(
        products,
        check_database=False
    )
    
    # Display results
    print(f"\nResults:")
    print(f"  Unique products: {len(unique_products)}")
    print(f"  Duplicate clusters: {len(duplicate_clusters)}")
    
    # Show duplicate clusters
    print("\nDuplicate Clusters Found:")
    for cluster in duplicate_clusters:
        print(f"\n  Cluster ID: {cluster.cluster_id}")
        print(f"  Method: {cluster.method}")
        print(f"  Confidence: {cluster.confidence:.2f}")
        print(f"  Products in cluster: {len(cluster.products)}")
        print(f"  Canonical: {cluster.canonical_product['name']}")
        
        for product in cluster.products:
            print(f"    - {product['name']} (quality: {product['quality_score']:.2f})")
    
    # Show statistics
    print("\n" + "=" * 60)
    print("Statistics:")
    for key, value in dedup.stats.items():
        print(f"  {key}: {value}")
    print("=" * 60)


def test_clustering():
    """Test HDBSCAN clustering specifically."""
    print("\n" + "=" * 60)
    print("Testing HDBSCAN Clustering")
    print("=" * 60)
    
    # Create products with subtle variations
    products = []
    
    # Create groups of similar products
    groups = [
        ('Nike', 'Air Max 90'),
        ('Nike', 'Air Force 1'),
        ('Adidas', 'Ultra Boost'),
        ('Adidas', 'Stan Smith')
    ]
    
    for brand, model in groups:
        # Create variations
        variations = [
            f"{brand} {model} Black Size 10",
            f"{brand} {model} - Black - Size 10",
            f"{brand} {model} BLACK size10",
            f"{model} {brand} Black 10"
        ]
        
        for i, name in enumerate(variations):
            products.append(ProductIngestion(**{
                'aw_product_id': f'AW{len(products)}',
                'merchant_product_id': f'MP{len(products)}',
                'merchant_id': 1,
                'product_name': name,
                'brand_name': brand,
                'search_price': '99.99'
            }))
    
    print(f"Created {len(products)} products in {len(groups)} expected clusters")
    
    # Run deduplication
    dedup = AdvancedDeduplicator(
        fuzzy_threshold=0.90,  # Higher threshold to test HDBSCAN
        cluster_min_similarity=0.65
    )
    
    unique_products, duplicate_clusters = dedup.deduplicate_batch(products)
    
    print(f"\nClustering Results:")
    print(f"  Expected clusters: {len(groups)}")
    print(f"  Found clusters: {len([c for c in duplicate_clusters if c.method == 'hdbscan_cluster'])}")
    
    for cluster in duplicate_clusters:
        if cluster.method == 'hdbscan_cluster':
            print(f"\n  Cluster: {cluster.cluster_id}")
            print(f"  Confidence: {cluster.confidence:.2f}")
            print(f"  Products:")
            for p in cluster.products:
                print(f"    - {p['name']}")


if __name__ == '__main__':
    test_deduplication()
    test_clustering()