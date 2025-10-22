{{
  config(
    materialized='view'
  )
}}

-- Monitor data freshness and identify stale products for removal
WITH products AS (
    SELECT * FROM {{ ref('int_products_enriched') }}
),

freshness_summary AS (
    SELECT 
        freshness_status,
        COUNT(*) AS product_count,
        ROUND(AVG(quality_score), 3) AS avg_quality_score,
        ROUND(AVG(search_price), 2) AS avg_price,
        
        -- Calculate percentage of total
        ROUND(
            COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM products), 0) * 100,
            2
        ) AS pct_of_total
        
    FROM products
    GROUP BY freshness_status
),

stale_products_by_merchant AS (
    SELECT 
        merchant_id,
        merchant_name,
        COUNT(*) AS total_products,
        
        SUM(CASE WHEN freshness_status = 'fresh' THEN 1 ELSE 0 END) AS fresh_count,
        SUM(CASE WHEN freshness_status = 'recent' THEN 1 ELSE 0 END) AS recent_count,
        SUM(CASE WHEN freshness_status = 'aging' THEN 1 ELSE 0 END) AS aging_count,
        SUM(CASE WHEN freshness_status = 'stale' THEN 1 ELSE 0 END) AS stale_count,
        SUM(CASE WHEN freshness_status = 'very_stale' THEN 1 ELSE 0 END) AS very_stale_count,
        
        -- Calculate stale percentage
        ROUND(
            SUM(CASE WHEN freshness_status IN ('stale', 'very_stale') THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100,
            2
        ) AS stale_percentage,
        
        -- Average days since update
        ROUND(AVG(days_since_update), 1) AS avg_days_since_update,
        MAX(days_since_update) AS max_days_since_update
        
    FROM products
    GROUP BY merchant_id, merchant_name
),

stale_products_by_category AS (
    SELECT 
        category_name,
        COUNT(*) AS total_products,
        
        SUM(CASE WHEN freshness_status IN ('stale', 'very_stale') THEN 1 ELSE 0 END) AS stale_count,
        
        ROUND(
            SUM(CASE WHEN freshness_status IN ('stale', 'very_stale') THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100,
            2
        ) AS stale_percentage,
        
        ROUND(AVG(days_since_update), 1) AS avg_days_since_update
        
    FROM products
    WHERE category_name IS NOT NULL
    GROUP BY category_name
    HAVING COUNT(*) >= 10  -- Only meaningful categories
),

-- Identify specific products that should be marked for removal
products_for_removal AS (
    SELECT 
        product_id,
        merchant_id,
        merchant_name,
        product_name,
        brand_name,
        category_name,
        days_since_update,
        quality_score,
        in_stock,
        last_updated,
        
        -- Removal reasons
        CASE
            WHEN days_since_update > {{ var('very_stale_threshold_days') }} THEN 'very_stale'
            WHEN days_since_update > {{ var('stale_threshold_days') }} AND NOT in_stock THEN 'stale_and_out_of_stock'
            WHEN days_since_update > {{ var('stale_threshold_days') }} AND quality_score < {{ var('min_quality_score') }} THEN 'stale_and_low_quality'
            WHEN is_nsfw THEN 'nsfw_content'
            WHEN has_invalid_price THEN 'invalid_price'
            ELSE 'other'
        END AS removal_reason
        
    FROM products
    WHERE 
        -- Very stale products
        days_since_update > {{ var('very_stale_threshold_days') }}
        -- Or stale products that are also problematic
        OR (days_since_update > {{ var('stale_threshold_days') }} 
            AND (NOT in_stock OR quality_score < {{ var('min_quality_score') }}))
        -- Or products with critical issues
        OR is_nsfw
        OR has_invalid_price
),

removal_summary AS (
    SELECT 
        removal_reason,
        COUNT(*) AS product_count,
        COUNT(DISTINCT merchant_id) AS affected_merchants
    FROM products_for_removal
    GROUP BY removal_reason
)

-- Final output
SELECT 
    'freshness_overview' AS report_type,
    freshness_status AS dimension,
    product_count AS value1,
    pct_of_total AS value2,
    avg_quality_score AS value3,
    avg_price AS value4,
    NULL AS value5,
    freshness_status || ': ' || product_count || ' products (' || pct_of_total || '%)' AS details
FROM freshness_summary

UNION ALL

SELECT 
    'merchant_staleness' AS report_type,
    merchant_name AS dimension,
    total_products AS value1,
    stale_count + very_stale_count AS value2,
    stale_percentage AS value3,
    avg_days_since_update AS value4,
    max_days_since_update AS value5,
    'Stale: ' || stale_percentage || '%, Avg age: ' || avg_days_since_update || ' days' AS details
FROM stale_products_by_merchant
WHERE stale_percentage > 10  -- Only show merchants with staleness issues
ORDER BY stale_percentage DESC
LIMIT 20

UNION ALL

SELECT 
    'category_staleness' AS report_type,
    category_name AS dimension,
    total_products AS value1,
    stale_count AS value2,
    stale_percentage AS value3,
    avg_days_since_update AS value4,
    NULL AS value5,
    'Stale: ' || stale_count || ' (' || stale_percentage || '%)' AS details
FROM stale_products_by_category
WHERE stale_percentage > 15
ORDER BY stale_percentage DESC
LIMIT 20

UNION ALL

SELECT 
    'removal_candidates' AS report_type,
    removal_reason AS dimension,
    product_count AS value1,
    affected_merchants AS value2,
    NULL AS value3,
    NULL AS value4,
    NULL AS value5,
    'Remove ' || product_count || ' products from ' || affected_merchants || ' merchants' AS details
FROM removal_summary

ORDER BY report_type, value1 DESC