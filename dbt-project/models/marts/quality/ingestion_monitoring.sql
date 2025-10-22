{{
  config(
    materialized='view'
  )
}}

-- Monitor ingestion pipeline performance and data quality trends
WITH ingestion_logs AS (
    SELECT * FROM {{ ref('stg_ingestion_logs') }}
),

recent_ingestions AS (
    SELECT 
        *,
        -- Calculate ingestion efficiency
        CASE 
            WHEN processing_time_seconds > 0 
            THEN ROUND(total_rows::NUMERIC / processing_time_seconds, 2)
            ELSE 0
        END AS throughput_rows_per_sec,
        
        -- Data quality rate
        CASE 
            WHEN processed_rows > 0
            THEN ROUND(((processed_rows - failed_rows)::NUMERIC / processed_rows) * 100, 2)
            ELSE 0
        END AS data_quality_rate,
        
        -- Duplicate detection rate
        CASE 
            WHEN processed_rows > 0
            THEN ROUND((duplicates_found::NUMERIC / processed_rows) * 100, 2)
            ELSE 0
        END AS duplicate_rate
        
    FROM ingestion_logs
    WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
),

merchant_ingestion_stats AS (
    SELECT 
        merchant_id,
        merchant_name,
        COUNT(*) AS total_ingestions,
        
        -- Success metrics
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) AS successful_ingestions,
        ROUND(
            AVG(CASE WHEN is_successful THEN 1 ELSE 0 END) * 100, 
            2
        ) AS success_rate,
        
        -- Volume metrics
        SUM(total_rows) AS total_rows_processed,
        SUM(new_products) AS total_new_products,
        SUM(updated_products) AS total_updated_products,
        SUM(failed_rows) AS total_failed_rows,
        SUM(duplicates_found) AS total_duplicates,
        
        -- Performance metrics
        AVG(rows_per_second) AS avg_throughput,
        MAX(rows_per_second) AS max_throughput,
        MIN(rows_per_second) AS min_throughput,
        
        -- Quality metrics
        AVG(data_quality_rate) AS avg_data_quality_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate,
        
        -- Timing
        MAX(completed_at) AS last_ingestion,
        MIN(started_at) AS first_ingestion
        
    FROM recent_ingestions
    GROUP BY merchant_id, merchant_name
),

daily_ingestion_summary AS (
    SELECT 
        DATE(started_at) AS ingestion_date,
        COUNT(*) AS ingestions_count,
        SUM(total_rows) AS total_rows,
        SUM(new_products) AS new_products,
        SUM(updated_products) AS updated_products,
        SUM(failed_rows) AS failed_rows,
        AVG(rows_per_second) AS avg_throughput,
        AVG(success_rate) AS avg_success_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate
    FROM recent_ingestions
    GROUP BY DATE(started_at)
),

error_analysis AS (
    SELECT 
        DATE(started_at) AS error_date,
        merchant_name,
        status,
        error_message,
        failed_rows,
        total_rows
    FROM recent_ingestions
    WHERE status = 'failed' OR failed_rows > 0
    ORDER BY started_at DESC
    LIMIT 50
)

-- Create final monitoring view
SELECT 
    'merchant_performance' AS metric_type,
    merchant_name AS dimension,
    TO_CHAR(last_ingestion, 'YYYY-MM-DD HH24:MI') AS timestamp,
    total_ingestions::NUMERIC AS value1,
    success_rate AS value2,
    avg_throughput AS value3,
    avg_data_quality_rate AS value4,
    avg_duplicate_rate AS value5,
    'ingestions: ' || total_ingestions || 
    ', success: ' || success_rate || '%' ||
    ', quality: ' || avg_data_quality_rate || '%' AS details
FROM merchant_ingestion_stats

UNION ALL

SELECT 
    'daily_summary' AS metric_type,
    TO_CHAR(ingestion_date, 'YYYY-MM-DD') AS dimension,
    TO_CHAR(ingestion_date, 'YYYY-MM-DD') AS timestamp,
    ingestions_count AS value1,
    total_rows AS value2,
    new_products AS value3,
    avg_throughput AS value4,
    avg_duplicate_rate AS value5,
    'rows: ' || total_rows || 
    ', new: ' || new_products || 
    ', throughput: ' || ROUND(avg_throughput, 0) || '/sec' AS details
FROM daily_ingestion_summary

UNION ALL

SELECT 
    'recent_errors' AS metric_type,
    merchant_name AS dimension,
    TO_CHAR(error_date, 'YYYY-MM-DD HH24:MI') AS timestamp,
    failed_rows AS value1,
    total_rows AS value2,
    0 AS value3,
    0 AS value4,
    0 AS value5,
    COALESCE(LEFT(error_message, 200), 'Unknown error') AS details
FROM error_analysis

ORDER BY metric_type, timestamp DESC