{{
  config(
    materialized='table',
    indexes=[
      {'columns': ['product_id'], 'unique': True},
      {'columns': ['merchant_id', 'merchant_product_id']},
      {'columns': ['brand_name']},
      {'columns': ['category_name']},
      {'columns': ['price_band']},
      {'columns': ['quality_tier']},
      {'columns': ['is_active', 'quality_score']}
    ]
  )
}}

-- Product catalog: Clean, deduplicated products ready for serving
WITH enriched_products AS (
    SELECT * FROM {{ ref('int_products_enriched') }}
),

-- Filter to canonical products only (not duplicates)
canonical_products AS (
    SELECT *
    FROM enriched_products
    WHERE 
        -- Keep only non-duplicates or canonical versions
        (NOT is_duplicate OR canonical_product_id IS NULL)
        -- Apply quality threshold
        AND quality_score >= {{ var('min_quality_score') }}
        -- Remove NSFW content
        AND NOT is_nsfw
        -- Must have valid price
        AND search_price > 0
        -- Must have product name
        AND product_name IS NOT NULL
        AND LENGTH(product_name) >= 3
        -- Keep only active products
        AND is_active = true
),

-- Add ranking within brand/category combinations
ranked_products AS (
    SELECT 
        *,
        -- Rank products within same brand
        ROW_NUMBER() OVER (
            PARTITION BY brand_name 
            ORDER BY quality_score DESC, search_price ASC
        ) AS brand_rank,
        
        -- Rank products within same category
        ROW_NUMBER() OVER (
            PARTITION BY category_name 
            ORDER BY quality_score DESC, search_price ASC
        ) AS category_rank,
        
        -- Rank products within same price band
        ROW_NUMBER() OVER (
            PARTITION BY price_band 
            ORDER BY quality_score DESC, discount_percentage DESC
        ) AS price_band_rank,
        
        -- Overall quality rank
        DENSE_RANK() OVER (
            ORDER BY quality_score DESC
        ) AS quality_rank,
        
        -- Count of products per merchant
        COUNT(*) OVER (PARTITION BY merchant_id) AS merchant_product_count
        
    FROM canonical_products
)

SELECT 
    -- Core identifiers
    product_id,
    merchant_product_id,
    merchant_id,
    merchant_name,
    aw_product_id,
    
    -- Product information
    product_name,
    brand_name,
    brand_tier,
    description,
    
    -- Categories
    category_name,
    category_id,
    merchant_category,
    category_depth,
    
    -- Pricing
    search_price,
    rrp_price,
    store_price,
    discount_percentage,
    discount_amount,
    price_band,
    currency,
    delivery_cost,
    
    -- Images
    COALESCE(merchant_image_url, aw_image_url) AS primary_image_url,
    merchant_image_url,
    aw_image_url,
    large_image,
    alternate_images,
    total_image_count,
    
    -- Fashion attributes
    is_fashion_product,
    fashion_category,
    fashion_size,
    fashion_material,
    colour,
    
    -- Stock
    in_stock,
    stock_quantity,
    stock_level,
    stock_status,
    
    -- Quality metrics
    quality_score,
    quality_tier,
    completeness_score,
    quality_rank,
    
    -- Freshness
    days_since_update,
    freshness_status,
    
    -- Rankings
    brand_rank,
    category_rank,
    price_band_rank,
    merchant_product_count,
    
    -- Metadata
    product_hash,
    ingested_at,
    updated_at,
    last_updated,
    
    -- Current timestamp for tracking
    CURRENT_TIMESTAMP AS catalog_updated_at
    
FROM ranked_products
-- Only keep top products per category to avoid explosion
WHERE category_rank <= 10000