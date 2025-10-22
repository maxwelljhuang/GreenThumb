-- ========================================================
-- GreenThumb Discovery Pipeline - Monitoring Queries
-- ========================================================

-- --------------------------------------------------------
-- 1. INGESTION MONITORING
-- --------------------------------------------------------

-- Real-time ingestion status
SELECT 
    log_id,
    merchant_name,
    status,
    total_rows,
    processed_rows,
    ROUND(processed_rows::numeric / NULLIF(total_rows, 0) * 100, 2) as progress_pct,
    valid_rows,
    invalid_rows,
    new_products,
    updated_products,
    ROUND(rows_per_second, 2) as rows_per_sec,
    TO_CHAR(started_at, 'YYYY-MM-DD HH24:MI:SS') as started,
    CASE 
        WHEN status = 'running' THEN 'In Progress'
        WHEN status = 'completed' THEN 'Complete'
        WHEN status = 'failed' THEN 'Failed'
        ELSE status
    END as status_label,
    CASE 
        WHEN completed_at IS NOT NULL THEN 
            TO_CHAR(completed_at - started_at, 'HH24:MI:SS')
        ELSE 
            TO_CHAR(NOW() - started_at, 'HH24:MI:SS')
    END as duration
FROM ingestion_logs
WHERE started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;

-- Ingestion summary by day
SELECT 
    DATE(started_at) as date,
    COUNT(*) as ingestion_count,
    SUM(total_rows) as total_rows,
    SUM(processed_rows) as processed_rows,
    SUM(new_products) as new_products,
    SUM(updated_products) as updated_products,
    ROUND(AVG(rows_per_second), 2) as avg_throughput,
    ROUND(AVG(processing_time_seconds), 2) as avg_duration_sec,
    ROUND(AVG(CASE WHEN status = 'completed' THEN 100.0 ELSE 0 END), 2) as success_rate
FROM ingestion_logs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- --------------------------------------------------------
-- 2. DATA QUALITY MONITORING
-- --------------------------------------------------------

-- Overall quality metrics
WITH quality_metrics AS (
    SELECT 
        COUNT(*) as total_products,
        AVG(quality_score) as avg_quality,
        STDDEV(quality_score) as stddev_quality,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY quality_score) as q1_quality,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score) as median_quality,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY quality_score) as q3_quality,
        MIN(quality_score) as min_quality,
        MAX(quality_score) as max_quality
    FROM products
    WHERE is_active = true
),
quality_distribution AS (
    SELECT 
        COUNT(*) FILTER (WHERE quality_score >= 0.8) as excellent_count,
        COUNT(*) FILTER (WHERE quality_score >= 0.6 AND quality_score < 0.8) as good_count,
        COUNT(*) FILTER (WHERE quality_score >= 0.3 AND quality_score < 0.6) as fair_count,
        COUNT(*) FILTER (WHERE quality_score < 0.3) as poor_count
    FROM products
    WHERE is_active = true
)
SELECT 
    m.total_products,
    ROUND(m.avg_quality::numeric, 3) as avg_quality_score,
    ROUND(m.median_quality::numeric, 3) as median_quality_score,
    ROUND(m.stddev_quality::numeric, 3) as stddev_quality_score,
    ROUND((d.excellent_count::numeric / m.total_products * 100), 2) as excellent_pct,
    ROUND((d.good_count::numeric / m.total_products * 100), 2) as good_pct,
    ROUND((d.fair_count::numeric / m.total_products * 100), 2) as fair_pct,
    ROUND((d.poor_count::numeric / m.total_products * 100), 2) as poor_pct
FROM quality_metrics m
CROSS JOIN quality_distribution d;

-- Quality by merchant
SELECT 
    merchant_id,
    merchant_name,
    COUNT(*) as product_count,
    ROUND(AVG(quality_score)::numeric, 3) as avg_quality,
    ROUND(STDDEV(quality_score)::numeric, 3) as quality_stddev,
    COUNT(*) FILTER (WHERE quality_score >= 0.7) as high_quality_count,
    COUNT(*) FILTER (WHERE quality_score < 0.3) as low_quality_count,
    COUNT(*) FILTER (WHERE is_duplicate = true) as duplicate_count,
    ROUND(AVG(search_price)::numeric, 2) as avg_price,
    TO_CHAR(MAX(updated_at), 'YYYY-MM-DD') as last_update
FROM products
WHERE is_active = true
GROUP BY merchant_id, merchant_name
HAVING COUNT(*) >= 10
ORDER BY avg_quality DESC;

-- Quality issues breakdown
SELECT 
    issue_type,
    severity,
    COUNT(*) as issue_count,
    COUNT(DISTINCT product_id) as affected_products,
    COUNT(DISTINCT merchant_id) as affected_merchants,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM data_quality_issues WHERE is_resolved = false) * 100, 2) as pct_of_total,
    TO_CHAR(MIN(detected_at), 'YYYY-MM-DD') as first_detected,
    TO_CHAR(MAX(detected_at), 'YYYY-MM-DD') as last_detected
