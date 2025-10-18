# API Documentation

## Overview

REST API for the GreenThumb Discovery MVP.

## Base URL

- Development: `http://localhost:8000`
- Production: TBD

## Authentication

TBD

## Endpoints

### Products

#### GET /api/v1/products
List all products with pagination.

#### GET /api/v1/products/{id}
Get a specific product by ID.

#### POST /api/v1/products
Create a new product.

#### PUT /api/v1/products/{id}
Update an existing product.

#### DELETE /api/v1/products/{id}
Delete a product.

### Ingestion

#### POST /api/v1/ingestion/upload
Upload a CSV file for ingestion.

#### GET /api/v1/ingestion/status/{job_id}
Check the status of an ingestion job.

## Response Formats

All responses are in JSON format.

### Success Response
```json
{
  "status": "success",
  "data": {}
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

