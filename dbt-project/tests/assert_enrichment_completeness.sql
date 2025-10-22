-- Test that data enrichment calculations are complete and correct
-- This validates that all calculated fields are properly populated
-- Should return 0 rows if enrichment is working correctly

WITH enrichment_checks AS (
    SELECT 
        product_id,
        product_name,
        merchant_name,
        
        -- Check price band assignment
        search_price,
        price_band,
        CASE 
            WHEN search_price <= {{ var('price_band_budget_max') }} THEN 'budget'
            WHEN search_price <= {{ var('price_band_mid_max') }} THEN 'mid-range'
            WHEN search_price <= {{ var('price_band_premium_max') }} THEN 'premium'
            ELSE 'luxury'
        END AS expected_price_band,
        
        -- Check quality tier assignment
        quality_score,
        quality_tier,
        CASE 
            WHEN quality_score >= {{ var('high_quality_threshold') }} THEN 'high'
            WHEN quality_score >= {{ var('min_quality_score') }} THEN 'medium'
            ELSE 'low'
        END AS expected_quality_tier,
        
        -- Check freshness status assignment
        days_since_update,
        freshness_status,
        CASE 
            WHEN days_since_update <= 7 THEN 'fresh'
            WHEN days_since_update <= 30 THEN 'recent'
            WHEN days_since_update <= {{ var('stale_threshold_days') }} THEN 'aging'
            WHEN days_since_update <= {{ var('very_stale_threshold_days') }} THEN 'stale'
            ELSE 'very_stale'
        END AS expected_freshness_status,
        
        -- Check discount calculations
        rrp_price,
        discount_percentage,
        discount_amount,
        CASE 
            WHEN rrp_price > 0 AND search_price > 0 
            THEN ROUND(((rrp_price - search_price) / rrp_price) * 100, 2)
            ELSE 0
        END AS expected_discount_percentage,
        
        -- Check completeness score
        completeness_score,
        CASE 
            WHEN completeness_score IS NULL THEN 'null_completeness_score'
            WHEN completeness_score < 0 THEN 'negative_completeness_score'
            WHEN completeness_score > 100 THEN 'completeness_score_exceeds_100'
            ELSE NULL
        END AS completeness_issue,
        
        -- Check ranking fields
        brand_rank,
        category_rank,
        price_band_rank,
        quality_rank,
        CASE 
            WHEN brand_rank IS NULL AND brand_name IS NOT NULL THEN 'missing_brand_rank'
            WHEN category_rank IS NULL AND category_name IS NOT NULL THEN 'missing_category_rank'
            WHEN price_band_rank IS NULL THEN 'missing_price_band_rank'
            WHEN quality_rank IS NULL THEN 'missing_quality_rank'
            ELSE NULL
        END AS ranking_issue
        
    FROM {{ ref('product_catalog') }}
),

validation_results AS (
    SELECT 
        product_id,
        product_name,
        merchant_name,
        
        -- Collect all issues
        ARRAY_REMOVE(ARRAY[
            -- Price band mismatch
            CASE 
                WHEN price_band != expected_price_band 
                THEN 'price_band_mismatch: expected ' || expected_price_band || ' got ' || price_band
                ELSE NULL
            END,
            
            -- Quality tier mismatch
            CASE 
                WHEN quality_tier != expected_quality_tier 
                THEN 'quality_tier_mismatch: expected ' || expected_quality_tier || ' got ' || quality_tier
                ELSE NULL
            END,
            
            -- Freshness status mismatch
            CASE 
                WHEN freshness_status != expected_freshness_status 
                THEN 'freshness_mismatch: expected ' || expected_freshness_status || ' got ' || freshness_status
                ELSE NULL
            END,
            
            -- Discount calculation mismatch
            CASE 
                WHEN rrp_price IS NOT NULL AND rrp_price > 0 
                    AND ABS(COALESCE(discount_percentage, 0) - expected_discount_percentage) > 0.1
                THEN 'discount_calc_mismatch: expected ' || expected_discount_percentage || '% got ' || discount_percentage || '%'
                ELSE NULL
            END,
            
            -- Completeness score issues
            completeness_issue,
            
            -- Ranking issues
            ranking_issue,
            
            -- Required enrichment fields that are null
            CASE WHEN price_band IS NULL THEN 'null_price_band' ELSE NULL END,
            CASE WHEN quality_tier IS NULL THEN 'null_quality_tier' ELSE NULL END,
            CASE WHEN freshness_status IS NULL THEN 'null_freshness_status' ELSE NULL END,
            CASE WHEN stock_level IS NULL THEN 'null_stock_level' ELSE NULL END,
            CASE WHEN primary_image_url IS NULL AND (merchant_image_url IS NOT NULL OR aw_image_url IS NOT NULL) 
                 THEN 'primary_image_not_set' ELSE NULL END
                 
        ], NULL) AS enrichment_issues
        
    FROM enrichment_checks
)

-- Return products with enrichment issues
SELECT 
    product_id,
    product_name,
    merchant_name,
    CARDINALITY(enrichment_issues) AS issue_count,
    ARRAY_TO_STRING(enrichment_issues, '; ') AS issues_description
FROM validation_results
WHERE CARDINALITY(enrichment_issues) > 0
ORDER BY issue_count DESC, product_id

-- This test validates that all data enrichment calculations are correct