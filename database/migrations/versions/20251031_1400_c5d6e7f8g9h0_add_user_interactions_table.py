"""add user interactions table

Revision ID: c5d6e7f8g9h0
Revises: a1b2c3d4e5f6
Create Date: 2025-10-31 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = 'c5d6e7f8g9h0'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add user_interactions table for tracking user-product interactions.

    This table is critical for:
    - Building personalized user embeddings
    - Analytics and CTR tracking
    - Feedback loop for recommendations
    """

    # Create user_interactions table
    op.create_table('user_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=True),
                 server_default=sa.text('uuid_generate_v4()'), nullable=False),

        # User and product references
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),

        # Interaction details
        sa.Column('interaction_type', sa.String(50), nullable=False,
                 comment='Type: view, click, add_to_cart, purchase, like, share, rating'),
        sa.Column('rating', sa.Float(), nullable=True,
                 comment='Rating value (0-5) for rating interactions'),

        # Session and context
        sa.Column('session_id', sa.String(128), nullable=True,
                 comment='Session ID for grouping interactions'),
        sa.Column('context', sa.String(64), nullable=True,
                 comment='Context: search, feed, similar, recommendation, etc.'),
        sa.Column('query', sa.String(500), nullable=True,
                 comment='Search query that led to this interaction'),
        sa.Column('position', sa.Integer(), nullable=True,
                 comment='Position of product in results (for CTR analysis)'),

        # Additional metadata (JSONB for flexibility)
        sa.Column('metadata', postgresql.JSONB(), nullable=True, server_default='{}',
                 comment='Additional metadata: page, referrer, device, etc.'),

        # Timestamps
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.func.now()),

        # Processing flags for async embedding updates
        sa.Column('processed_for_embedding', sa.Boolean(), nullable=False, server_default='false',
                 comment='Whether this interaction was used to update embeddings'),
        sa.Column('processed_at', sa.TIMESTAMP(), nullable=True,
                 comment='When this interaction was processed for embeddings'),

        # Primary key
        sa.PrimaryKeyConstraint('id'),

        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE')
    )

    # Create indexes for common query patterns

    # User-based queries (get all interactions for a user, sorted by time)
    op.create_index(
        'idx_user_interactions_user_created',
        'user_interactions',
        ['user_id', 'created_at']
    )

    # Session-based queries (get all interactions in a session)
    op.create_index(
        'idx_user_interactions_session',
        'user_interactions',
        ['session_id', 'created_at']
    )

    # Product-based queries (analytics on product engagement)
    op.create_index(
        'idx_user_interactions_product',
        'user_interactions',
        ['product_id']
    )

    # Interaction type filtering (e.g., get all purchases)
    op.create_index(
        'idx_user_interactions_type_created',
        'user_interactions',
        ['interaction_type', 'created_at']
    )

    # Find unprocessed interactions for batch embedding updates
    op.create_index(
        'idx_user_interactions_unprocessed',
        'user_interactions',
        ['processed_for_embedding'],
        postgresql_where=sa.text('processed_for_embedding = false')
    )

    # User ID index for fast lookups
    op.create_index(
        'idx_user_interactions_user_id',
        'user_interactions',
        ['user_id']
    )

    # Created timestamp index for time-based queries
    op.create_index(
        'idx_user_interactions_created_at',
        'user_interactions',
        ['created_at']
    )


def downgrade() -> None:
    """Remove user_interactions table and indexes."""

    # Drop indexes first
    op.drop_index('idx_user_interactions_created_at', table_name='user_interactions')
    op.drop_index('idx_user_interactions_user_id', table_name='user_interactions')
    op.drop_index('idx_user_interactions_unprocessed', table_name='user_interactions')
    op.drop_index('idx_user_interactions_type_created', table_name='user_interactions')
    op.drop_index('idx_user_interactions_product', table_name='user_interactions')
    op.drop_index('idx_user_interactions_session', table_name='user_interactions')
    op.drop_index('idx_user_interactions_user_created', table_name='user_interactions')

    # Drop table
    op.drop_table('user_interactions')
