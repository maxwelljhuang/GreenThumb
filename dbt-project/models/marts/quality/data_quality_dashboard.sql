{{
  config(
    materialized='view'
  )
}}

-- Comprehensive data quality dashboard combining all quality metrics
WITH ingestion_stats AS (
    SELECT 
        COUNT(*) AS total_ingestions,
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) AS successful_ingestions,
        SUM(total_rows) AS total_rows_processed,
        SUM(new_products) AS total_new_products,
        SUM(duplicates_found) AS total_duplicates_found,
        AVG(success_rate) AS avg_success_rate,
        AVG(duplicate_rate) AS avg_duplicate_rate,
        AVG(data_quality_rate) AS avg_data_quality_rate,
        MAX(started_at) AS last_ingestion_date
    FROM {{ ref('stg_ingestion_logs') }}
    WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
),

quality_issues_stats AS (
    SELECT 
        COUNT(*) AS total_issues,
        SUM(CASE WHEN NOT is_resolved THEN 1 ELSE 0 END) AS unresolved_issues,
        COUNT(DISTINCT issue_category) AS issue_categories,
        
        -- Issue breakdown by category
        SUM(CASE WHEN issue_category = 'pricing' THEN 1 ELSE 0 END) AS pricing_issues,
        SUM(CASE WHEN issue_category = 'images' THEN 1 ELSE 0 END) AS image_issues,
        SUM(CASE WHEN issue_category = 'content_moderation' THEN 1 ELSE 0 END) AS content_issues,
        SUM(CASE WHEN issue_category = 'quality' THEN 1 ELSE 0 END) AS quality_issues,
        SUM(CASE WHEN issue_category = 'missing_data' THEN 1 ELSE 0 END) AS missing_data_issues,
        
        -- Severity breakdown
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_issues,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) AS warning_issues,
        SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) AS info_issues,
        
        AVG(days_unresolved) AS avg_days_unresolved
    FROM {{ ref('stg_data_quality_issues') }}
),

dedup_stats AS (
    SELECT 
        COUNT(*) AS total_dedup_records,
        COUNT(DISTINCT duplicate_product_id) AS unique_duplicates_found,
        
        -- Method breakdown
        SUM(CASE WHEN dedup_category = 'exact' THEN 1 ELSE 0 END) AS exact_matches,
        SUM(CASE WHEN dedup_category = 'fuzzy' THEN 1 ELSE 0 END) AS fuzzy_matches,
        SUM(CASE WHEN dedup_category = 'ml_clustering' THEN 1 ELSE 0 END) AS ml_cluster_matches,
        SUM(CASE WHEN dedup_category = 'cross_merchant' THEN 1 ELSE 0 END) AS cross_merchant_matches,
        
        -- Confidence distribution
        AVG(similarity_score) AS avg_similarity_score,
        MIN(similarity_score) AS min_similarity_score,
        MAX(similarity_score) AS max_similarity_score,
        
        SUM(CASE WHEN confidence_level IN ('very_high', 'high') THEN 1 ELSE 0 END)::FLOAT / 
            NULLIF(COUNT(*), 0) AS high_confidence_rate
    FROM {{ ref('stg_deduplication_log') }}
),

product_quality AS (
    SELECT 
        COUNT(*) AS total_products,
        AVG(quality_score) AS avg_quality_score,
        
        -- Quality tier distribution
        SUM(CASE WHEN quality_tier = 'high' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_high_quality,
        SUM(CASE WHEN quality_tier = 'medium' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_medium_quality,
        SUM(CASE WHEN quality_tier = 'low' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_low_quality,
        
        -- Freshness distribution
        SUM(CASE WHEN freshness_status = 'fresh' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_fresh,
        SUM(CASE WHEN freshness_status IN ('stale', 'very_stale') THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS pct_stale,
        
        -- Data completeness
        AVG(completeness_score) AS avg_completeness_score,
        
        -- Issues
        SUM(CASE WHEN has_invalid_price THEN 1 ELSE 0 END) AS invalid_price_count,
        SUM(CASE WHEN missing_image THEN 1 ELSE 0 END) AS missing_image_count,
        SUM(CASE WHEN is_duplicate THEN 1 ELSE 0 END) AS duplicate_count
        
    FROM {{ ref('int_products_enriched') }}
    WHERE is_active = true
)

-- Combine all metrics into a comprehensive dashboard
SELECT 
    -- Ingestion metrics
    i.total_ingestions,
    i.successful_ingestions,
    ROUND(i.successful_ingestions::NUMERIC / NULLIF(i.total_ingestions, 0) * 100, 2) AS ingestion_success_rate,
    i.total_rows_processed,
    i.total_new_products,
    i.total_duplicates_found,
    ROUND(i.avg_success_rate, 2) AS avg_row_success_rate,
    ROUND(i.avg_duplicate_rate, 2) AS avg_duplicate_rate,
    ROUND(i.avg_data_quality_rate, 2) AS avg_data_quality_rate,
    i.last_ingestion_date,
    
    -- Quality issues metrics
    q.total_issues,
    q.unresolved_issues,
    ROUND(q.unresolved_issues::NUMERIC / NULLIF(q.total_issues, 0) * 100, 2) AS unresolved_rate,
    q.critical_issues,
    q.warning_issues,
    q.pricing_issues,
    q.image_issues,
    q.content_issues,
    ROUND(q.avg_days_unresolved, 1) AS avg_days_unresolved,
    
    -- Deduplication metrics
    d.total_dedup_records,
    d.unique_duplicates_found,
    d.exact_matches,
    d.fuzzy_matches,
    d.ml_cluster_matches,
    d.cross_merchant_matches,
    ROUND(d.avg_similarity_score, 3) AS avg_dedup_similarity,
    ROUND(d.high_confidence_rate * 100, 2) AS high_confidence_dedup_pct,
    
    -- Product quality metrics
    p.total_products,
    ROUND(p.avg_quality_score, 3) AS avg_product_quality_score,
    ROUND(p.pct_high_quality * 100, 2) AS pct_high_quality,
    ROUND(p.pct_medium_quality * 100, 2) AS pct_medium_quality,
    ROUND(p.pct_low_quality * 100, 2) AS pct_low_quality,
    ROUND(p.pct_fresh * 100, 2) AS pct_fresh_products,
    ROUND(p.pct_stale * 100, 2) AS pct_stale_products,
    ROUND(p.avg_completeness_score, 2) AS avg_completeness_score,
    p.invalid_price_count,
    p.missing_image_count,
    p.duplicate_count,
    
    -- Overall health score (0-100)
    ROUND(
        (
            -- Ingestion health (25%)
            (i.successful_ingestions::NUMERIC / NULLIF(i.total_ingestions, 0)) * 25 +
            
            -- Data quality (25%)
            (i.avg_data_quality_rate / 100) * 25 +
            
            -- Product quality (25%)
            p.avg_quality_score * 25 +
            
            -- Issue resolution (25%)
            (1 - (q.unresolved_issues::NUMERIC / NULLIF(q.total_issues, 0))) * 25
        ),
        2
    ) AS overall_health_score,
    
    -- Report timestamp
    CURRENT_TIMESTAMP AS report_generated_at
    
FROM ingestion_stats i
CROSS JOIN quality_issues_stats q
CROSS JOIN dedup_stats d
CROSS JOIN product_quality p