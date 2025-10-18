# GreenThumb Discovery MVP - Setup Guide

## 📋 Quick Reference

This project has been set up with a complete, production-ready directory structure following Python best practices.

## 🎯 First Steps

### 1. Copy Environment Variables

```bash
cp env.example .env
```

Then edit `.env` with your actual configuration values.

### 2. Choose Your Setup Method

#### Option A: Docker (Recommended)
```bash
# Start all services
make docker-up

# Run migrations
make migrate

# Access API at http://localhost:8000/docs
```

#### Option B: Local Development
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
make install-dev

# Start PostgreSQL and Redis (if not using Docker)
# Then run migrations
make migrate

# Start development server
make run-dev
```

## 📁 Directory Structure Overview

```
├── backend/                 # Python backend (main application code)
│   ├── api/                # REST API with FastAPI
│   ├── ingestion/          # Data ingestion pipeline
│   ├── models/             # Database models
│   ├── database/           # Database utilities
│   ├── search/             # Search functionality (future)
│   └── utils/              # Common utilities
│
├── data/                   # Data storage directories
│   ├── raw/                # Unprocessed CSV files
│   ├── processed/          # Validated & deduplicated data
│   ├── temp/               # Temporary processing files
│   ├── test/               # Test data samples
│   ├── embeddings/         # Vector embeddings (future)
│   └── indices/            # Search indices (future)
│
├── database/               # Database management
│   ├── migrations/         # Alembic migrations
│   ├── schemas/            # SQL schemas
│   ├── seeds/              # Seed data
│   └── backups/            # Database backups
│
├── dbt-project/            # DBT data transformations
│   ├── models/             # DBT models
│   │   ├── staging/        # Raw data transformations
│   │   └── marts/          # Business logic models
│   ├── macros/             # Reusable SQL snippets
│   ├── tests/              # Data quality tests
│   └── seeds/              # Reference data
│
├── tests/                  # Test suite (pytest)
│   ├── unit/               # Unit tests (mirrors backend/)
│   ├── integration/        # Integration tests
│   └── fixtures/           # Test fixtures
│
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── architecture/       # System architecture
│   └── deployment/         # Deployment guides
│
├── scripts/                # Utility scripts
│   ├── ingestion/          # Data ingestion scripts
│   ├── maintenance/        # Database & system maintenance
│   ├── deployment/         # Deployment automation
│   └── monitoring/         # Health checks & monitoring
│
├── frontend/               # Frontend app (Next.js) - for future use
│   └── src/                # Source code
│
├── logs/                   # Application logs
│   ├── application/        # General application logs
│   ├── ingestion/          # Data ingestion logs
│   └── error/              # Error logs
│
└── .github/                # CI/CD workflows
    └── workflows/          # GitHub Actions
```

## 🔧 Configuration Files

### Core Configuration
- `pyproject.toml` - Python project configuration
- `setup.py` / `setup.cfg` - Package setup
- `requirements.txt` - Production dependencies
- `requirements-dev.txt` - Development dependencies

### Code Quality
- `.editorconfig` - Editor settings
- `.pre-commit-config.yaml` - Pre-commit hooks
- `pytest.ini` - Test configuration
- `.coveragerc` - Coverage settings

### Docker
- `Dockerfile` - Container definition
- `docker-compose.yml` - Multi-container setup
- `.dockerignore` - Docker build exclusions

### Database
- `database/migrations/alembic.ini` - Alembic configuration
- `database/migrations/env.py` - Migration environment

### DBT
- `dbt-project/dbt_project.yml` - DBT project config
- `dbt-project/profiles.yml` - DBT connection profiles

### Logging
- `logging.conf` - Logging configuration

### Git
- `.gitignore` - Git exclusions

### Development
- `Makefile` - Common development commands

## 🚀 Common Commands

```bash
# Development
make help              # Show all available commands
make install-dev       # Install dev dependencies
make run-dev           # Start dev server with hot reload

