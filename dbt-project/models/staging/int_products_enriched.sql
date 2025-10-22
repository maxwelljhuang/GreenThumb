{{
  config(
    materialized='view'
  )
}}

-- Intermediate layer: Enrich products with calculated fields
WITH products AS (
    SELECT * FROM {{ ref('stg_products') }}
),

enriched AS (
    SELECT
        *,
        
        -- Price calculations
        CASE 
            WHEN rrp_price > 0 AND search_price > 0 THEN
                ROUND(((rrp_price - search_price) / rrp_price) * 100, 2)
            ELSE 0
        END AS discount_percentage,
        
        CASE 
            WHEN rrp_price > 0 THEN
                rrp_price - search_price
            ELSE 0
        END AS discount_amount,
        
        -- Price bands
        CASE 
            WHEN search_price <= {{ var('price_band_budget_max') }} THEN 'budget'
            WHEN search_price <= {{ var('price_band_mid_max') }} THEN 'mid-range'
            WHEN search_price <= {{ var('price_band_premium_max') }} THEN 'premium'
            ELSE 'luxury'
        END AS price_band,
        
        -- Quality tiers
        CASE 
            WHEN quality_score >= {{ var('high_quality_threshold') }} THEN 'high'
            WHEN quality_score >= {{ var('min_quality_score') }} THEN 'medium'
            ELSE 'low'
        END AS quality_tier,
        
        -- Freshness status
        CASE 
            WHEN days_since_update <= 7 THEN 'fresh'
            WHEN days_since_update <= 30 THEN 'recent'
            WHEN days_since_update <= {{ var('stale_threshold_days') }} THEN 'aging'
            WHEN days_since_update <= {{ var('very_stale_threshold_days') }} THEN 'stale'
            ELSE 'very_stale'
        END AS freshness_status,
        
        -- Stock status enrichment
        CASE 
            WHEN NOT in_stock THEN 'out_of_stock'
            WHEN stock_quantity = 0 THEN 'out_of_stock'
            WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 'low_stock'
            WHEN stock_quantity > 5 THEN 'in_stock'
            ELSE 'unknown'
        END AS stock_level,
        
        -- Image availability
        CASE 
            WHEN merchant_image_url IS NOT NULL THEN 1 ELSE 0
        END +
        CASE 
            WHEN aw_image_url IS NOT NULL THEN 1 ELSE 0
        END +
        CASE 
            WHEN large_image IS NOT NULL THEN 1 ELSE 0
        END +
        CASE 
            WHEN alternate_images IS NOT NULL AND 
                 JSONB_ARRAY_LENGTH(alternate_images) > 0 THEN 
                 JSONB_ARRAY_LENGTH(alternate_images)
            ELSE 0
        END AS total_image_count,
        
        -- Category depth
        CASE 
            WHEN merchant_category IS NOT NULL THEN
                ARRAY_LENGTH(STRING_TO_ARRAY(merchant_category, '/'), 1)
            ELSE 0
        END AS category_depth,
        
        -- Brand categorization
        CASE 
            WHEN LOWER(brand_name) IN ('nike', 'adidas', 'puma', 'reebok', 'under armour') THEN 'major_brand'
            WHEN brand_name IS NOT NULL AND brand_name != '' THEN 'other_brand'
            ELSE 'no_brand'
        END AS brand_tier,
        
        -- Fashion specific flags
        CASE 
            WHEN fashion_category IS NOT NULL OR 
                 fashion_size IS NOT NULL OR 
                 fashion_material IS NOT NULL THEN true
            ELSE false
        END AS is_fashion_product,
        
        -- Completeness score (0-100)
        ROUND((
            (CASE WHEN product_name IS NOT NULL THEN 15 ELSE 0 END) +
            (CASE WHEN description IS NOT NULL THEN 10 ELSE 0 END) +
            (CASE WHEN search_price > 0 THEN 15 ELSE 0 END) +
            (CASE WHEN merchant_image_url IS NOT NULL OR aw_image_url IS NOT NULL THEN 15 ELSE 0 END) +
            (CASE WHEN brand_name IS NOT NULL THEN 10 ELSE 0 END) +
            (CASE WHEN category_name IS NOT NULL THEN 5 ELSE 0 END) +
            (CASE WHEN in_stock IS NOT NULL THEN 5 ELSE 0 END) +
            (CASE WHEN merchant_name IS NOT NULL THEN 5 ELSE 0 END) +
            (CASE WHEN colour IS NOT NULL THEN 5 ELSE 0 END) +
            (CASE WHEN rrp_price > search_price THEN 5 ELSE 0 END) +
            (CASE WHEN alternate_images IS NOT NULL AND JSONB_ARRAY_LENGTH(alternate_images) > 0 THEN 5 ELSE 0 END) +
            (CASE WHEN stock_quantity > 0 THEN 5 ELSE 0 END)
        ), 2) AS completeness_score
        
    FROM products
)

SELECT * FROM enriched