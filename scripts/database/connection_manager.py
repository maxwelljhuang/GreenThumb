#!/usr/bin/env python
"""
Database Connection Manager
Provides connection pooling and session management for reliable database operations.
"""

import os
import logging
from typing import Optional, Dict, Any, Callable, TypeVar, List
from contextlib import contextmanager
from functools import wraps
import time
from urllib.parse import urlparse

import psycopg2
from psycopg2 import pool, extensions, OperationalError
from psycopg2.extras import RealDictCursor, Json
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool

logger = logging.getLogger(__name__)

T = TypeVar('T')


class DatabaseConfig:
    """Database configuration."""
    
    def __init__(self, url: Optional[str] = None):
        """Initialize from URL or environment."""
        self.url = url or os.getenv(
            'DATABASE_URL',
            'postgresql://postgres:postgres@localhost:5432/greenthumb_dev'
        )
        
        # Parse URL
        parsed = urlparse(self.url)
        self.host = parsed.hostname
        self.port = parsed.port or 5432
        self.database = parsed.path[1:] if parsed.path else 'greenthumb_dev'
        self.username = parsed.username
        self.password = parsed.password
        
        # Connection pool settings
        self.pool_size = int(os.getenv('DB_POOL_SIZE', '20'))
        self.max_overflow = int(os.getenv('DB_MAX_OVERFLOW', '10'))
        self.pool_timeout = int(os.getenv('DB_POOL_TIMEOUT', '30'))
        self.pool_recycle = 3600  # Recycle connections after 1 hour
        
        # Retry settings
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds


