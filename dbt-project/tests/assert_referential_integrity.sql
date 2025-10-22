-- Test referential integrity and data relationships
-- This ensures all foreign keys and relationships are valid
-- Should return 0 rows if all relationships are intact

WITH relationship_checks AS (
    -- Check for orphaned duplicates (pointing to non-existent canonical products)
    SELECT 
        'orphaned_duplicate' AS issue_type,
        p1.product_id,
        p1.product_name,
        p1.canonical_product_id AS reference_id,
        'Product marked as duplicate but canonical product does not exist' AS issue_description
    FROM {{ ref('product_catalog') }} p1
    LEFT JOIN {{ ref('product_catalog') }} p2 
        ON p1.canonical_product_id = p2.product_id
    WHERE p1.canonical_product_id IS NOT NULL
        AND p2.product_id IS NULL
    
    UNION ALL
    
    -- Check for products with invalid category relationships
    SELECT 
        'invalid_category' AS issue_type,
        p.product_id,
        p.product_name,
        p.category_id::TEXT AS reference_id,
        'Category ID exists but category name is missing' AS issue_description
    FROM {{ ref('product_catalog') }} p
    WHERE p.category_id IS NOT NULL
        AND (p.category_name IS NULL OR p.category_name = '')
    
    UNION ALL
    
    -- Check for products with invalid brand relationships
    SELECT 
        'invalid_brand' AS issue_type,
        p.product_id,
        p.product_name,
        p.brand_id::TEXT AS reference_id,
        'Brand ID exists but brand name is missing' AS issue_description
    FROM {{ ref('product_catalog') }} p
    WHERE p.brand_id IS NOT NULL
        AND (p.brand_name IS NULL OR p.brand_name = '')
    
    UNION ALL
    
    -- Check for duplicate products that aren't properly marked
    SELECT DISTINCT
        'unmarked_duplicate' AS issue_type,
        p1.product_id,
        p1.product_name,
        p2.product_id AS reference_id,
        'Products have same hash but not marked as duplicates' AS issue_description
    FROM {{ ref('product_catalog') }} p1
    INNER JOIN {{ ref('product_catalog') }} p2
        ON p1.product_hash = p2.product_hash
        AND p1.product_id != p2.product_id
    WHERE p1.is_duplicate = false
        AND p2.is_duplicate = false
    
    UNION ALL
    
    -- Check for circular duplicate references
    SELECT 
        'circular_duplicate' AS issue_type,
        p1.product_id,
        p1.product_name,
        p2.product_id AS reference_id,
        'Circular reference in duplicate chain' AS issue_description
    FROM {{ ref('product_catalog') }} p1
    INNER JOIN {{ ref('product_catalog') }} p2
        ON p1.canonical_product_id = p2.product_id
        AND p2.canonical_product_id = p1.product_id
    WHERE p1.product_id < p2.product_id  -- Avoid duplicating the pair
)

SELECT 
    issue_type,
    product_id,
    product_name,
    reference_id,
    issue_description
FROM relationship_checks
ORDER BY issue_type, product_id

-- This test ensures all data relationships are valid and consistent