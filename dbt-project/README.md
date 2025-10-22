# GreenThumb Discovery - DBT Models

## Overview

This DBT project transforms raw product data from the ingestion pipeline into analytics-ready tables for the GreenThumb Discovery platform.

## Model Architecture

### Layer 1: Staging (`models/staging/`)
- **Purpose**: Initial cleaning and type casting of raw data
- **Materialization**: Views
- **Models**:
  - `stg_products`: Cleans raw product data, adds quality flags
  - `stg_ingestion_logs`: Prepares ingestion logs for analysis

### Layer 2: Intermediate (`models/staging/`)
- **Purpose**: Business logic and enrichment
- **Materialization**: Views
- **Models**:
  - `int_products_enriched`: Adds calculated fields like price bands, quality tiers, freshness status

### Layer 3: Marts (`models/marts/`)
- **Purpose**: Final tables for serving and analysis
- **Materialization**: Tables
- **Models**:

#### Products (`models/marts/products/`)
- `product_catalog`: Main product catalog with clean, deduplicated products
- `price_analytics`: Pricing insights and patterns

#### Quality (`models/marts/quality/`)
- `product_quality_metrics`: Quality metrics by merchant, brand, category
- `ingestion_monitoring`: Pipeline performance monitoring
- `data_freshness_monitoring`: Identifies stale products for removal

## Key Features

### Quality Scoring
Products are scored 0-1 based on:
- Product name completeness (15%)
- Description quality (10%)
- Valid pricing (15%)
- Image availability (15%)
- Brand information (10%)
- Category data (5%)
- Additional attributes (30%)

### Price Bands
Products are categorized into price bands:
- **Budget**: ≤ £25
- **Mid-range**: £26-100
- **Premium**: £101-500
- **Luxury**: > £500

### Freshness Tracking
- **Fresh**: Updated within 7 days
- **Recent**: Updated within 30 days
- **Aging**: Updated within 90 days
- **Stale**: Updated within 180 days
- **Very Stale**: Not updated for 180+ days

### Deduplication
The pipeline ensures one canonical record per product by:
1. Filtering duplicates (keeping highest quality version)
2. Removing NSFW content
3. Applying quality thresholds

## Running the Models

### Prerequisites
```bash
# Install DBT
pip install dbt-postgres

# Configure connection (edit profiles.yml)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=greenthumb_dev
```

### Commands
```bash
# Navigate to DBT project
cd dbt-project

# Install dependencies
dbt deps

# Test connection
dbt debug

# Run all models
dbt run

# Run specific models
dbt run --select stg_products
dbt run --select product_catalog
dbt run --select +product_catalog  # Run model and dependencies

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve

# Run seeds
dbt seed

# Full refresh (rebuild all tables)
dbt run --full-refresh
```

### Development Workflow
```bash
# 1. Make changes to models

# 2. Test your specific model
dbt run --select my_model

# 3. Run tests
dbt test --select my_model

# 4. Check data quality
dbt run --select product_quality_metrics

# 5. Generate docs
dbt docs generate
```

## Model Dependencies

```
Raw Tables
    ↓
Staging Models
    ↓
Intermediate Models
    ↓
Mart Models
```

## Variables

Configured in `dbt_project.yml`:
- `min_quality_score`: 0.3 (minimum quality for catalog)
- `high_quality_threshold`: 0.7 (high quality designation)
- `price_band_*_max`: Price band thresholds
- `stale_threshold_days`: 90 (marks as stale)
- `very_stale_threshold_days`: 180 (marks for removal)

## Testing

Tests are defined in `schema.yml` files and `tests/` directory:
- **Uniqueness tests**: Ensure no duplicates
- **Not null tests**: Required fields populated
- **Accepted values**: Enums are valid
- **Custom tests**: Business logic validation

## Performance Considerations

1. **Materialization Strategy**:
   - Staging: Views (fast iteration)
   - Intermediate: Views (no storage overhead)
   - Marts: Tables (query performance)

2. **Indexes**: Product catalog has indexes on:
   - product_id (unique)
   - merchant_id, merchant_product_id
   - brand_name
   - category_name
   - price_band
   - quality_tier

3. **Incremental Updates**: Consider converting high-volume models to incremental in production

## Monitoring

Key metrics to monitor:
- Product quality distribution
- Freshness percentages
- Ingestion success rates
- Duplicate detection rates
- Price band distributions

Access monitoring dashboards:
```sql
-- Quality overview
SELECT * FROM marts.product_quality_metrics;

-- Freshness check
SELECT * FROM marts.data_freshness_monitoring;

-- Pipeline performance
SELECT * FROM marts.ingestion_monitoring;
```

## Future Enhancements

- [ ] Add incremental models for large tables
- [ ] Implement slowly changing dimensions for products
- [ ] Add data vault modeling for history tracking
- [ ] Create materialized views for heavy queries
- [ ] Add real-time streaming models