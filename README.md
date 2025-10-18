# GreenThumb Discovery MVP

A production-ready data ingestion and discovery platform designed to handle CSV data ingestion, validation, deduplication, and storage for 300k+ products, with future capabilities for embeddings and semantic search.

## 🌟 Features

- **Data Ingestion Pipeline**: Robust CSV parsing with validation and deduplication
- **REST API**: FastAPI-based API for product data access
- **Database Management**: PostgreSQL with Alembic migrations
- **Data Transformations**: DBT for data modeling and transformations
- **Async Task Processing**: Celery for background jobs
- **Production Ready**: Docker containerization, comprehensive testing, CI/CD
- **Future Ready**: Structured for vector embeddings and semantic search

## 📋 Requirements

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)
- Node.js 18+ (for frontend, optional)

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd discovery-mvp

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
make docker-up

# Run database migrations
make migrate

# Access the API
open http://localhost:8000/docs
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
make install-dev

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
make migrate

# Start the development server
make run-dev

# In another terminal, start Celery worker
make celery-worker
```

## 📁 Project Structure

```
discovery-mvp/
├── backend/                 # Python backend package
│   ├── ingestion/          # Data ingestion logic
│   │   ├── parsers/        # CSV and data parsers
│   │   ├── validators/     # Data validation
│   │   └── deduplicators/  # Deduplication logic
│   ├── models/             # Database models
│   ├── database/           # Database connection & operations
│   ├── api/                # REST API endpoints
│   │   ├── routes/         # API route handlers
│   │   └── schemas/        # Pydantic schemas
│   ├── search/             # Search functionality (future)
│   │   ├── embeddings/     # Vector embeddings
│   │   └── indices/        # Search indices
│   └── utils/              # Utility functions
├── data/                   # Data directories
│   ├── raw/                # Raw CSV files
│   ├── processed/          # Processed data
│   ├── temp/               # Temporary files
│   ├── test/               # Test data
│   ├── embeddings/         # Vector embeddings (future)
│   └── indices/            # Search indices (future)
├── database/               # Database management
│   ├── migrations/         # Alembic migrations
│   ├── schemas/            # Database schemas
│   ├── seeds/              # Seed data
│   └── backups/            # Database backups
├── dbt-project/            # DBT transformations
│   ├── models/             # DBT models
│   │   ├── staging/        # Staging models
│   │   └── marts/          # Business logic models
│   ├── macros/             # DBT macros
│   ├── tests/              # DBT tests
│   └── seeds/              # DBT seed data
├── tests/                  # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── fixtures/           # Test fixtures
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   ├── architecture/       # Architecture docs
│   └── deployment/         # Deployment guides
├── scripts/                # Utility scripts
│   ├── ingestion/          # Ingestion scripts
│   ├── maintenance/        # Maintenance scripts
│   ├── deployment/         # Deployment scripts
│   └── monitoring/         # Monitoring scripts
├── frontend/               # Frontend application (future)
│   └── src/                # React/Next.js source
├── logs/                   # Application logs
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Docker services configuration
├── Dockerfile              # Docker image definition
├── Makefile               # Development commands
└── pyproject.toml         # Python project configuration
```

## 🔧 Development

### Common Commands

```bash
# Install dependencies
make install-dev

# Run tests
make test

# Run linting
make lint

# Format code
make format

# Type check
make type-check

# Run all quality checks
make quality

# Start development server
make run-dev

# Database migrations
make migrate
make migrate-create MSG="description"

# Docker commands
make docker-up
make docker-down
make docker-logs

# DBT commands
make dbt-run
make dbt-test
make dbt-docs
```

### Running Tests

```bash
# Run all tests with coverage
make test

# Run specific test file
pytest tests/unit/ingestion/test_parsers.py -v

# Run tests with specific markers
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m "not slow"    # Skip slow tests

# Run tests in watch mode
make test-watch
```

### Code Quality

This project uses:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking
- **pytest** for testing
- **pre-commit** hooks for quality enforcement

```bash
# Set up pre-commit hooks
pre-commit install

# Run pre-commit on all files
make pre-commit
```

## 📊 Database

### Migrations

```bash
# Create a new migration
make migrate-create MSG="add products table"

# Apply migrations
make migrate

# Rollback one migration
make migrate-downgrade

# View migration history
make migrate-history
```

### DBT Transformations

```bash
# Run DBT models
make dbt-run

# Run DBT tests
make dbt-test

# Generate and view DBT docs
make dbt-docs
```

## 🐳 Docker

### Services

- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **api**: FastAPI application (port 8000)
- **celery-worker**: Celery worker for async tasks
- **celery-beat**: Celery beat for scheduled tasks

### Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Access API container shell
docker-compose exec api /bin/bash

# Access database
docker-compose exec postgres psql -U postgres -d greenthumb_dev

# Stop all services
docker-compose down

# Clean up everything
docker-compose down -v --rmi all
```

## 📈 API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Testing

The project follows pytest conventions with comprehensive test coverage:

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=backend --cov-report=html

# Run specific test types
pytest -m unit
pytest -m integration
pytest -m "not slow"

# Run in parallel
pytest -n auto
```

## 📝 Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Application
APP_ENV=development
DEBUG=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# API
API_HOST=0.0.0.0
API_PORT=8000

# Redis
REDIS_URL=redis://localhost:6379/0
```

## 🚢 Deployment

See [docs/deployment/README.md](docs/deployment/README.md) for detailed deployment instructions.

### Production Checklist

- [ ] Set production environment variables
- [ ] Configure database connection
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Review security settings

## 📚 Documentation

- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/README.md)
- [Deployment Guide](docs/deployment/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run quality checks: `make quality`
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔮 Future Enhancements

- [ ] Vector embeddings generation
- [ ] Semantic search capabilities
- [ ] Frontend application
- [ ] API authentication & authorization
- [ ] Advanced analytics dashboard
- [ ] Real-time data ingestion
- [ ] Multi-source data ingestion

## 📞 Support

For questions and support, please open an issue in the repository.

---

Built with ❤️ by the GreenThumb Team

