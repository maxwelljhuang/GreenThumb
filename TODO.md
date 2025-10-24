# TODO

## Features
### Task 1
- [ ] Step 1
  - [x] Environment Setup
    - Directory
    - Packages 
  - [ ] Test Data Setup
    - Uniformly sampled cases (400)
    - Duplicate and near duplicates (150)
    - Pricing edge cases (100)
      - free, negative, missing, expensive
    - testing data quality/integrity (200)
      - missing fields, text typos, invalid URLs
    - stock/availability coherence (50)
    - spam/NSFW & near spam/NSFW (100)

- [x] Step 2: Schema Design
  - Postgres Tables
    - Products
    - Users
    - User_Embeddings
    - Ingestion Tracking/Logging
  - Indices on Filterable Attributes
  - Extensions
    - pgvector
    - pg_tgrm

- [x] Step 3: Data Validation and Quality Control
  - [x] Pydantic Structural Validation
    - quality checks
  - [x] Semantic Validation and Content Moderation
    - nsfw checks
  - [x] Quality Scoring of Data

- [x] Step 4: CSV Ingestion Pipeline
  - Uses Step 3 and Step 4

- [x] Step 5: HDBSCAN De-duplication
  - utilized fuzzy matching
  - keep highest quality duplicate
  - tank the score of low-quality duplicate, don't remove

- [x] Step 6: DBT Models
  - Post-ingestion cleaning and normalization
  - Create Calculated Fields
  - Filter based on quality scores

- [x] Step 7: Database Connection Module + Testing
  - Database Connection Script
  - Testing on Test Data Set

- [x] Step 8: Documentation, Automation, and Logging
  - [x] Automated Setup Scripts
  - Proper Logging and Documentation

## Bug Fixes

## Refactoring
