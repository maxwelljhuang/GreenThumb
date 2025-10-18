# Architecture Documentation

## System Overview

The GreenThumb Discovery MVP is a data ingestion and discovery platform designed to handle 300k+ product records with validation, deduplication, and future semantic search capabilities.

## High-Level Architecture

```
┌─────────────┐
│   CSV Data  │
└──────┬──────┘
       │
       v
┌─────────────────────────────────┐
│    Ingestion Pipeline           │
│  - Parser                       │
│  - Validator                    │
│  - Deduplicator                 │
└──────┬──────────────────────────┘
       │
       v
┌─────────────────────────────────┐
│    PostgreSQL Database          │
└──────┬──────────────────────────┘
       │
       v
┌─────────────────────────────────┐
│    DBT Transformations          │
│  - Staging Models               │
│  - Mart Models                  │
└──────┬──────────────────────────┘
       │
       v
┌─────────────────────────────────┐
│    REST API (FastAPI)           │
└──────┬──────────────────────────┘
       │
       v
┌─────────────────────────────────┐
│    Client Applications          │
└─────────────────────────────────┘
```

## Components

### Backend Services
- **Ingestion Service**: Handles CSV parsing, validation, and deduplication
- **API Service**: REST API for data access
- **Search Service**: Future semantic search capabilities

### Database Layer
- **PostgreSQL**: Primary data store
- **Alembic**: Database migrations
- **DBT**: Data transformations

### Future Components
- **Embeddings Service**: Generate vector embeddings
- **Search Index**: Vector similarity search

## Design Principles

1. **Domain-Driven Design**: Clear separation of concerns
2. **Scalability**: Handle 300k+ records efficiently
3. **Data Quality**: Validation and deduplication at ingestion
4. **Extensibility**: Prepared for future search capabilities

## Key Design Decisions

### Data Validation
- Schema validation using Pydantic
- Business rule validation in validators module
- Duplicate detection using configurable strategies

### Database Schema
- Normalized product data model
- Audit fields (created_at, updated_at)
- Soft delete capability

### API Design
- RESTful principles
- Versioned endpoints (/api/v1/)
- Pagination for list endpoints

