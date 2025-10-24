#!/usr/bin/env python3
"""
Verify Embeddings Schema
Check that embedding columns exist and are properly configured.

Usage:
    python scripts/database/verify_embeddings_schema.py
"""

import sys
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    """Get database connection from environment."""
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/greenthumb_dev')

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


def check_extension(conn, ext_name):
    """Check if a PostgreSQL extension is installed."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS(
                SELECT 1 FROM pg_extension WHERE extname = %s
            )
        """, (ext_name,))
        return cur.fetchone()[0]


def get_table_columns(conn, table_name):
    """Get all columns for a table."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        return cur.fetchall()


def check_column_exists(conn, table_name, column_name):
    """Check if a specific column exists."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS(
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = %s AND column_name = %s
            )
        """, (table_name, column_name))
        return cur.fetchone()[0]


def get_column_type(conn, table_name, column_name):
    """Get the data type of a column."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = %s AND column_name = %s
        """, (table_name, column_name))
        result = cur.fetchone()
        return result if result else (None, None)


def count_table_rows(conn, table_name, where_clause=None):
    """Count rows in a table."""
    with conn.cursor() as cur:
        query = f"SELECT COUNT(*) FROM {table_name}"
        if where_clause:
            query += f" WHERE {where_clause}"
        cur.execute(query)
        return cur.fetchone()[0]


def main():
    print("=" * 60)
    print("  Embeddings Schema Verification")
    print("=" * 60)

    try:
        conn = get_db_connection()
        print("✓ Connected to database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        return 1

    print()

    # Check extensions
    print("Checking PostgreSQL extensions...")
    extensions = ['vector', 'pg_trgm', 'uuid-ossp']
    for ext in extensions:
        installed = check_extension(conn, ext)
        status = "✓" if installed else "✗"
        print(f"  {status} {ext}")

    if not check_extension(conn, 'vector'):
        print("\n❌ pgvector not installed!")
        print("Run migration: cd database/migrations && alembic upgrade head")
        return 1

    print()

    # Check products table
    print("Checking products table...")
    products_embedding_cols = [
        ('image_embedding', 'vector'),
        ('text_embedding', 'vector'),
        ('embedding', 'vector'),
        ('embedding_model_version', 'character varying'),
        ('embedding_generated_at', 'timestamp without time zone'),
    ]

    all_exist = True
    for col_name, expected_type in products_embedding_cols:
        exists = check_column_exists(conn, 'products', col_name)
        if exists:
            data_type, udt_name = get_column_type(conn, 'products', col_name)
            # Check if type matches (vector or expected type)
            type_match = udt_name == 'vector' or expected_type in (data_type, udt_name)
            type_str = udt_name if udt_name == 'vector' else data_type
            status = "✓" if type_match else "⚠"
            print(f"  {status} {col_name} ({type_str})")
        else:
            print(f"  ✗ {col_name} (NOT FOUND)")
            all_exist = False

    print()

    # Check user_embeddings table
    print("Checking user_embeddings table...")
    user_embedding_cols = [
        ('long_term_embedding', 'vector'),
        ('session_embedding', 'vector'),
        ('last_interaction_at', 'timestamp without time zone'),
    ]

    for col_name, expected_type in user_embedding_cols:
        exists = check_column_exists(conn, 'user_embeddings', col_name)
        if exists:
            data_type, udt_name = get_column_type(conn, 'user_embeddings', col_name)
            type_str = udt_name if udt_name == 'vector' else data_type
            print(f"  ✓ {col_name} ({type_str})")
        else:
            print(f"  ✗ {col_name} (NOT FOUND)")
            all_exist = False

    print()

    # Count products
    total_products = count_table_rows(conn, 'products')
    products_with_embeddings = count_table_rows(conn, 'products', 'embedding IS NOT NULL')

    print(f"📊 Product Statistics:")
    print(f"  Total products: {total_products:,}")
    print(f"  With embeddings: {products_with_embeddings:,}")

    if total_products > 0:
        pct = (products_with_embeddings / total_products) * 100
        print(f"  Coverage: {pct:.1f}%")

    print()

    # Check indexes
    print("Checking vector indexes...")
    with conn.cursor() as cur:
        cur.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename IN ('products', 'user_embeddings')
              AND indexdef LIKE '%vector%'
        """)
        vector_indexes = cur.fetchall()

    if vector_indexes:
        for idx_name, idx_def in vector_indexes:
            # Extract index type (ivfflat or hnsw)
            if 'ivfflat' in idx_def.lower():
                idx_type = 'IVFFlat'
            elif 'hnsw' in idx_def.lower():
                idx_type = 'HNSW'
            else:
                idx_type = 'unknown'
            print(f"  ✓ {idx_name} ({idx_type})")
    else:
        print(f"  ℹ  No vector indexes found")
        print(f"     Run: python scripts/database/create_vector_indexes.py")

    print()
    print("=" * 60)

    if all_exist:
        print("✅ All embedding columns exist!")

        if products_with_embeddings == 0 and total_products > 0:
            print("\n⚠  Products exist but no embeddings generated yet")
            print("Next steps:")
            print("1. Generate embeddings: python -m backend.ml.generate_embeddings")
            print("2. Create indexes: python scripts/database/create_vector_indexes.py")
        elif products_with_embeddings > 0:
            print("\n✅ Schema is ready for similarity search!")
            if not vector_indexes:
                print("\n📝 Recommended:")
                print("  Create indexes for faster search:")
                print("  python scripts/database/create_vector_indexes.py")
        else:
            print("\n📝 Next steps:")
            print("1. Ingest products: python -m backend.ingestion.csv_processor <file>")
            print("2. Generate embeddings: python -m backend.ml.generate_embeddings")
            print("3. Create indexes: python scripts/database/create_vector_indexes.py")

        print("=" * 60)
        return 0
    else:
        print("❌ Some columns are missing")
        print("\nRun the migration:")
        print("  cd database/migrations")
        print("  alembic upgrade head")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
