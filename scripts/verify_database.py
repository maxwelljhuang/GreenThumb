#!/usr/bin/env python3
"""
Database Verification Script
Verifies that all tables and extensions are properly created in the database.
"""

import os
import sys
from typing import List, Tuple

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("Error: psycopg2 not installed. Install with: pip install psycopg2-binary")
    sys.exit(1)


# ANSI color codes
GREEN = '\033[0;32m'
RED = '\033[0;31m'
BLUE = '\033[0;34m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color


def get_database_url() -> str:
    """Get database URL from environment."""
    return os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
    )


def parse_database_url(url: str) -> dict:
    """Parse database URL into connection parameters."""
    # Simple parsing for postgresql://user:pass@host:port/dbname
    url = url.replace('postgresql://', '')
    auth, rest = url.split('@')
    user, password = auth.split(':')
    host_port, dbname = rest.split('/')
    host, port = host_port.split(':')

    return {
        'user': user,
        'password': password,
        'host': host,
        'port': port,
        'dbname': dbname
    }


def check_connection(conn_params: dict) -> Tuple[bool, str]:
    """Check if we can connect to the database."""
    try:
        conn = psycopg2.connect(**conn_params)
        conn.close()
        return True, "Successfully connected to database"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"


def check_extensions(conn) -> List[Tuple[str, bool, str]]:
    """Check if required extensions are installed."""
    required_extensions = ['uuid-ossp', 'pg_trgm']
    optional_extensions = ['vector']

    results = []
    cursor = conn.cursor()

    for ext in required_extensions:
        try:
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = %s)",
                (ext,)
            )
            exists = cursor.fetchone()[0]
            results.append((ext, exists, "required"))
        except Exception as e:
            results.append((ext, False, f"error: {str(e)}"))

    for ext in optional_extensions:
        try:
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = %s)",
                (ext,)
            )
            exists = cursor.fetchone()[0]
            results.append((ext, exists, "optional"))
        except Exception as e:
            results.append((ext, False, f"optional (not available)"))

    cursor.close()
    return results


def check_tables(conn) -> List[Tuple[str, bool, int]]:
    """Check if required tables exist and get row counts."""
    required_tables = [
        'products',
        'users',
        'user_embeddings',
        'product_embeddings',
        'ingestion_logs',
        'data_quality_issues',
        'alembic_version'
    ]

    results = []
    cursor = conn.cursor()

    for table in required_tables:
        try:
            # Check if table exists
            cursor.execute(
                "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = %s)",
                (table,)
            )
            exists = cursor.fetchone()[0]

            if exists:
                # Get row count
                cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(
                    sql.Identifier(table)
                ))
                count = cursor.fetchone()[0]
                results.append((table, True, count))
            else:
                results.append((table, False, 0))
        except Exception as e:
            results.append((table, False, -1))

    cursor.close()
    return results


def check_indexes(conn) -> List[Tuple[str, str, bool]]:
    """Check if important indexes exist."""
    important_indexes = [
        ('products', 'idx_products_merchant'),
        ('products', 'idx_products_name_trgm'),
        ('products', 'idx_products_brand_trgm'),
        ('users', 'idx_users_email'),
        ('ingestion_logs', 'idx_ingestion_logs_status'),
    ]

    results = []
    cursor = conn.cursor()

    for table, index in important_indexes:
        try:
            cursor.execute(
                """
                SELECT EXISTS(
                    SELECT 1 FROM pg_indexes
                    WHERE tablename = %s AND indexname = %s
                )
                """,
                (table, index)
            )
            exists = cursor.fetchone()[0]
            results.append((table, index, exists))
        except Exception as e:
            results.append((table, index, False))

    cursor.close()
    return results


def main():
    """Main verification function."""
    print(f"{BLUE}================================{NC}")
    print(f"{BLUE}Database Verification{NC}")
    print(f"{BLUE}================================{NC}\n")

    # Get database URL
    db_url = get_database_url()
    conn_params = parse_database_url(db_url)

    print(f"Database: {conn_params['dbname']}")
    print(f"Host: {conn_params['host']}:{conn_params['port']}")
    print(f"User: {conn_params['user']}\n")

    # Check connection
    print(f"{YELLOW}1. Checking database connection...{NC}")
    success, message = check_connection(conn_params)
    if success:
        print(f"{GREEN}  ✓ {message}{NC}\n")
    else:
        print(f"{RED}  ✗ {message}{NC}\n")
        sys.exit(1)

    # Connect for further checks
    conn = psycopg2.connect(**conn_params)

    # Check extensions
    print(f"{YELLOW}2. Checking PostgreSQL extensions...{NC}")
    extensions = check_extensions(conn)
    all_required_ext_installed = True
    for ext, exists, status in extensions:
        if 'required' in status:
            if exists:
                print(f"{GREEN}  ✓ {ext} (required){NC}")
            else:
                print(f"{RED}  ✗ {ext} (required) - NOT INSTALLED{NC}")
                all_required_ext_installed = False
        else:
            if exists:
                print(f"{GREEN}  ✓ {ext} (optional){NC}")
            else:
                print(f"{YELLOW}  - {ext} (optional) - not installed{NC}")
    print()

    # Check tables
    print(f"{YELLOW}3. Checking database tables...{NC}")
    tables = check_tables(conn)
    all_tables_exist = True
    for table, exists, count in tables:
        if exists:
            print(f"{GREEN}  ✓ {table:25s} ({count} rows){NC}")
        else:
            print(f"{RED}  ✗ {table:25s} - NOT FOUND{NC}")
            all_tables_exist = False
    print()

    # Check indexes
    print(f"{YELLOW}4. Checking important indexes...{NC}")
    indexes = check_indexes(conn)
    all_indexes_exist = True
    for table, index, exists in indexes:
        if exists:
            print(f"{GREEN}  ✓ {index:40s} on {table}{NC}")
        else:
            print(f"{RED}  ✗ {index:40s} on {table} - NOT FOUND{NC}")
            all_indexes_exist = False
    print()

    # Check migration version
    print(f"{YELLOW}5. Checking migration version...{NC}")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT version_num FROM alembic_version")
        version = cursor.fetchone()
        if version:
            print(f"{GREEN}  ✓ Current migration version: {version[0]}{NC}\n")
        else:
            print(f"{YELLOW}  - No migrations applied yet{NC}\n")
    except Exception as e:
        print(f"{RED}  ✗ Error checking migration version: {str(e)}{NC}\n")
    cursor.close()

    # Close connection
    conn.close()

    # Final summary
    print(f"{BLUE}================================{NC}")
    if all_required_ext_installed and all_tables_exist:
        print(f"{GREEN}✓ Database verification PASSED{NC}")
        print(f"{BLUE}================================{NC}\n")
        print(f"{GREEN}Your database is properly set up and ready to use!{NC}\n")
        return 0
    else:
        print(f"{RED}✗ Database verification FAILED{NC}")
        print(f"{BLUE}================================{NC}\n")
        if not all_required_ext_installed:
            print(f"{RED}Some required extensions are missing.{NC}")
        if not all_tables_exist:
            print(f"{RED}Some required tables are missing.{NC}")
        print(f"\n{YELLOW}Try running the setup script again:{NC}")
        print(f"  bash scripts/setup_database.sh\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