# Testing
make test              # Run all tests with coverage
make test-fast         # Run tests without coverage

# Code Quality
make format            # Format code (black, isort)
make lint              # Run linting checks
make type-check        # Run type checking
make quality           # Run all quality checks

# Database
make migrate           # Apply migrations
make migrate-create MSG="description"  # Create new migration
make backup-db         # Backup database

# DBT
make dbt-run           # Run DBT models
make dbt-test          # Run DBT tests
make dbt-docs          # Generate DBT documentation

# Docker
make docker-up         # Start all containers
make docker-down       # Stop all containers
make docker-logs       # View container logs

# Celery (Async Tasks)
make celery-worker     # Start Celery worker
make celery-beat       # Start Celery scheduler
```

## 📝 Next Steps

### 1. Implement Core Functionality

**Data Models** (`backend/models/`)
- Create Product model
- Define database schema
- Add validation logic

**Ingestion Pipeline** (`backend/ingestion/`)
- Implement CSV parser (`parsers/`)
- Add validators (`validators/`)
- Create deduplicator (`deduplicators/`)

**API Endpoints** (`backend/api/routes/`)
- Product CRUD endpoints
- Ingestion job endpoints
- Status and monitoring endpoints

### 2. Database Setup

```bash
# Create your first migration
make migrate-create MSG="create products table"

# Edit the migration file in database/migrations/versions/

# Apply migration
make migrate
```

### 3. Create DBT Models

Edit files in `dbt-project/models/`:
- Staging models: Raw data transformations
- Mart models: Business logic

### 4. Write Tests

Create tests in `tests/` following the structure:
- `tests/unit/` - Unit tests for individual functions
- `tests/integration/` - Integration tests for workflows

### 5. Set Up CI/CD

GitHub Actions workflows are already configured in `.github/workflows/`:
- `ci.yml` - Continuous integration
- `test.yml` - Test suite

### 6. Documentation

Update documentation in `docs/`:
- API endpoints
- Architecture decisions
- Deployment procedures

## 🛠️ Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Develop with tests**
   ```bash
   # Run tests in watch mode
   make test-watch
   ```

3. **Format and check code**
   ```bash
   make format
   make quality
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

5. **Create Pull Request**

## 🎨 Code Style

- **Python**: PEP 8, enforced by Black (line length: 100)
- **Imports**: Sorted by isort
- **Type hints**: Required for all functions
- **Docstrings**: Google style

## 📊 Data Flow

```
CSV File → Parser → Validator → Deduplicator → Database
                                                    ↓
                                              DBT Transforms
                                                    ↓
                                              Analytics Tables
                                                    ↓
                                                REST API
                                                    ↓
                                              Clients/Frontend
```

## 🔮 Future Enhancements

The structure is ready for:
- Vector embeddings generation
- Semantic search implementation
- Frontend application
- Advanced analytics
- Real-time data processing

## 💡 Tips

1. **Use the Makefile**: All common tasks have make commands
2. **Docker First**: Use Docker for consistent environments
3. **Test Early**: Write tests as you develop
4. **Pre-commit Hooks**: They catch issues before commit
5. **Check Logs**: Application logs are in `logs/` directory

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Migration Issues
```bash
# Check migration status
make migrate-history

# Rollback one migration
make migrate-downgrade
```

### Test Failures
```bash
# Run specific test file
pytest tests/unit/ingestion/test_parsers.py -v

# Run with debug output
pytest tests/ -vv --log-cli-level=DEBUG
```

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [DBT Documentation](https://docs.getdbt.com/)
- [Pytest Documentation](https://docs.pytest.org/)

## ✅ Checklist

Before starting development:
- [ ] Copy `env.example` to `.env` and configure
- [ ] Install dependencies: `make install-dev`
- [ ] Start services: `make docker-up`
- [ ] Run migrations: `make migrate`
- [ ] Verify API: http://localhost:8000/docs
- [ ] Set up pre-commit hooks: `pre-commit install`

---

**You're all set! Happy coding! 🚀**

