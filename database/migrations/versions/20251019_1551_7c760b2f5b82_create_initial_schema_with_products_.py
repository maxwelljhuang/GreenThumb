"""create initial schema with products users and tracking tables

Revision ID: 7c760b2f5b82
Revises:
Create Date: 2025-10-19 15:51:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic
revision = '7c760b2f5b82'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    # pgvector is optional and may not be available in all PostgreSQL images
    # op.execute('CREATE EXTENSION IF NOT EXISTS "pgvector"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    
    # Create products table
    op.create_table('products',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        
        # Merchant identifiers
        sa.Column('merchant_product_id', sa.String(255), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('merchant_name', sa.String(255)),
        sa.Column('aw_product_id', sa.String(255)),
        
        # Core product info
        sa.Column('product_name', sa.Text(), nullable=False),
        sa.Column('brand_name', sa.String(255)),
        sa.Column('brand_id', sa.Integer()),
        sa.Column('description', sa.Text()),
        sa.Column('product_short_description', sa.Text()),
        
        # Categories
        sa.Column('category_name', sa.String(255)),
        sa.Column('category_id', sa.Integer()),
        sa.Column('merchant_category', sa.String(255)),
        
        # Pricing
        sa.Column('search_price', sa.Numeric(10, 2)),
        sa.Column('store_price', sa.Numeric(10, 2)),
        sa.Column('rrp_price', sa.Numeric(10, 2)),
        sa.Column('currency', sa.String(10), server_default='GBP'),
        sa.Column('delivery_cost', sa.Numeric(10, 2)),
        
        # Images
        sa.Column('merchant_image_url', sa.Text()),
        sa.Column('aw_image_url', sa.Text()),
        sa.Column('large_image', sa.Text()),
        sa.Column('alternate_images', postgresql.JSONB(), server_default='[]'),
        
        # Fashion attributes
        sa.Column('fashion_suitable_for', sa.String(100)),
        sa.Column('fashion_category', sa.String(100)),
        sa.Column('fashion_size', sa.Text()),
        sa.Column('fashion_material', sa.Text()),
        sa.Column('fashion_pattern', sa.String(100)),
        sa.Column('colour', sa.String(100)),
        
        # Stock
        sa.Column('in_stock', sa.Boolean(), server_default='true'),
        sa.Column('stock_quantity', sa.Integer()),
        sa.Column('stock_status', sa.String(50)),
        
        # Links
        sa.Column('aw_deep_link', sa.Text()),
        sa.Column('merchant_deep_link', sa.Text()),
        
        # Metadata
        sa.Column('last_updated', sa.TIMESTAMP()),
        sa.Column('ingested_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        
        # Quality
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('is_nsfw', sa.Boolean(), server_default='false'),
        sa.Column('quality_score', sa.Float(), server_default='0.0'),
        
        # Deduplication
        sa.Column('product_hash', sa.String(64)),
        sa.Column('canonical_product_id', postgresql.UUID(as_uuid=True)),
        sa.Column('is_duplicate', sa.Boolean(), server_default='false'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id', 'merchant_product_id'),
        sa.ForeignKeyConstraint(['canonical_product_id'], ['products.id'], ondelete='SET NULL')
    )
    
    # Create indexes for products
    op.create_index('idx_products_merchant', 'products', ['merchant_id', 'merchant_product_id'])
    op.create_index('idx_products_category', 'products', ['category_id'])
    op.create_index('idx_products_brand', 'products', ['brand_id', 'brand_name'])
    op.create_index('idx_products_price', 'products', ['search_price'])
    op.create_index('idx_products_active', 'products', ['is_active'])
    op.create_index('idx_products_hash', 'products', ['product_hash'])
    
    # Create trigram indexes for fuzzy search
    op.execute('CREATE INDEX idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops)')
    op.execute('CREATE INDEX idx_products_brand_trgm ON products USING gin(brand_name gin_trgm_ops)')
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('external_id', sa.String(255)),
        sa.Column('email', sa.String(255)),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        
        # Preferences
        sa.Column('brand_affinities', postgresql.JSONB(), server_default='{}'),
        sa.Column('price_band_min', sa.Numeric(10, 2)),
        sa.Column('price_band_max', sa.Numeric(10, 2)),
        sa.Column('preferred_categories', postgresql.JSONB(), server_default='[]'),
        sa.Column('style_preferences', postgresql.JSONB(), server_default='{}'),
        
        # Stats
        sa.Column('total_interactions', sa.Integer(), server_default='0'),
        sa.Column('last_active', sa.TIMESTAMP(), server_default=sa.func.now()),
        
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id')
    )
    
    op.create_index('idx_users_email', 'users', ['email'])
    
    # Create user_embeddings table
    op.create_table('user_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding_type', sa.String(50), nullable=False),
        # Using ARRAY for now - can be migrated to pgvector later
        sa.Column('embedding', postgresql.ARRAY(sa.Float(), dimensions=1)),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('interaction_count', sa.Integer(), server_default='0'),
        sa.Column('confidence_score', sa.Float(), server_default='0.5'),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'embedding_type')
    )

    # Create product_embeddings table
    op.create_table('product_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding_type', sa.String(50), nullable=False),
        # Using ARRAY for now - can be migrated to pgvector later
        sa.Column('embedding', postgresql.ARRAY(sa.Float(), dimensions=1)),
        sa.Column('model_version', sa.String(50), server_default='ViT-B/32'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('product_id', 'embedding_type')
    )
    
    # Create ingestion_logs table
    op.create_table('ingestion_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('feed_name', sa.String(255)),
        sa.Column('merchant_id', sa.Integer()),
        sa.Column('merchant_name', sa.String(255)),
        sa.Column('started_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('completed_at', sa.TIMESTAMP()),
        
        # Stats
        sa.Column('total_rows', sa.Integer(), server_default='0'),
        sa.Column('processed_rows', sa.Integer(), server_default='0'),
        sa.Column('new_products', sa.Integer(), server_default='0'),
        sa.Column('updated_products', sa.Integer(), server_default='0'),
        sa.Column('failed_rows', sa.Integer(), server_default='0'),
        sa.Column('duplicates_found', sa.Integer(), server_default='0'),
        
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('error_message', sa.Text()),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index('idx_ingestion_logs_status', 'ingestion_logs', ['status'])
    op.create_index('idx_ingestion_logs_merchant', 'ingestion_logs', ['merchant_id'])
    
    # Create data_quality_issues table
    op.create_table('data_quality_issues',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True)),
        sa.Column('ingestion_log_id', postgresql.UUID(as_uuid=True)),
        sa.Column('issue_type', sa.String(100)),
        sa.Column('severity', sa.String(20)),
        sa.Column('field_name', sa.String(100)),
        sa.Column('details', postgresql.JSONB()),
        sa.Column('detected_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.Column('resolved_at', sa.TIMESTAMP()),
        sa.Column('is_resolved', sa.Boolean(), server_default='false'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ingestion_log_id'], ['ingestion_logs.id'], ondelete='CASCADE')
    )
    
    # Create update trigger
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """)
    
    op.execute("""
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)
    
    op.execute("""
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)


def downgrade() -> None:
    op.drop_table('data_quality_issues')
    op.drop_table('ingestion_logs')
    op.drop_table('product_embeddings')
    op.drop_table('user_embeddings')
    op.drop_table('users')
    op.drop_table('products')
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE')