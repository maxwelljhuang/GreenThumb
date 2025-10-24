#!/usr/bin/env python3
"""
Create pgvector Indexes
Creates IVFFlat or HNSW indexes for fast similarity search.

Note: IVFFlat requires at least 100 rows in the table.
Run this AFTER generating embeddings for products.

Usage:
    python scripts/database/create_vector_indexes.py
    python scripts/database/create_vector_indexes.py --index-type hnsw
    python scripts/database/create_vector_indexes.py --check-only
"""

import sys
import argparse
import psycopg2
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    """Get database connection from environment."""
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/greenthumb_dev')

    # Parse connection string
    # Format: postgresql://user:password@host:port/dbname
    if db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', '')

    parts = db_url.split('@')
    user_pass = parts[0].split(':')
    host_port_db = parts[1].split('/')
    host_port = host_port_db[0].split(':')

    return psycopg2.connect(
        host=host_port[0],
        port=int(host_port[1]) if len(host_port) > 1 else 5432,
        database=host_port_db[1].split('?')[0],
        user=user_pass[0],
        password=user_pass[1] if len(user_pass) > 1 else ''
    )


def check_pgvector_installed(conn):
    """Check if pgvector extension is installed."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS(
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            )
        """)
        return cur.fetchone()[0]


def count_products_with_embeddings(conn):
    """Count how many products have embeddings."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*)
            FROM products
            WHERE embedding IS NOT NULL
        """)
        return cur.fetchone()[0]


def check_index_exists(conn, index_name):
    """Check if an index already exists."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS(
                SELECT 1 FROM pg_indexes
                WHERE indexname = %s
            )
        """, (index_name,))
        return cur.fetchone()[0]


def create_ivfflat_index(conn, lists=100):
    """
    Create IVFFlat index for products.embedding.

    IVFFlat is good for:
    - Large datasets (10k-10M rows)
    - Good balance of speed/accuracy
    - Requires tuning 'lists' parameter

    Args:
        lists: Number of clusters (default 100)
               Rule of thumb: sqrt(num_rows) or rows/1000
    """
    index_name = 'idx_products_embedding_ivfflat'

    if check_index_exists(conn, index_name):
        print(f"ℹ  Index '{index_name}' already exists, skipping")
        return

    print(f"Creating IVFFlat index with {lists} lists...")
    print("This may take a few minutes for large datasets...")

    with conn.cursor() as cur:
        cur.execute(f"""
            CREATE INDEX {index_name}
            ON products USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = {lists})
        """)

    conn.commit()
    print(f"✓ Created {index_name}")


def create_hnsw_index(conn, m=16, ef_construction=64):
    """
    Create HNSW index for products.embedding.

    HNSW is good for:
    - Small to medium datasets (<1M rows)
    - High accuracy requirements
    - Faster build time than IVFFlat

    Args:
        m: Number of connections per layer (default 16)
           Higher = better recall, more memory
        ef_construction: Size of dynamic candidate list (default 64)
                        Higher = better quality, slower build
    """
    index_name = 'idx_products_embedding_hnsw'

    if check_index_exists(conn, index_name):
        print(f"ℹ  Index '{index_name}' already exists, skipping")
        return

    print(f"Creating HNSW index (m={m}, ef_construction={ef_construction})...")

    with conn.cursor() as cur:
        cur.execute(f"""
            CREATE INDEX {index_name}
            ON products USING hnsw (embedding vector_cosine_ops)
            WITH (m = {m}, ef_construction = {ef_construction})
        """)

    conn.commit()
    print(f"✓ Created {index_name}")


def create_user_embedding_indexes(conn):
    """Create HNSW indexes for user embeddings (smaller dataset)."""

    # Long-term embeddings
    index_name = 'idx_user_embeddings_long_term_hnsw'
    if not check_index_exists(conn, index_name):
        print(f"Creating {index_name}...")
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE INDEX {index_name}
                ON user_embeddings USING hnsw (long_term_embedding vector_cosine_ops)
            """)
        conn.commit()
        print(f"✓ Created {index_name}")
    else:
        print(f"ℹ  {index_name} already exists")

    # Session embeddings
    index_name = 'idx_user_embeddings_session_hnsw'
    if not check_index_exists(conn, index_name):
        print(f"Creating {index_name}...")
        with conn.cursor() as cur:
            cur.execute(f"""
                CREATE INDEX {index_name}
                ON user_embeddings USING hnsw (session_embedding vector_cosine_ops)
            """)
        conn.commit()
        print(f"✓ Created {index_name}")
    else:
        print(f"ℹ  {index_name} already exists")


def get_recommended_lists(num_products):
    """Get recommended number of lists for IVFFlat."""
    if num_products < 100:
        return None  # Too few for IVFFlat
    elif num_products < 1000:
        return 10
    elif num_products < 10000:
        return 100
    elif num_products < 100000:
        return 500
    else:
        return int(num_products ** 0.5)  # sqrt(n)


def main():
    parser = argparse.ArgumentParser(description='Create pgvector indexes for similarity search')
    parser.add_argument('--index-type', choices=['ivfflat', 'hnsw', 'both'], default='ivfflat',
                       help='Type of index to create (default: ivfflat)')
    parser.add_argument('--lists', type=int, help='Number of lists for IVFFlat (auto-calculated if not specified)')
    parser.add_argument('--check-only', action='store_true', help='Only check status, don\'t create indexes')
    parser.add_argument('--include-users', action='store_true', help='Also create user embedding indexes')

    args = parser.parse_args()

    print("=" * 60)
    print("  pgvector Index Creation")
    print("=" * 60)

    # Connect to database
    try:
        conn = get_db_connection()
        print("✓ Connected to database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return 1

    # Check pgvector extension
    if not check_pgvector_installed(conn):
        print("❌ pgvector extension not installed")
        print("Run the migration first: alembic upgrade head")
        return 1
    print("✓ pgvector extension installed")

    # Count products with embeddings
    num_products = count_products_with_embeddings(conn)
    print(f"✓ Found {num_products:,} products with embeddings")

    if num_products == 0:
        print("\n⚠  No products have embeddings yet")
        print("Generate embeddings first with: python -m backend.ml.generate_embeddings")
        return 0

    if args.check_only:
        print("\n📊 Index Status:")
        for idx in ['idx_products_embedding_ivfflat', 'idx_products_embedding_hnsw']:
            exists = check_index_exists(conn, idx)
            status = "✓ EXISTS" if exists else "✗ NOT FOUND"
            print(f"  {idx}: {status}")
        return 0

    # Determine index parameters
    if args.index_type in ['ivfflat', 'both']:
        if num_products < 100:
            print("\n⚠  IVFFlat requires at least 100 products with embeddings")
            print(f"Current count: {num_products}")
            print("Use HNSW instead or generate more embeddings")
            if args.index_type == 'ivfflat':
                return 1
        else:
            lists = args.lists or get_recommended_lists(num_products)
            print(f"\nℹ  Recommended lists for IVFFlat: {lists}")
            create_ivfflat_index(conn, lists)

    if args.index_type in ['hnsw', 'both']:
        create_hnsw_index(conn)

    if args.include_users:
        print("\n📊 Creating user embedding indexes...")
        create_user_embedding_indexes(conn)

    print("\n" + "=" * 60)
    print("✅ Index creation complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Test similarity search performance")
    print("2. Tune index parameters if needed")
    print("3. Set search parameters (nprobe for IVFFlat, ef_search for HNSW)")
    print("=" * 60)

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
