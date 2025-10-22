{{
  config(
    materialized='view'
  )
}}

-- Price analytics for understanding pricing patterns and opportunities
WITH products AS (
    SELECT * FROM {{ ref('int_products_enriched') }}
    WHERE 
        search_price > 0 
        AND quality_score >= {{ var('min_quality_score') }}
        AND is_active = true
        AND NOT is_duplicate
),

price_band_stats AS (
    SELECT 
        price_band,
        COUNT(*) AS product_count,
        
        -- Price statistics
        AVG(search_price) AS avg_price,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY search_price) AS price_p25,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY search_price) AS price_median,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY search_price) AS price_p75,
        MIN(search_price) AS min_price,
        MAX(search_price) AS max_price,
        STDDEV(search_price) AS price_stddev,
        
        -- Discount statistics
        AVG(discount_percentage) AS avg_discount_pct,
        MAX(discount_percentage) AS max_discount_pct,
        SUM(CASE WHEN discount_percentage > 0 THEN 1 ELSE 0 END) AS products_with_discount,
        
        -- Quality correlation
        AVG(quality_score) AS avg_quality_score,
        
        -- Stock status
        SUM(CASE WHEN in_stock THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS in_stock_rate
        
    FROM products
    GROUP BY price_band
),

category_pricing AS (
    SELECT 
        category_name,
        COUNT(*) AS product_count,
        AVG(search_price) AS avg_price,
        MIN(search_price) AS min_price,
        MAX(search_price) AS max_price,
        AVG(discount_percentage) AS avg_discount_pct,
        
        -- Price bands distribution
        SUM(CASE WHEN price_band = 'budget' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_budget,
        SUM(CASE WHEN price_band = 'mid-range' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_mid_range,
        SUM(CASE WHEN price_band = 'premium' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_premium,
        SUM(CASE WHEN price_band = 'luxury' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_luxury
        
    FROM products
    WHERE category_name IS NOT NULL
    GROUP BY category_name
    HAVING COUNT(*) >= 10  -- Only categories with meaningful data
),

brand_pricing AS (
    SELECT 
        brand_name,
        brand_tier,
        COUNT(*) AS product_count,
        AVG(search_price) AS avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY search_price) AS median_price,
        AVG(discount_percentage) AS avg_discount_pct,
        
        -- Premium positioning score (0-100)
        ROUND(
            (AVG(search_price) / NULLIF((SELECT AVG(search_price) FROM products), 0)) * 100,
            2
        ) AS premium_positioning_score
        
    FROM products
    WHERE brand_name IS NOT NULL
    GROUP BY brand_name, brand_tier
    HAVING COUNT(*) >= 5  -- Only brands with meaningful data
),

daily_price_changes AS (
    SELECT 
        DATE(updated_at) AS date,
        COUNT(*) AS products_updated,
        AVG(search_price) AS avg_price,
        
        -- Track significant price changes (would need historical data)
        -- This is a placeholder for when we have price history
        0 AS price_increases,
        0 AS price_decreases
        
    FROM products
    WHERE updated_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(updated_at)
)

-- Final output combining key metrics
SELECT 
    'price_band_summary' AS report_type,
    price_band AS dimension,
    product_count,
    ROUND(avg_price::NUMERIC, 2) AS avg_price,
    ROUND(price_median::NUMERIC, 2) AS median_price,
    ROUND(avg_discount_pct::NUMERIC, 2) AS avg_discount_pct,
    ROUND(in_stock_rate::NUMERIC * 100, 2) AS in_stock_percentage
FROM price_band_stats

UNION ALL

SELECT 
    'top_categories_by_price' AS report_type,
    category_name AS dimension,
    product_count,
    ROUND(avg_price::NUMERIC, 2) AS avg_price,
    NULL AS median_price,
    ROUND(avg_discount_pct::NUMERIC, 2) AS avg_discount_pct,
    NULL AS in_stock_percentage
FROM category_pricing
ORDER BY avg_price DESC
LIMIT 20

UNION ALL

SELECT 
    'top_brands_by_premium_score' AS report_type,
    brand_name AS dimension,
    product_count,
    ROUND(avg_price::NUMERIC, 2) AS avg_price,
    ROUND(median_price::NUMERIC, 2) AS median_price,
    ROUND(avg_discount_pct::NUMERIC, 2) AS avg_discount_pct,
    premium_positioning_score AS in_stock_percentage  -- Reusing column for score
FROM brand_pricing
ORDER BY premium_positioning_score DESC
LIMIT 20