FROM data_quality_issues
WHERE is_resolved = false
GROUP BY issue_type, severity
ORDER BY 
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    issue_count DESC;

-- --------------------------------------------------------
-- 3. DATA FRESHNESS MONITORING
-- --------------------------------------------------------

-- Freshness distribution
WITH freshness_categories AS (
    SELECT 
        CASE 
            WHEN updated_at > NOW() - INTERVAL '7 days' THEN '1_fresh'
            WHEN updated_at > NOW() - INTERVAL '30 days' THEN '2_recent'
            WHEN updated_at > NOW() - INTERVAL '90 days' THEN '3_aging'
            WHEN updated_at > NOW() - INTERVAL '180 days' THEN '4_stale'
            ELSE '5_very_stale'
        END as freshness_category,
        CASE 
            WHEN updated_at > NOW() - INTERVAL '7 days' THEN 'Fresh (< 7 days)'
            WHEN updated_at > NOW() - INTERVAL '30 days' THEN 'Recent (7-30 days)'
            WHEN updated_at > NOW() - INTERVAL '90 days' THEN 'Aging (30-90 days)'
            WHEN updated_at > NOW() - INTERVAL '180 days' THEN 'Stale (90-180 days)'
            ELSE 'Very Stale (> 180 days)'
        END as category_label,
        COUNT(*) as count
    FROM products
    WHERE is_active = true
    GROUP BY freshness_category, category_label
)
SELECT 
    category_label,
    count as product_count,
    ROUND(count::numeric / SUM(count) OVER() * 100, 2) as percentage,
    REPEAT('█', (count::numeric / SUM(count) OVER() * 50)::int) as bar_chart
FROM freshness_categories
ORDER BY freshness_category;

-- Stale data by merchant
SELECT 
    merchant_id,
    merchant_name,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '90 days') as stale_products,
    ROUND(COUNT(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '90 days')::numeric / COUNT(*) * 100, 2) as stale_pct,
    TO_CHAR(MIN(updated_at), 'YYYY-MM-DD') as oldest_update,
    TO_CHAR(MAX(updated_at), 'YYYY-MM-DD') as newest_update,
    EXTRACT(DAY FROM NOW() - MIN(updated_at))::int as oldest_days
FROM products
WHERE is_active = true
GROUP BY merchant_id, merchant_name
HAVING COUNT(*) >= 10
ORDER BY stale_pct DESC;

-- --------------------------------------------------------
-- 4. DEDUPLICATION MONITORING
-- --------------------------------------------------------

-- Duplicate statistics
WITH dedup_stats AS (
    SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_duplicate = true) as duplicate_count,
        COUNT(DISTINCT product_hash) as unique_hashes,
        COUNT(DISTINCT canonical_product_id) as canonical_count
    FROM products
    WHERE is_active = true
)
SELECT 
    total_products,
    duplicate_count,
    ROUND(duplicate_count::numeric / total_products * 100, 2) as duplicate_rate,
    unique_hashes,
    canonical_count,
    total_products - duplicate_count as unique_products
FROM dedup_stats;

-- Top duplicated products
SELECT 
    canonical_product_id,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(DISTINCT merchant_name) as merchants,
    MIN(product_name) as product_name,
    MIN(brand_name) as brand,
    MIN(category_name) as category,
    ROUND(AVG(search_price)::numeric, 2) as avg_price,
    ROUND(STDDEV(search_price)::numeric, 2) as price_stddev
FROM products
WHERE is_duplicate = true
    AND canonical_product_id IS NOT NULL
GROUP BY canonical_product_id
HAVING COUNT(*) > 2
ORDER BY duplicate_count DESC
LIMIT 20;

-- --------------------------------------------------------
-- 5. PERFORMANCE MONITORING
-- --------------------------------------------------------

-- Ingestion performance trends (last 30 days)
SELECT 
    DATE(started_at) as date,
    COUNT(*) as runs,
    ROUND(AVG(rows_per_second), 2) as avg_throughput,
    ROUND(MIN(rows_per_second), 2) as min_throughput,
    ROUND(MAX(rows_per_second), 2) as max_throughput,
    ROUND(AVG(processing_time_seconds), 2) as avg_duration,
    SUM(total_rows) as total_rows_processed,
    ROUND(AVG(valid_rows::numeric / NULLIF(processed_rows, 0) * 100), 2) as avg_validity_rate
FROM ingestion_logs
WHERE started_at >= NOW() - INTERVAL '30 days'
    AND status = 'completed'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Hourly ingestion pattern
