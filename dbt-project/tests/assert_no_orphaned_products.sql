-- Test that all products have valid merchant associations
SELECT 
    p.product_id,
    p.merchant_id,
    p.merchant_name,
    p.product_name
FROM {{ ref('product_catalog') }} p
WHERE 
    p.merchant_id IS NULL 
    OR p.merchant_name IS NULL
    OR p.merchant_name = ''