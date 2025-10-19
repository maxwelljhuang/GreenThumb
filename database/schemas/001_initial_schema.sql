-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text matching

-- Products table (canonical, one record per unique product)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Merchant identifiers
    merchant_product_id VARCHAR(255) NOT NULL,
    merchant_id INTEGER NOT NULL,
    merchant_name VARCHAR(255),
    aw_product_id VARCHAR(255),
    
    -- Core product info
    product_name TEXT NOT NULL,
    brand_name VARCHAR(255),
    brand_id INTEGER,
    description TEXT,
    product_short_description TEXT,
    specifications TEXT,
    
    -- Categorization
    category_name VARCHAR(255),
    category_id INTEGER,
    merchant_category VARCHAR(255),
    merchant_product_category_path TEXT,
    merchant_product_second_category VARCHAR(255),
    merchant_product_third_category VARCHAR(255),
    
    -- Pricing (all prices in decimal for accuracy)
    search_price DECIMAL(10,2),
    store_price DECIMAL(10,2),
    rrp_price DECIMAL(10,2),
    base_price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'GBP',
    delivery_cost DECIMAL(10,2),
    saving DECIMAL(10,2),
    savings_percent DECIMAL(5,2),
    
    -- Images
    merchant_image_url TEXT,
    aw_image_url TEXT,
    large_image TEXT,
    merchant_thumb_url TEXT,
    aw_thumb_url TEXT,
    alternate_images JSONB DEFAULT '[]'::jsonb,  -- Array of alternate image URLs
    
    -- Fashion-specific attributes
    fashion_suitable_for VARCHAR(100),
    fashion_category VARCHAR(100),
    fashion_size TEXT,
    fashion_material TEXT,
    fashion_pattern VARCHAR(100),
    fashion_swatch TEXT,
    colour VARCHAR(100),
    
    -- Product details
    dimensions TEXT,
    keywords TEXT,
    promotional_text TEXT,
    product_type VARCHAR(255),
    condition VARCHAR(50),
    product_model VARCHAR(255),
    model_number VARCHAR(255),
    
    -- Stock & availability
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    stock_status VARCHAR(50),
    size_stock_status TEXT,
    size_stock_amount TEXT,
    
    -- Links
    aw_deep_link TEXT,
    merchant_deep_link TEXT,
    basket_link TEXT,
    
    -- Additional identifiers
    ean VARCHAR(50),
    isbn VARCHAR(50),
    upc VARCHAR(50),
    mpn VARCHAR(100),
    parent_product_id VARCHAR(255),
    product_gtin VARCHAR(50),
    
    -- Custom fields (merchant-specific data)
    custom_1 TEXT,
    custom_2 TEXT,
    custom_3 TEXT,
    custom_4 TEXT,
    custom_5 TEXT,
    custom_6 TEXT,
    custom_7 TEXT,
    custom_8 TEXT,
    custom_9 TEXT,
    
    -- Reviews
    reviews INTEGER,
    average_rating DECIMAL(3,2),
    rating DECIMAL(3,2),
    number_available INTEGER,
    
    -- Metadata & tracking
    last_updated TIMESTAMP,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    ingested_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Data quality
    is_active BOOLEAN DEFAULT true,
    is_nsfw BOOLEAN DEFAULT false,
    quality_score FLOAT DEFAULT 0.0,  -- 0-1 score for data completeness
    
    -- Deduplication
    product_hash VARCHAR(64),  -- SHA-256 hash for duplicate detection
    canonical_product_id UUID,  -- Points to canonical if this is duplicate
    is_duplicate BOOLEAN DEFAULT false,
    
    -- Constraints
    UNIQUE(merchant_id, merchant_product_id),
    CONSTRAINT fk_canonical_product 
        FOREIGN KEY (canonical_product_id) 
        REFERENCES products(id) 
        ON DELETE SET NULL
);