SELECT 
    EXTRACT(HOUR FROM started_at) as hour,
    COUNT(*) as ingestion_count,
    ROUND(AVG(rows_per_second), 2) as avg_throughput,
    ROUND(AVG(processing_time_seconds), 2) as avg_duration,
    ROUND(AVG(CASE WHEN status = 'completed' THEN 100.0 ELSE 0 END), 2) as success_rate
FROM ingestion_logs
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM started_at)
ORDER BY hour;

-- --------------------------------------------------------
-- 6. PRODUCT CATALOG OVERVIEW
-- --------------------------------------------------------

-- Catalog summary by category
SELECT 
    category_name,
    COUNT(*) as product_count,
    COUNT(DISTINCT merchant_id) as merchant_count,
    COUNT(DISTINCT brand_name) as brand_count,
    ROUND(AVG(search_price)::numeric, 2) as avg_price,
    ROUND(MIN(search_price)::numeric, 2) as min_price,
    ROUND(MAX(search_price)::numeric, 2) as max_price,
    ROUND(AVG(quality_score)::numeric, 3) as avg_quality,
    COUNT(*) FILTER (WHERE in_stock = true) as in_stock_count
FROM products
WHERE is_active = true
    AND category_name IS NOT NULL
GROUP BY category_name
HAVING COUNT(*) >= 10
ORDER BY product_count DESC;

-- Price band distribution
SELECT 
    price_band,
    COUNT(*) as product_count,
    ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as percentage,
    ROUND(AVG(search_price)::numeric, 2) as avg_price,
    ROUND(AVG(quality_score)::numeric, 3) as avg_quality,
    COUNT(DISTINCT merchant_id) as merchant_count,
    COUNT(DISTINCT brand_name) as brand_count
FROM products
WHERE is_active = true
    AND price_band IS NOT NULL
GROUP BY price_band
ORDER BY 
    CASE price_band
        WHEN 'budget' THEN 1
        WHEN 'mid-range' THEN 2
        WHEN 'premium' THEN 3
        WHEN 'luxury' THEN 4
    END;

-- --------------------------------------------------------
-- 7. DATABASE HEALTH
-- --------------------------------------------------------

-- Table sizes and row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    ROUND(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) as bloat_pct,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    TO_CHAR(last_vacuum, 'YYYY-MM-DD HH24:MI') as last_vacuum,
    TO_CHAR(last_analyze, 'YYYY-MM-DD HH24:MI') as last_analyze
FROM pg_stat_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n_live_tup DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY idx_scan DESC;

-- --------------------------------------------------------
-- 8. ALERTS AND ISSUES
-- --------------------------------------------------------

-- Critical alerts (requires attention)
WITH alerts AS (
    SELECT 'Low Quality' as alert_type, 
           'Average quality score below threshold' as description,
           ROUND(AVG(quality_score)::numeric, 3)::text as value,
           CASE WHEN AVG(quality_score) < 0.5 THEN 'CRITICAL' ELSE 'WARNING' END as severity
    FROM products WHERE is_active = true
    HAVING AVG(quality_score) < 0.6
    
    UNION ALL
    
    SELECT 'High Duplicate Rate' as alert_type,
           'Duplicate rate exceeds threshold' as description,
           ROUND(COUNT(*) FILTER (WHERE is_duplicate = true)::numeric / COUNT(*) * 100, 2)::text || '%' as value,
           CASE WHEN COUNT(*) FILTER (WHERE is_duplicate = true)::numeric / COUNT(*) * 100 > 20 THEN 'CRITICAL' ELSE 'WARNING' END as severity
    FROM products WHERE is_active = true
    HAVING COUNT(*) FILTER (WHERE is_duplicate = true)::numeric / COUNT(*) * 100 > 15
    
    UNION ALL
    
    SELECT 'Stale Data' as alert_type,
           'High percentage of stale products' as description,
           ROUND(COUNT(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '90 days')::numeric / COUNT(*) * 100, 2)::text || '%' as value,
           CASE WHEN COUNT(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '90 days')::numeric / COUNT(*) * 100 > 30 THEN 'CRITICAL' ELSE 'WARNING' END as severity
    FROM products WHERE is_active = true
    HAVING COUNT(*) FILTER (WHERE updated_at <= NOW() - INTERVAL '90 days')::numeric / COUNT(*) * 100 > 20
    
    UNION ALL
    
    SELECT 'Recent Failures' as alert_type,
           'High failure rate in recent ingestions' as description,
           ROUND(AVG(CASE WHEN status = 'failed' THEN 100.0 ELSE 0 END), 2)::text || '%' as value,
           CASE WHEN AVG(CASE WHEN status = 'failed' THEN 100.0 ELSE 0 END) > 20 THEN 'CRITICAL' ELSE 'WARNING' END as severity
    FROM ingestion_logs
    WHERE started_at >= NOW() - INTERVAL '24 hours'
    HAVING AVG(CASE WHEN status = 'failed' THEN 100.0 ELSE 0 END) > 10
)
SELECT * FROM alerts ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 ELSE 2 END;