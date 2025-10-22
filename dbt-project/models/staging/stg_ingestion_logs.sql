{{
  config(
    materialized='view'
  )
}}

-- Staging layer for ingestion logs
WITH source AS (
    SELECT * FROM ingestion_logs  -- Direct reference to raw ingestion_logs table
),

cleaned AS (
    SELECT
        id AS ingestion_log_id,
        feed_name,
        merchant_id,
        merchant_name,
        
        -- Timestamps
        started_at,
        completed_at,
        
        -- Statistics
        COALESCE(total_rows, 0) AS total_rows,
        COALESCE(processed_rows, 0) AS processed_rows,
        COALESCE(new_products, 0) AS new_products,
        COALESCE(updated_products, 0) AS updated_products,
        COALESCE(failed_rows, 0) AS failed_rows,
        COALESCE(duplicates_found, 0) AS duplicates_found,
        
        -- Status and performance
        COALESCE(status, 'unknown') AS status,
        error_message,
        COALESCE(processing_time_seconds, 0) AS processing_time_seconds,
        COALESCE(rows_per_second, 0) AS rows_per_second,
        
        -- Calculated fields
        CASE 
            WHEN total_rows > 0 
            THEN ROUND((processed_rows::numeric / total_rows) * 100, 2)
            ELSE 0
        END AS completion_percentage,
        
        CASE 
            WHEN processed_rows > 0 
            THEN ROUND((new_products + updated_products)::numeric / processed_rows * 100, 2)
            ELSE 0
        END AS success_rate,
        
        CASE 
            WHEN status = 'completed' THEN true
            ELSE false
        END AS is_successful,
        
        -- Duration in minutes
        CASE 
            WHEN completed_at IS NOT NULL AND started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
            ELSE NULL
        END AS duration_minutes,
        
        -- Data quality rate
        CASE 
            WHEN processed_rows > 0
            THEN ROUND(((processed_rows - failed_rows)::numeric / processed_rows) * 100, 2)
            ELSE 0
        END AS data_quality_rate,
        
        -- Duplicate detection rate
        CASE 
            WHEN processed_rows > 0
            THEN ROUND((duplicates_found::numeric / processed_rows) * 100, 2)
            ELSE 0
        END AS duplicate_rate
        
    FROM source
)

SELECT * FROM cleaned