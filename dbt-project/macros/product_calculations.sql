-- Macro to calculate quality score consistently across models
{% macro calculate_quality_score(
    product_name_col='product_name',
    description_col='description',
    price_col='search_price',
    image_col='merchant_image_url',
    brand_col='brand_name',
    category_col='category_name'
) %}
    ROUND((
        (CASE WHEN {{ product_name_col }} IS NOT NULL AND LENGTH({{ product_name_col }}) > 3 THEN 15 ELSE 0 END) +
        (CASE WHEN {{ description_col }} IS NOT NULL AND LENGTH({{ description_col }}) > 20 THEN 10 ELSE 0 END) +
        (CASE WHEN {{ price_col }} IS NOT NULL AND {{ price_col }} > 0 THEN 15 ELSE 0 END) +
        (CASE WHEN {{ image_col }} IS NOT NULL THEN 15 ELSE 0 END) +
        (CASE WHEN {{ brand_col }} IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN {{ category_col }} IS NOT NULL THEN 5 ELSE 0 END)
    ) / 70.0, 3)
{% endmacro %}

-- Macro to determine price band
{% macro get_price_band(price_col='search_price') %}
    CASE 
        WHEN {{ price_col }} <= {{ var('price_band_budget_max') }} THEN 'budget'
        WHEN {{ price_col }} <= {{ var('price_band_mid_max') }} THEN 'mid-range'
        WHEN {{ price_col }} <= {{ var('price_band_premium_max') }} THEN 'premium'
        ELSE 'luxury'
    END
{% endmacro %}

-- Macro to determine freshness status
{% macro get_freshness_status(days_col='days_since_update') %}
    CASE 
        WHEN {{ days_col }} <= 7 THEN 'fresh'
        WHEN {{ days_col }} <= 30 THEN 'recent'
        WHEN {{ days_col }} <= {{ var('stale_threshold_days') }} THEN 'aging'
        WHEN {{ days_col }} <= {{ var('very_stale_threshold_days') }} THEN 'stale'
        ELSE 'very_stale'
    END
{% endmacro %}

-- Macro to clean text fields
{% macro clean_text(column_name) %}
    TRIM(REGEXP_REPLACE({{ column_name }}, '\s+', ' ', 'g'))
{% endmacro %}

-- Macro to calculate discount percentage
{% macro calculate_discount_percentage(original_price, sale_price) %}
    CASE 
        WHEN {{ original_price }} > 0 AND {{ sale_price }} > 0 
             AND {{ original_price }} > {{ sale_price }} THEN
            ROUND((({{ original_price }} - {{ sale_price }}) / {{ original_price }}) * 100, 2)
        ELSE 0
    END
{% endmacro %}