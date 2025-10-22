#!/usr/bin/env python
"""
Analyze and report on duplicates in the database.
"""

import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
import pandas as pd


def analyze_duplicates():
    """Analyze duplicate patterns in the database."""
    
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
    )
    
    engine = create_engine(db_url)
    
    print("=" * 60)
    print("Duplicate Analysis Report")
    print("=" * 60)
    
    # 1. Count total products
    result = engine.execute(text("""
        SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT product_hash) as unique_hashes,
            COUNT(CASE WHEN is_duplicate = true THEN 1 END) as marked_duplicates,
            COUNT(CASE WHEN canonical_product_id IS NOT NULL THEN 1 END) as has_canonical
        FROM products
    """))
    
    stats = result.first()
    print(f"\nProduct Statistics:")
    print(f"  Total Products: {stats[0]}")
    print(f"  Unique Hashes: {stats[1]}")
    print(f"  Marked Duplicates: {stats[2]}")
    print(f"  Has Canonical Reference: {stats[3]}")
    
    # 2. Find hash collisions
    result = engine.execute(text("""
        SELECT 
            product_hash,
            COUNT(*) as count,
            STRING_AGG(DISTINCT brand_name, ', ') as brands,
            STRING_AGG(DISTINCT LEFT(product_name, 50), ' | ') as sample_names
        FROM products
        WHERE product_hash IS NOT NULL
        GROUP BY product_hash
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 10
    """))
    
    print(f"\nTop Duplicate Groups (by hash):")
    for row in result:
        print(f"  Hash: {row[0][:16]}...")
        print(f"    Count: {row[1]}")
        print(f"    Brands: {row[2]}")
        print(f"    Samples: {row[3][:100]}...")
    
    # 3. Analyze by brand
    result = engine.execute(text("""
        SELECT 
            brand_name,
            COUNT(*) as total_products,
            COUNT(DISTINCT product_hash) as unique_products,
            COUNT(*) - COUNT(DISTINCT product_hash) as duplicates
        FROM products
        WHERE brand_name IS NOT NULL
        GROUP BY brand_name
        HAVING COUNT(*) > 10
        ORDER BY (COUNT(*) - COUNT(DISTINCT product_hash)) DESC
        LIMIT 10
    """))
    
    print(f"\nBrands with Most Duplicates:")
    for row in result:
        dup_rate = (row[3] / row[1] * 100) if row[1] > 0 else 0
        print(f"  {row[0]}: {row[3]} duplicates out of {row[1]} ({dup_rate:.1f}%)")
    
    # 4. Quality score distribution
    result = engine.execute(text("""
        SELECT 
            ROUND(quality_score::numeric, 1) as score_range,
            COUNT(*) as count,
            AVG(CASE WHEN is_duplicate THEN 1 ELSE 0 END) as duplicate_rate
        FROM products
        GROUP BY ROUND(quality_score::numeric, 1)
        ORDER BY score_range
    """))
    
    print(f"\nQuality Score vs Duplicate Rate:")
    for row in result:
        print(f"  Score {row[0]}: {row[1]} products, {row[2]*100:.1f}% duplicates")
    
    # 5. Cross-merchant duplicates
    result = engine.execute(text("""
        WITH product_groups AS (
            SELECT 
                product_hash,
                COUNT(DISTINCT merchant_id) as merchant_count,
                COUNT(*) as total_count,
                STRING_AGG(DISTINCT merchant_name, ', ') as merchants
            FROM products
            WHERE product_hash IS NOT NULL
            GROUP BY product_hash
            HAVING COUNT(DISTINCT merchant_id) > 1
        )
        SELECT 
            COUNT(*) as cross_merchant_groups,
            SUM(total_count) as affected_products,
            MAX(merchant_count) as max_merchants
        FROM product_groups
    """))
    
    stats = result.first()
    if stats[0]:
        print(f"\nCross-Merchant Duplicates:")
        print(f"  Product groups across merchants: {stats[0]}")
        print(f"  Total affected products: {stats[1]}")
        print(f"  Max merchants with same product: {stats[2]}")


if __name__ == '__main__':
    analyze_duplicates()