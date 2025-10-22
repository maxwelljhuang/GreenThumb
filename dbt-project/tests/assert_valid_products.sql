-- Test that all products in catalog meet all validation criteria
-- This comprehensive test validates multiple aspects of data quality
-- Should return 0 rows if all products are valid

WITH product_validations AS (
    SELECT 
        product_id,
        product_name,
        brand_name,
        category_name,
        merchant_id,
        merchant_name,
        quality_score,
        completeness_score,
        search_price,
        rrp_price,
        currency,
        primary_image_url,
        total_image_count,
        in_stock,
        stock_level,
        freshness_status,
        days_since_update,
        price_band,
        quality_tier,
        discount_percentage,
        is_fashion_product,
        
        -- Build array of validation failures
        ARRAY_REMOVE(ARRAY[
            -- Name validations
            CASE 
                WHEN product_name IS NULL THEN 'null_product_name'
                WHEN LENGTH(product_name) < 3 THEN 'product_name_too_short'
                WHEN LENGTH(product_name) > 500 THEN 'product_name_too_long'
                WHEN product_name ~ '^[0-9]+$' THEN 'product_name_only_numbers'
                WHEN product_name ~* '(test|sample|delete|xxx)' THEN 'test_product_name'
                ELSE NULL
            END,
            
            -- Price validations
            CASE 
                WHEN search_price IS NULL THEN 'null_price'
                WHEN search_price <= 0 THEN 'invalid_price_zero_or_negative'
                WHEN search_price < 0.01 THEN 'price_too_low'
                WHEN search_price > 99999 THEN 'price_unrealistically_high'
                ELSE NULL
            END,
            
            -- Quality validations
            CASE 
                WHEN quality_score IS NULL THEN 'null_quality_score'
                WHEN quality_score < {{ var('min_quality_score') }} THEN 'below_quality_threshold'
                WHEN quality_score > 1 THEN 'invalid_quality_score_range'
                ELSE NULL
            END,
            
            -- Completeness validations
            CASE 
                WHEN completeness_score < 20 THEN 'severely_incomplete_data'
                WHEN completeness_score < 40 AND quality_tier = 'high' THEN 'incomplete_high_quality_mismatch'
                ELSE NULL
            END,
            
            -- Merchant validations
            CASE 
                WHEN merchant_id IS NULL THEN 'missing_merchant_id'
                WHEN merchant_name IS NULL OR merchant_name = '' THEN 'missing_merchant_name'
                ELSE NULL
            END,
            
            -- Image validations
            CASE 
                WHEN primary_image_url IS NULL THEN 'missing_primary_image'
                WHEN total_image_count = 0 THEN 'no_images_available'
                WHEN primary_image_url NOT LIKE 'http%' THEN 'invalid_image_url_format'
                ELSE NULL
            END,
            
            -- Freshness validations
            CASE 
                WHEN freshness_status = 'very_stale' THEN 'very_stale_data'
                WHEN days_since_update > {{ var('very_stale_threshold_days') }} THEN 'exceeded_staleness_threshold'
                WHEN days_since_update < 0 THEN 'future_dated_update'
                ELSE NULL
            END,
            
            -- Stock validations
            CASE 
                WHEN in_stock IS NULL THEN 'null_stock_status'
                WHEN stock_level = 'unknown' AND search_price > 0 THEN 'unknown_stock_for_priced_item'
                WHEN in_stock = false AND stock_quantity > 0 THEN 'stock_status_mismatch'
                ELSE NULL
            END,
            
            -- Category validations
            CASE 
                WHEN category_name IS NULL AND category_id IS NULL THEN 'no_category_assigned'
                WHEN category_name = '' THEN 'empty_category_name'
                ELSE NULL
            END,
            
            -- Currency validations
            CASE 
                WHEN currency IS NULL THEN 'null_currency'
                WHEN currency NOT IN ('GBP', 'USD', 'EUR', 'AUD', 'CAD') THEN 'unsupported_currency'
                ELSE NULL
            END,
            
            -- Discount validations
            CASE 
                WHEN discount_percentage < -10 THEN 'excessive_negative_discount'
                WHEN discount_percentage > 100 THEN 'discount_exceeds_100_percent'
                WHEN discount_percentage > 95 AND quality_tier = 'high' THEN 'suspicious_high_discount_on_quality'
                ELSE NULL
            END,
            
            -- Brand validations
            CASE 
                WHEN brand_name ~* '(unknown|no brand|n/a|null|none)' AND quality_tier = 'high' THEN 'generic_brand_high_quality_mismatch'
                WHEN LENGTH(brand_name) > 100 THEN 'brand_name_too_long'
                ELSE NULL
            END,
            
            -- Fashion-specific validations
            CASE 
                WHEN is_fashion_product = true AND colour IS NULL THEN 'fashion_missing_color'
                WHEN is_fashion_product = true AND fashion_size IS NULL THEN 'fashion_missing_size'
                ELSE NULL
            END,
            
            -- Cross-field validations
            CASE 
                WHEN rrp_price IS NOT NULL AND rrp_price > 0 AND search_price > rrp_price * 1.2 THEN 'price_exceeds_rrp_significantly'
                WHEN quality_score > 0.8 AND completeness_score < 50 THEN 'quality_completeness_mismatch'
                WHEN price_band = 'luxury' AND quality_tier = 'low' THEN 'luxury_price_low_quality_mismatch'
                ELSE NULL
            END
            
        ], NULL) AS validation_failures,
        
        -- Count total failures
        CARDINALITY(ARRAY_REMOVE(ARRAY[
            CASE WHEN product_name IS NULL OR LENGTH(product_name) < 3 THEN 1 ELSE NULL END,
            CASE WHEN search_price IS NULL OR search_price <= 0 THEN 1 ELSE NULL END,
            CASE WHEN quality_score < {{ var('min_quality_score') }} THEN 1 ELSE NULL END,
            CASE WHEN merchant_id IS NULL THEN 1 ELSE NULL END,
            CASE WHEN primary_image_url IS NULL THEN 1 ELSE NULL END,
            CASE WHEN freshness_status = 'very_stale' THEN 1 ELSE NULL END,
            CASE WHEN in_stock IS NULL THEN 1 ELSE NULL END,
            CASE WHEN currency NOT IN ('GBP', 'USD', 'EUR', 'AUD', 'CAD') THEN 1 ELSE NULL END,
            CASE WHEN discount_percentage < -10 OR discount_percentage > 100 THEN 1 ELSE NULL END
        ], NULL)) AS failure_count
        
    FROM {{ ref('product_catalog') }}
)

-- Return products that failed any validation
SELECT 
    product_id,
    product_name,
    brand_name,
    merchant_name,
    quality_score,
    completeness_score,
    search_price,
    freshness_status,
    failure_count,
    ARRAY_TO_STRING(validation_failures, ', ') AS failures_list,
    
    -- Categorize severity
    CASE 
        WHEN failure_count >= 5 THEN 'critical - multiple failures'
        WHEN failure_count >= 3 THEN 'severe - several issues'
        WHEN failure_count >= 2 THEN 'moderate - multiple issues'
        WHEN failure_count = 1 THEN 'minor - single issue'
        ELSE 'valid'
    END AS severity
    
FROM product_validations
WHERE failure_count > 0

ORDER BY 
    failure_count DESC,
    quality_score ASC,
    product_id

-- This comprehensive test should return 0 rows if all products pass validation