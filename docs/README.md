# GreenThumb Discovery MVP Documentation

Welcome to the GreenThumb Discovery MVP documentation.

## Documentation Structure

- **[API Documentation](./api/)** - REST API endpoints and schemas
- **[Architecture](./architecture/)** - System design and architecture decisions
- **[Deployment](./deployment/)** - Deployment guides and infrastructure setup

## Quick Links

- [Getting Started](#)
- [Development Guide](#)
- [Contributing Guidelines](#)
- [API Reference](./api/)

## Overview

This project handles CSV data ingestion, validation, deduplication, and storage for 300k products, with future components for embeddings and search.

## Key Features

- CSV data ingestion pipeline
- Data validation and quality checks
- Deduplication logic
- PostgreSQL storage
- REST API for data access
- Future: Vector embeddings and semantic search

## Technology Stack

- **Backend**: Python 3.11+, FastAPI
- **Database**: PostgreSQL, Alembic migrations
- **Data Transform**: DBT
- **Testing**: Pytest
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

