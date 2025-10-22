{{
  config(
    materialized='view'
  )
}}

-- Staging layer for deduplication log
WITH source AS (
    SELECT * FROM deduplication_log  -- Direct reference to raw table
),

cleaned AS (
    SELECT
        id AS dedup_log_id,
        original_product_id,
        duplicate_product_id,
        
        -- Deduplication details
        similarity_score,
        dedup_method,
        created_at,
        ingestion_log_id,
        
        -- Method categorization
        CASE 
            WHEN dedup_method = 'exact_hash' THEN 'exact'
            WHEN dedup_method = 'fuzzy_match' THEN 'fuzzy'
            WHEN dedup_method = 'hdbscan_cluster' THEN 'ml_clustering'
            WHEN dedup_method = 'cross_merchant' THEN 'cross_merchant'
            ELSE 'other'
        END AS dedup_category,
        
        -- Confidence level based on similarity score
        CASE 
            WHEN similarity_score >= 0.95 THEN 'very_high'
            WHEN similarity_score >= 0.85 THEN 'high'
            WHEN similarity_score >= 0.75 THEN 'medium'
            WHEN similarity_score >= 0.65 THEN 'low'
            ELSE 'very_low'
        END AS confidence_level
        
    FROM source
)

SELECT * FROM cleaned