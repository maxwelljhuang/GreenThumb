"""
Database Session
Provides database session factory for use in Celery tasks and other contexts.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://greenthumb:greenthumb_pass@localhost:5432/greenthumb'
)

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before using
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
