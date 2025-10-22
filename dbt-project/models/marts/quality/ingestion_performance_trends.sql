{{
  config(
    materialized='view'
  )
}}

-- Track ingestion performance trends over time
WITH daily_ingestions AS (
    SELECT 
        DATE(started_at) AS ingestion_date,
        COUNT(*) AS ingestions_count,
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) AS successful_count,
        SUM(total_rows) AS total_rows,
        SUM(processed_rows) AS processed_rows,
        SUM(new_products) AS new_products,
        SUM(updated_products) AS updated_products,
        SUM(failed_rows) AS failed_rows,
        SUM(duplicates_found) AS duplicates_found,
        AVG(rows_per_second) AS avg_throughput,
        AVG(success_rate) AS avg_success_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate,
        AVG(data_quality_rate) AS avg_data_quality_rate,
        AVG(duration_minutes) AS avg_duration_minutes
    FROM {{ ref('stg_ingestion_logs') }}
    GROUP BY DATE(started_at)
),

weekly_ingestions AS (
    SELECT 
        DATE_TRUNC('week', started_at) AS week_start,
        COUNT(*) AS ingestions_count,
        SUM(total_rows) AS total_rows,
        SUM(new_products) AS new_products,
        AVG(success_rate) AS avg_success_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate
    FROM {{ ref('stg_ingestion_logs') }}
    GROUP BY DATE_TRUNC('week', started_at)
),

merchant_performance AS (
    SELECT 
        merchant_id,
        merchant_name,
        COUNT(*) AS total_ingestions,
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) AS successful_ingestions,
        AVG(success_rate) AS avg_success_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate,
        AVG(rows_per_second) AS avg_throughput,
        SUM(total_rows) AS total_rows_processed,
        MAX(started_at) AS last_ingestion,
        
        -- Calculate reliability score
        ROUND(
            (SUM(CASE WHEN is_successful THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            2
        ) AS reliability_score
        
    FROM {{ ref('stg_ingestion_logs') }}
    WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY merchant_id, merchant_name
),

error_patterns AS (
    SELECT 
        CASE 
            WHEN error_message LIKE '%timeout%' THEN 'timeout'
            WHEN error_message LIKE '%connection%' THEN 'connection'
            WHEN error_message LIKE '%validation%' THEN 'validation'
            WHEN error_message LIKE '%memory%' THEN 'memory'
            WHEN error_message LIKE '%permission%' THEN 'permission'
            ELSE 'other'
        END AS error_type,
        COUNT(*) AS error_count,
        COUNT(DISTINCT merchant_id) AS affected_merchants
    FROM {{ ref('stg_ingestion_logs') }}
    WHERE status = 'failed' 
        AND error_message IS NOT NULL
        AND started_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY error_type
)

-- Create final performance view
SELECT 
    'daily_trend' AS metric_type,
    ingestion_date::TEXT AS period,
    ingestions_count AS value1,
    successful_count AS value2,
    total_rows AS value3,
    new_products AS value4,
    ROUND(avg_success_rate, 2) AS value5,
    ROUND(avg_duplicate_rate, 2) AS value6,
    ROUND(avg_throughput, 0) AS value7,
    NULL AS text_value
FROM daily_ingestions
WHERE ingestion_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT 
    'weekly_summary' AS metric_type,
    week_start::TEXT AS period,
    ingestions_count AS value1,
    NULL AS value2,
    total_rows AS value3,
    new_products AS value4,
    ROUND(avg_success_rate, 2) AS value5,
    ROUND(avg_duplicate_rate, 2) AS value6,
    NULL AS value7,
    NULL AS text_value
FROM weekly_ingestions
WHERE week_start >= CURRENT_DATE - INTERVAL '90 days'

UNION ALL

SELECT 
    'merchant_performance' AS metric_type,
    merchant_name AS period,
    total_ingestions AS value1,
    successful_ingestions AS value2,
    total_rows_processed AS value3,
    NULL AS value4,
    ROUND(avg_success_rate, 2) AS value5,
    ROUND(avg_duplicate_rate, 2) AS value6,
    reliability_score AS value7,
    TO_CHAR(last_ingestion, 'YYYY-MM-DD HH24:MI') AS text_value
FROM merchant_performance
ORDER BY reliability_score DESC

UNION ALL

SELECT 
    'error_patterns' AS metric_type,
    error_type AS period,
    error_count AS value1,
    affected_merchants AS value2,
    NULL AS value3,
    NULL AS value4,
    NULL AS value5,
    NULL AS value6,
    NULL AS value7,
    error_type || ': ' || error_count || ' errors' AS text_value
FROM error_patterns
ORDER BY error_count DESC

ORDER BY metric_type, period