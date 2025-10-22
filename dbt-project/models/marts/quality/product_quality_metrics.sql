{{
  config(
    materialized='view'
  )
}}

-- Product quality metrics for monitoring and analysis
WITH products AS (
    SELECT * FROM {{ ref('int_products_enriched') }}
),

merchant_quality AS (
    SELECT 
        merchant_id,
        merchant_name,
        COUNT(*) AS total_products,
        
        -- Quality metrics
        AVG(quality_score) AS avg_quality_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score) AS median_quality_score,
        MIN(quality_score) AS min_quality_score,
        MAX(quality_score) AS max_quality_score,
        
        -- Quality distribution
        SUM(CASE WHEN quality_tier = 'high' THEN 1 ELSE 0 END) AS high_quality_count,
        SUM(CASE WHEN quality_tier = 'medium' THEN 1 ELSE 0 END) AS medium_quality_count,
        SUM(CASE WHEN quality_tier = 'low' THEN 1 ELSE 0 END) AS low_quality_count,
        
        -- Data issues
        SUM(CASE WHEN has_invalid_name THEN 1 ELSE 0 END) AS invalid_name_count,
        SUM(CASE WHEN has_invalid_price THEN 1 ELSE 0 END) AS invalid_price_count,
        SUM(CASE WHEN missing_image THEN 1 ELSE 0 END) AS missing_image_count,
        SUM(CASE WHEN is_duplicate THEN 1 ELSE 0 END) AS duplicate_count,
        SUM(CASE WHEN is_nsfw THEN 1 ELSE 0 END) AS nsfw_count,
        
        -- Completeness
        AVG(completeness_score) AS avg_completeness,
        
        -- Freshness
        AVG(days_since_update) AS avg_days_since_update,
        SUM(CASE WHEN freshness_status IN ('stale', 'very_stale') THEN 1 ELSE 0 END) AS stale_product_count,
        
        -- Stock
        SUM(CASE WHEN NOT in_stock OR stock_quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        
        -- Calculate percentage of products meeting quality threshold
        ROUND(
            SUM(CASE WHEN quality_score >= {{ var('min_quality_score') }} THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100, 
            2
        ) AS pct_meeting_threshold
        
    FROM products
    GROUP BY merchant_id, merchant_name
),

brand_quality AS (
    SELECT 
        brand_name,
        brand_tier,
        COUNT(*) AS total_products,
        AVG(quality_score) AS avg_quality_score,
        AVG(completeness_score) AS avg_completeness,
        AVG(search_price) AS avg_price,
        AVG(discount_percentage) AS avg_discount,
        SUM(CASE WHEN is_duplicate THEN 1 ELSE 0 END) AS duplicate_count
    FROM products
    WHERE brand_name IS NOT NULL
    GROUP BY brand_name, brand_tier
),

category_quality AS (
    SELECT 
        category_name,
        COUNT(*) AS total_products,
        AVG(quality_score) AS avg_quality_score,
        AVG(completeness_score) AS avg_completeness,
        AVG(search_price) AS avg_price,
        SUM(CASE WHEN is_duplicate THEN 1 ELSE 0 END) AS duplicate_count
    FROM products
    WHERE category_name IS NOT NULL
    GROUP BY category_name
)

SELECT 
    'merchant' AS dimension_type,
    merchant_name AS dimension_value,
    total_products,
    avg_quality_score,
    median_quality_score,
    pct_meeting_threshold,
    avg_completeness,
    high_quality_count,
    medium_quality_count,
    low_quality_count,
    duplicate_count,
    stale_product_count,
    out_of_stock_count
FROM merchant_quality

UNION ALL

SELECT 
    'brand' AS dimension_type,
    brand_name AS dimension_value,
    total_products,
    avg_quality_score,
    NULL AS median_quality_score,
    NULL AS pct_meeting_threshold,
    avg_completeness,
    NULL AS high_quality_count,
    NULL AS medium_quality_count,
    NULL AS low_quality_count,
    duplicate_count,
    NULL AS stale_product_count,
    NULL AS out_of_stock_count
FROM brand_quality

UNION ALL

SELECT 
    'category' AS dimension_type,
    category_name AS dimension_value,
    total_products,
    avg_quality_score,
    NULL AS median_quality_score,
    NULL AS pct_meeting_threshold,
    avg_completeness,
    NULL AS high_quality_count,
    NULL AS medium_quality_count,
    NULL AS low_quality_count,
    duplicate_count,
    NULL AS stale_product_count,
    NULL AS out_of_stock_count
FROM category_quality