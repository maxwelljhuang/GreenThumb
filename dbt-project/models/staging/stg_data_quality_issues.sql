{{
  config(
    materialized='view'
  )
}}

-- Staging layer for data quality issues
WITH source AS (
    SELECT * FROM data_quality_issues  -- Direct reference to raw table
),

cleaned AS (
    SELECT
        id AS issue_id,
        product_id,
        ingestion_log_id,
        
        -- Issue details
        issue_type,
        severity,
        field_name,
        details,
        
        -- Timestamps
        detected_at,
        resolved_at,
        is_resolved,
        
        -- Calculate time to resolution
        CASE 
            WHEN resolved_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600  -- Hours
            ELSE NULL
        END AS resolution_time_hours,
        
        -- Age of unresolved issues
        CASE 
            WHEN NOT is_resolved 
            THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - detected_at))
            ELSE NULL
        END AS days_unresolved,
        
        -- Issue category grouping
        CASE 
            WHEN issue_type LIKE '%price%' THEN 'pricing'
            WHEN issue_type LIKE '%image%' THEN 'images'
            WHEN issue_type LIKE '%nsfw%' THEN 'content_moderation'
            WHEN issue_type LIKE '%quality%' THEN 'quality'
            WHEN issue_type LIKE '%duplicate%' THEN 'duplication'
            WHEN issue_type LIKE '%missing%' THEN 'missing_data'
            ELSE 'other'
        END AS issue_category
        
    FROM source
)

SELECT * FROM cleaned