class ConnectionManager:
    """
    Manages database connections with pooling and retry logic.
    Provides both psycopg2 and SQLAlchemy interfaces.
    """
    
    def __init__(self, config: Optional[DatabaseConfig] = None):
        """Initialize connection manager."""
        self.config = config or DatabaseConfig()
        
        # psycopg2 connection pool
        self.psycopg2_pool: Optional[pool.ThreadedConnectionPool] = None
        
        # SQLAlchemy engine
        self.engine = None
        self.Session = None
        
        # Statistics
        self.stats = {
            'connections_created': 0,
            'connections_failed': 0,
            'queries_executed': 0,
            'queries_failed': 0,
            'retries': 0
        }
        
        # Initialize pools
        self._init_psycopg2_pool()
        self._init_sqlalchemy()
    
    def _init_psycopg2_pool(self):
        """Initialize psycopg2 connection pool."""
        try:
            self.psycopg2_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=self.config.pool_size,
                host=self.config.host,
                port=self.config.port,
                database=self.config.database,
                user=self.config.username,
                password=self.config.password,
                connect_timeout=10,
                options='-c statement_timeout=300000'  # 5 minutes
            )
            logger.info(f"psycopg2 pool initialized with {self.config.pool_size} connections")
        except Exception as e:
            logger.error(f"Failed to initialize psycopg2 pool: {str(e)}")
            raise
    
    def _init_sqlalchemy(self):
        """Initialize SQLAlchemy engine with connection pooling."""
        try:
            self.engine = create_engine(
                self.config.url,
                poolclass=QueuePool,
                pool_size=self.config.pool_size,
                max_overflow=self.config.max_overflow,
                pool_timeout=self.config.pool_timeout,
                pool_recycle=self.config.pool_recycle,
                pool_pre_ping=True,  # Test connections before using
                echo=False,
                connect_args={
                    'connect_timeout': 10,
                    'options': '-c statement_timeout=300000'
                }
            )
            
            # Add event listeners for monitoring
            event.listen(self.engine, 'connect', self._on_connect)
            event.listen(self.engine, 'checkout', self._on_checkout)
            
            # Create session factory
            self.Session = sessionmaker(bind=self.engine)
            
            logger.info(f"SQLAlchemy engine initialized with pool size {self.config.pool_size}")
        except Exception as e:
            logger.error(f"Failed to initialize SQLAlchemy: {str(e)}")
            raise
    
    def _on_connect(self, dbapi_conn, connection_record):
        """Event handler for new connections."""
        self.stats['connections_created'] += 1
        logger.debug("New database connection created")
    
    def _on_checkout(self, dbapi_conn, connection_record, connection_proxy):
        """Event handler for connection checkout."""
        # Test connection is alive
        try:
            cursor = dbapi_conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
        except Exception:
            # Connection is dead, invalidate it
            connection_proxy.invalidate()
            raise
    
    @contextmanager
    def get_psycopg2_connection(self, autocommit: bool = False, cursor_factory=None):
        """
        Get a psycopg2 connection from the pool.
        
        Args:
            autocommit: Whether to use autocommit mode
            cursor_factory: Cursor factory (e.g., RealDictCursor)
            
        Yields:
            psycopg2 connection
        """
        conn = None
        try:
            conn = self.psycopg2_pool.getconn()
            
            if autocommit:
                conn.set_isolation_level(extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            
            # Set cursor factory if provided
            if cursor_factory:
                conn.cursor_factory = cursor_factory
            
            yield conn
            
            if not autocommit:
                conn.commit()
                
        except Exception as e:
            if conn and not autocommit:
                conn.rollback()
            logger.error(f"Database error: {str(e)}")
            self.stats['connections_failed'] += 1
            raise
        finally:
            if conn:
                self.psycopg2_pool.putconn(conn)
    
    @contextmanager
    def get_session(self) -> Session:
        """
        Get a SQLAlchemy session.
        
        Yields:
            SQLAlchemy session
        """
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Session error: {str(e)}")
            raise
        finally:
            session.close()
    
    def execute_with_retry(
        self,
        func: Callable[..., T],
        *args,
        max_retries: Optional[int] = None,
        **kwargs
    ) -> T:
        """
        Execute a function with retry logic.
        
        Args:
            func: Function to execute
            *args: Function arguments
            max_retries: Maximum retry attempts
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
        """
        max_retries = max_retries or self.config.max_retries
        delay = self.config.retry_delay
        
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
                
            except (OperationalError, psycopg2.OperationalError) as e:
                self.stats['retries'] += 1
                
                if attempt == max_retries - 1:
                    logger.error(f"Max retries ({max_retries}) reached: {str(e)}")
                    raise
                
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
                
            except Exception as e:
                logger.error(f"Non-retryable error: {str(e)}")
                raise
    
    def execute_query(
        self,
        query: str,
        params: Optional[Dict] = None,
        fetch: str = 'all'
    ) -> Any:
        """
        Execute a query with automatic connection management.
        
        Args:
            query: SQL query
            params: Query parameters
            fetch: 'all', 'one', or 'none'
            
        Returns:
            Query results
        """
        def _execute():
            with self.get_psycopg2_connection(cursor_factory=RealDictCursor) as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params)
                    self.stats['queries_executed'] += 1
                    
                    if fetch == 'all':
                        return cur.fetchall()
                    elif fetch == 'one':
                        return cur.fetchone()
                    else:
                        return None
        
        try:
            return self.execute_with_retry(_execute)
        except Exception as e:
            self.stats['queries_failed'] += 1
            raise
    
    def execute_many(
        self,
        query: str,
        data: List[tuple],
        batch_size: int = 1000
    ) -> int:
        """
        Execute a query for multiple rows with batching.
        
        Args:
            query: SQL query with placeholders
            data: List of parameter tuples
            batch_size: Batch size for execution
            
        Returns:
            Number of rows affected
        """
        total_affected = 0
        
        with self.get_psycopg2_connection() as conn:
            with conn.cursor() as cur:
                # Process in batches
                for i in range(0, len(data), batch_size):
                    batch = data[i:i + batch_size]
                    
                    try:
                        cur.executemany(query, batch)
                        total_affected += cur.rowcount
                        self.stats['queries_executed'] += len(batch)
                        
                        # Commit after each batch
                        conn.commit()
                        
                        if (i + batch_size) % (batch_size * 10) == 0:
                            logger.info(f"Processed {i + batch_size} rows")
                            
                    except Exception as e:
                        logger.error(f"Batch execution failed at row {i}: {str(e)}")
                        conn.rollback()
                        self.stats['queries_failed'] += len(batch)
                        raise
        
        return total_affected
    
    def bulk_insert(
        self,
        table: str,
        columns: List[str],
        data: List[tuple],
        on_conflict: Optional[str] = None
    ) -> int:
        """
        Perform bulk insert with COPY for maximum performance.
        
        Args:
            table: Table name
            columns: Column names
            data: Data rows
            on_conflict: Optional ON CONFLICT clause
            
        Returns:
            Number of rows inserted
        """
        with self.get_psycopg2_connection() as conn:
            with conn.cursor() as cur:
                # Create temporary table
                temp_table = f"temp_{table}_{int(time.time())}"
                
                try:
                    # Create temp table with same structure
                    cur.execute(f"""
                        CREATE TEMP TABLE {temp_table} 
                        (LIKE {table} INCLUDING ALL)
                    """)
                    
                    # Use COPY for bulk insert
                    from io import StringIO
                    import csv
                    
                    buffer = StringIO()
                    writer = csv.writer(buffer, delimiter='\t')
                    writer.writerows(data)
                    buffer.seek(0)
                    
                    cur.copy_from(
                        buffer,
                        temp_table,
                        columns=columns,
                        sep='\t',
                        null='\\N'
                    )
                    
                    # Insert from temp table with conflict handling
                    if on_conflict:
                        insert_query = f"""
                            INSERT INTO {table} ({', '.join(columns)})
                            SELECT {', '.join(columns)}
                            FROM {temp_table}
                            {on_conflict}
                        """
                    else:
                        insert_query = f"""
                            INSERT INTO {table} ({', '.join(columns)})
                            SELECT {', '.join(columns)}
                            FROM {temp_table}
                        """
                    
                    cur.execute(insert_query)
                    rows_inserted = cur.rowcount
                    
                    # Clean up temp table
                    cur.execute(f"DROP TABLE IF EXISTS {temp_table}")
                    
                    self.stats['queries_executed'] += 1
                    logger.info(f"Bulk inserted {rows_inserted} rows into {table}")
                    
                    return rows_inserted
                    
                except Exception as e:
                    logger.error(f"Bulk insert failed: {str(e)}")
                    self.stats['queries_failed'] += 1
                    raise
    
    def get_pool_stats(self) -> Dict[str, Any]:
        """Get connection pool statistics."""
        stats = self.stats.copy()
        
        # Add pool-specific stats
        if self.engine:
            pool_impl = self.engine.pool
            stats['sqlalchemy_pool'] = {
                'size': pool_impl.size(),
                'overflow': pool_impl.overflow(),
                'total': pool_impl.size() + pool_impl.overflow(),
                'checked_in': pool_impl.checkedin(),
                'checked_out': pool_impl.checkedout()
            }
        
        return stats
    
    def close(self):
        """Close all connections and clean up."""
        if self.psycopg2_pool:
            self.psycopg2_pool.closeall()
            logger.info("psycopg2 pool closed")
        
        if self.engine:
            self.engine.dispose()
            logger.info("SQLAlchemy engine disposed")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# Singleton instance
