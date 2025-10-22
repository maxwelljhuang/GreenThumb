-- Test that pricing data is logically consistent across all fields
-- This comprehensive test checks for various pricing anomalies and calculation errors
-- Should return 0 rows if all pricing data is consistent

WITH price_checks AS (
    SELECT 
        product_id,
        product_name,
        brand_name,
        merchant_name,
        search_price,
        rrp_price,
        store_price,
        discount_percentage,
        discount_amount,
        price_band,
        
        -- Calculate expected values for comparison
        CASE 
            WHEN rrp_price IS NOT NULL AND rrp_price > 0 AND search_price > 0
            THEN ROUND(((rrp_price - search_price) / rrp_price) * 100, 2)
            ELSE 0
        END AS calculated_discount_pct,
        
        CASE 
            WHEN rrp_price IS NOT NULL AND search_price IS NOT NULL
            THEN rrp_price - search_price
            ELSE 0
        END AS calculated_discount_amt,
        
        -- Identify specific issues
        CASE 
            -- Price relationship issues
            WHEN search_price > rrp_price * 1.1 AND rrp_price > 0
                THEN 'search_price_exceeds_rrp'
            
            -- Discount calculation issues
            WHEN discount_percentage > 0 AND rrp_price = search_price 
                THEN 'discount_without_price_difference'
            
            WHEN discount_percentage = 0 AND rrp_price > search_price AND rrp_price IS NOT NULL
                THEN 'price_difference_without_discount'
            
            WHEN ABS(discount_amount - (rrp_price - search_price)) > 0.01 
                AND rrp_price IS NOT NULL AND discount_amount IS NOT NULL
                THEN 'discount_calculation_mismatch'
            
            -- Unrealistic values
            WHEN discount_percentage > 99 
                THEN 'unrealistic_discount_percentage'
            
            WHEN discount_percentage < -10 
                THEN 'negative_discount_excessive'
            
            WHEN search_price < 0.01 
                THEN 'price_too_low'
            
            WHEN search_price > 99999 
                THEN 'price_suspiciously_high'
            
            -- Store price inconsistencies
            WHEN store_price IS NOT NULL AND store_price > 0 
                AND ABS(store_price - search_price) > search_price * 0.5
                THEN 'store_price_mismatch'
            
            -- Price band misalignment
            WHEN search_price <= {{ var('price_band_budget_max') }} AND price_band != 'budget'
                THEN 'price_band_mismatch_budget'
            
            WHEN search_price > {{ var('price_band_budget_max') }} 
                AND search_price <= {{ var('price_band_mid_max') }} 
                AND price_band != 'mid-range'
                THEN 'price_band_mismatch_mid'
            
            WHEN search_price > {{ var('price_band_mid_max') }} 
                AND search_price <= {{ var('price_band_premium_max') }} 
                AND price_band != 'premium'
                THEN 'price_band_mismatch_premium'
            
            WHEN search_price > {{ var('price_band_premium_max') }} AND price_band != 'luxury'
                THEN 'price_band_mismatch_luxury'
            
            ELSE 'unknown_inconsistency'
        END AS inconsistency_type
        
    FROM {{ ref('product_catalog') }}
)

SELECT 
    product_id,
    product_name,
    brand_name,
    merchant_name,
    search_price,
    rrp_price,
    store_price,
    discount_percentage,
    discount_amount,
    calculated_discount_pct,
    calculated_discount_amt,
    price_band,
    inconsistency_type,
    
    -- Additional context for debugging
    CASE 
        WHEN inconsistency_type LIKE '%discount%' 
        THEN 'Expected: ' || calculated_discount_pct || '%, Got: ' || discount_percentage || '%'
        ELSE ''
    END AS debug_info
    
FROM price_checks
WHERE 
    -- Filter to only show rows with issues
    inconsistency_type != 'unknown_inconsistency'
    
    -- Additional checks not captured in the CASE statement
    OR (search_price IS NULL)  -- Null prices shouldn't exist in catalog
    OR (search_price = 0 AND in_stock = true)  -- In-stock items shouldn't be free
    OR (rrp_price < search_price * 0.5 AND rrp_price > 0)  -- RRP shouldn't be less than half of search price
    OR (discount_percentage > 95 AND search_price > 10)  -- Extremely high discounts on non-trivial items
    
ORDER BY inconsistency_type, search_price DESC

-- This test ensures all pricing data is internally consistent and realistic