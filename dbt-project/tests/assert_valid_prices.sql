-- Test that all products have valid prices
SELECT 
    product_id,
    search_price
FROM {{ ref('product_catalog') }}
WHERE search_price <= 0 
   OR search_price IS NULL

-- This should return 0 rows