_connection_manager: Optional[ConnectionManager] = None


def get_connection_manager() -> ConnectionManager:
    """Get or create the singleton connection manager."""
    global _connection_manager
    if _connection_manager is None:
        _connection_manager = ConnectionManager()
    return _connection_manager


def with_connection(cursor_factory=None):
    """
    Decorator to provide database connection to function.
    
    Args:
        cursor_factory: Optional cursor factory
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            manager = get_connection_manager()
            with manager.get_psycopg2_connection(cursor_factory=cursor_factory) as conn:
                return func(conn, *args, **kwargs)
        return wrapper
    return decorator


def with_session(func):
    """Decorator to provide SQLAlchemy session to function."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        manager = get_connection_manager()
        with manager.get_session() as session:
            return func(session, *args, **kwargs)
    return wrapper


def test_connection():
    """Test database connection."""
    try:
        manager = get_connection_manager()
        result = manager.execute_query("SELECT version()", fetch='one')
        print(f"Connected to: {result['version']}")
        
        stats = manager.get_pool_stats()
        print(f"Pool stats: {stats}")
        
        return True
    except Exception as e:
        print(f"Connection test failed: {str(e)}")
        return False


if __name__ == '__main__':
    # Test the connection manager
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Connection Manager')
    parser.add_argument('--test', action='store_true', help='Test connection')
    parser.add_argument('--stats', action='store_true', help='Show pool statistics')
    
    args = parser.parse_args()
    
    if args.test:
        success = test_connection()
        sys.exit(0 if success else 1)
    
    if args.stats:
        manager = get_connection_manager()
        stats = manager.get_pool_stats()
        print(json.dumps(stats, indent=2))