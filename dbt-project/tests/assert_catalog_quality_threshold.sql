-- Test that all products in catalog meet minimum quality threshold
SELECT 
    product_id,
    quality_score
FROM {{ ref('product_catalog') }}
WHERE quality_score < {{ var('min_quality_score') }}

-- This should return 0 rows if filtering is working correctly