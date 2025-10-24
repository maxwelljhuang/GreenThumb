"""add pgvector embedding columns to products and users

Revision ID: a1b2c3d4e5f6
Revises: 7c760b2f5b82
Create Date: 2025-10-24 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic
revision = 'a1b2c3d4e5f6'
down_revision = '7c760b2f5b82'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Migrate from ARRAY embeddings to pgvector Vector type.

    Strategy:
    1. Enable pgvector extension
    2. Add new pgvector columns to products table
    3. Update product_embeddings table to use Vector type
    4. Update user_embeddings table to use Vector type
    5. Create pgvector indexes for fast similarity search
    """

    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # === PRODUCTS TABLE ===
    # Add embedding columns directly to products table (denormalized for performance)

    op.add_column('products',
        sa.Column('image_embedding', Vector(512), nullable=True,
                 comment='CLIP/SigLIP image embedding (512-dim)')
    )

    op.add_column('products',
        sa.Column('text_embedding', Vector(512), nullable=True,
                 comment='CLIP/SigLIP text embedding from title+description (512-dim)')
    )

    op.add_column('products',
        sa.Column('embedding', Vector(512), nullable=True,
                 comment='Fused multimodal embedding for search (512-dim)')
    )

    # Add metadata for tracking embedding generation
    op.add_column('products',
        sa.Column('embedding_model_version', sa.String(50), nullable=True,
                 comment='Model version used for embeddings (e.g., v1.0-clip-vit-b32)')
    )

    op.add_column('products',
        sa.Column('embedding_generated_at', sa.TIMESTAMP, nullable=True,
                 comment='When embeddings were last generated')
    )

    # Create pgvector indexes for similarity search
    # Using IVFFlat for MVP (good balance of speed/accuracy for <1M products)
    # Note: Need at least 100 rows before creating IVFFlat index

    # We'll create indexes conditionally after data is loaded
    # For now, create basic indexes
    op.create_index(
        'idx_products_embedding_generated',
        'products',
        ['embedding_generated_at'],
        postgresql_where=sa.text('embedding IS NOT NULL')
    )

    op.create_index(
        'idx_products_embedding_model',
        'products',
        ['embedding_model_version']
    )

    # === PRODUCT_EMBEDDINGS TABLE ===
    # Migrate existing ARRAY column to pgvector Vector type

    # Add new Vector column
    op.add_column('product_embeddings',
        sa.Column('embedding_vector', Vector(512), nullable=True,
                 comment='pgvector embedding (migrated from array)')
    )

    # Migrate data from ARRAY to Vector
    # pgvector can cast from array directly
    op.execute("""
        UPDATE product_embeddings
        SET embedding_vector = embedding::vector(512)
        WHERE embedding IS NOT NULL
          AND array_length(embedding, 1) = 512
    """)

    # Drop old array column (optional, keep for safety during migration)
    # op.drop_column('product_embeddings', 'embedding')

    # Rename new column to 'embedding'
    # op.alter_column('product_embeddings', 'embedding_vector', new_column_name='embedding')

    # === USER_EMBEDDINGS TABLE ===
    # Add dedicated columns for long-term and session embeddings

    op.add_column('user_embeddings',
        sa.Column('long_term_embedding', Vector(512), nullable=True,
                 comment='Long-term user taste profile (EWMA of interactions)')
    )

    op.add_column('user_embeddings',
        sa.Column('session_embedding', Vector(512), nullable=True,
                 comment='Current session intent (rolling average of last N interactions)')
    )

    # Add metadata
    op.add_column('user_embeddings',
        sa.Column('last_interaction_at', sa.TIMESTAMP, nullable=True,
                 comment='Timestamp of last user interaction')
    )

    # Migrate existing data if embeddings exist
    op.execute("""
        UPDATE user_embeddings
        SET long_term_embedding = embedding::vector(512)
        WHERE embedding IS NOT NULL
          AND array_length(embedding, 1) = 512
          AND embedding_type = 'long_term'
    """)

    op.execute("""
        UPDATE user_embeddings
        SET session_embedding = embedding::vector(512)
        WHERE embedding IS NOT NULL
          AND array_length(embedding, 1) = 512
          AND embedding_type = 'session'
    """)

    # === CREATE PGVECTOR INDEXES ===
    # These will be created via separate script after data loading
    # Included here as SQL comments for reference

    op.execute("""
        -- Create IVFFlat index for fast similarity search (run after 100+ products loaded)
        -- CREATE INDEX idx_products_embedding_ivfflat
        -- ON products USING ivfflat (embedding vector_cosine_ops)
        -- WITH (lists = 100);

        -- For smaller datasets or exact search, use this instead:
        -- CREATE INDEX idx_products_embedding_hnsw
        -- ON products USING hnsw (embedding vector_cosine_ops);

        -- User embeddings index (smaller dataset, HNSW is fine)
        -- CREATE INDEX idx_user_embeddings_long_term_hnsw
        -- ON user_embeddings USING hnsw (long_term_embedding vector_cosine_ops);
    """)


def downgrade() -> None:
    """Remove pgvector columns and revert to ARRAY."""

    # Drop products embedding columns
    op.drop_index('idx_products_embedding_generated', table_name='products')
    op.drop_index('idx_products_embedding_model', table_name='products')

    op.drop_column('products', 'image_embedding')
    op.drop_column('products', 'text_embedding')
    op.drop_column('products', 'embedding')
    op.drop_column('products', 'embedding_model_version')
    op.drop_column('products', 'embedding_generated_at')

    # Drop product_embeddings vector column
    op.drop_column('product_embeddings', 'embedding_vector')

    # Drop user_embeddings columns
    op.drop_column('user_embeddings', 'long_term_embedding')
    op.drop_column('user_embeddings', 'session_embedding')
    op.drop_column('user_embeddings', 'last_interaction_at')

    # Note: pgvector extension is left installed (safe to keep)
