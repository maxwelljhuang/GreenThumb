{{
  config(
    materialized='view'
  )
}}

-- Staging layer: Basic cleaning and type casting of raw products data
WITH source AS (
    SELECT * FROM {{ ref('products') }}
),

cleaned AS (
    SELECT
        -- IDs
        id AS product_id,
        merchant_product_id,
        merchant_id,
        merchant_name,
        aw_product_id,
        
        -- Product info
        TRIM(product_name) AS product_name,
        TRIM(brand_name) AS brand_name,
        brand_id,
        TRIM(description) AS description,
        TRIM(product_short_description) AS product_short_description,
        
        -- Categories
        TRIM(category_name) AS category_name,
        category_id,
        TRIM(merchant_category) AS merchant_category,
        
        -- Pricing (ensure numeric types)
        COALESCE(search_price, 0) AS search_price,
        COALESCE(store_price, 0) AS store_price,
        COALESCE(rrp_price, 0) AS rrp_price,
        COALESCE(delivery_cost, 0) AS delivery_cost,
        UPPER(COALESCE(currency, 'GBP')) AS currency,
        
        -- Images
        merchant_image_url,
        aw_image_url,
        large_image,
        alternate_images,
        
        -- Fashion attributes
        TRIM(fashion_category) AS fashion_category,
        TRIM(fashion_size) AS fashion_size,
        TRIM(fashion_material) AS fashion_material,
        TRIM(colour) AS colour,
        
        -- Stock
        in_stock,
        COALESCE(stock_quantity, 0) AS stock_quantity,
        stock_status,
        
        -- Quality and flags
        COALESCE(quality_score, 0) AS quality_score,
        COALESCE(is_active, true) AS is_active,
        COALESCE(is_duplicate, false) AS is_duplicate,
        COALESCE(is_nsfw, false) AS is_nsfw,
        product_hash,
        canonical_product_id,
        
        -- Timestamps
        ingested_at,
        updated_at,
        last_updated,
        
        -- Calculate derived fields
        EXTRACT(DAY FROM CURRENT_DATE - DATE(COALESCE(last_updated, ingested_at))) AS days_since_update,
        
        -- Data quality flags
        CASE 
            WHEN product_name IS NULL OR LENGTH(product_name) < 3 THEN true
            ELSE false
        END AS has_invalid_name,
        
        CASE 
            WHEN search_price IS NULL OR search_price <= 0 THEN true
            ELSE false
        END AS has_invalid_price,
        
        CASE 
            WHEN merchant_image_url IS NULL AND aw_image_url IS NULL THEN true
            ELSE false
        END AS missing_image
        
    FROM source
)

SELECT * FROM cleaned