-- Indexes for products table
CREATE INDEX idx_products_merchant ON products(merchant_id, merchant_product_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id, brand_name);
CREATE INDEX idx_products_price ON products(search_price);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_hash ON products(product_hash);
CREATE INDEX idx_products_ingested ON products(ingested_at DESC);
CREATE INDEX idx_products_quality ON products(quality_score DESC);

-- Trigram indexes for fuzzy text search (using pg_trgm)
CREATE INDEX idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING gin(brand_name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Preferences (stored as JSON for flexibility)
    brand_affinities JSONB DEFAULT '{}',
    price_band_min DECIMAL(10,2),
    price_band_max DECIMAL(10,2),
    preferred_categories JSONB DEFAULT '[]',
    style_preferences JSONB DEFAULT '{}',
    size_preferences JSONB DEFAULT '{}',
    
    -- Stats
    total_interactions INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT NOW(),
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_active ON users(last_active DESC);

-- User embeddings table (for future personalization)
CREATE TABLE IF NOT EXISTS user_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    embedding_type VARCHAR(50) NOT NULL, -- 'long_term', 'session', 'cold_start'
    embedding vector(512),  -- 512-dimensional vector (will use in Task 3)
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,
    confidence_score FLOAT DEFAULT 0.5,
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(user_id, embedding_type)
);

CREATE INDEX idx_user_embeddings_user ON user_embeddings(user_id);
CREATE INDEX idx_user_embeddings_type ON user_embeddings(embedding_type);

-- Product embeddings table (for future search)
CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    embedding_type VARCHAR(50) NOT NULL, -- 'clip_image', 'clip_text', 'combined'
    embedding vector(512),  -- 512-dimensional vector
    model_version VARCHAR(50) DEFAULT 'ViT-B/32',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, embedding_type)
);

CREATE INDEX idx_product_embeddings_product ON product_embeddings(product_id);
CREATE INDEX idx_product_embeddings_type ON product_embeddings(embedding_type);

-- Ingestion logs for tracking
CREATE TABLE IF NOT EXISTS ingestion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_name VARCHAR(255),
    feed_url TEXT,
    merchant_id INTEGER,
    merchant_name VARCHAR(255),
    
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Stats
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    new_products INTEGER DEFAULT 0,
    updated_products INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    
    -- Performance metrics
    processing_time_seconds INTEGER,
    rows_per_second FLOAT,
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_ingestion_logs_status ON ingestion_logs(status);
CREATE INDEX idx_ingestion_logs_merchant ON ingestion_logs(merchant_id);
CREATE INDEX idx_ingestion_logs_started ON ingestion_logs(started_at DESC);

-- Data quality issues tracking
CREATE TABLE IF NOT EXISTS data_quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingestion_log_id UUID REFERENCES ingestion_logs(id) ON DELETE CASCADE,
    
    issue_type VARCHAR(100), -- 'missing_image', 'invalid_price', 'nsfw_content', etc.
    severity VARCHAR(20), -- 'critical', 'warning', 'info'
    field_name VARCHAR(100),
    field_value TEXT,
    details JSONB,
    
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,
    
    is_resolved BOOLEAN DEFAULT false
);

CREATE INDEX idx_quality_issues_product ON data_quality_issues(product_id);
CREATE INDEX idx_quality_issues_type ON data_quality_issues(issue_type);
CREATE INDEX idx_quality_issues_severity ON data_quality_issues(severity);
CREATE INDEX idx_quality_issues_resolved ON data_quality_issues(is_resolved);

-- Deduplication tracking table
CREATE TABLE IF NOT EXISTS deduplication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_product_id UUID REFERENCES products(id),
    duplicate_product_id UUID REFERENCES products(id),
    
    similarity_score FLOAT,
    dedup_method VARCHAR(50), -- 'exact_hash', 'fuzzy_match', 'hdbscan_cluster'
    
    created_at TIMESTAMP DEFAULT NOW(),
    ingestion_log_id UUID REFERENCES ingestion_logs(id)
);

CREATE INDEX idx_dedup_log_original ON deduplication_log(original_product_id);
CREATE INDEX idx_dedup_log_duplicate ON deduplication_log(duplicate_product_id);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();