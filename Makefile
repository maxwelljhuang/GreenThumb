.PHONY: help install install-dev clean test lint format type-check run run-dev migrate migrate-create docker-up docker-down docker-build

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RESET := \033[0m

help: ## Show this help message
	@echo '$(BLUE)Available commands:$(RESET)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

install: ## Install production dependencies
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	pip install -r requirements-dev.txt
	pre-commit install

clean: ## Clean up cache and temporary files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.log" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	rm -f .coverage
	rm -rf build/ dist/

test: ## Run tests with coverage
	pytest tests/ -v --cov=backend --cov-report=html --cov-report=term

test-fast: ## Run tests without coverage
	pytest tests/ -v

test-watch: ## Run tests in watch mode
	pytest-watch tests/

lint: ## Run linting checks
	flake8 backend tests
	pylint backend

format: ## Format code with black and isort
	black backend tests
	isort backend tests

format-check: ## Check code formatting
	black --check backend tests
	isort --check-only backend tests

type-check: ## Run type checking with mypy
	mypy backend

quality: format-check lint type-check test ## Run all quality checks

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

run: ## Run the application in production mode
	uvicorn backend.api.main:app --host 0.0.0.0 --port 8000

run-dev: ## Run the application in development mode with auto-reload
	uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload

migrate: ## Run database migrations
	cd database/migrations && alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	cd database/migrations && alembic revision --autogenerate -m "$(MSG)"

migrate-downgrade: ## Downgrade database by one revision
	cd database/migrations && alembic downgrade -1

migrate-history: ## Show migration history
	cd database/migrations && alembic history

dbt-run: ## Run DBT models
	cd dbt-project && dbt run

dbt-test: ## Run DBT tests
	cd dbt-project && dbt test

dbt-docs: ## Generate and serve DBT documentation
	cd dbt-project && dbt docs generate && dbt docs serve

docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## Show Docker container logs
	docker-compose logs -f

docker-shell: ## Open a shell in the API container
	docker-compose exec api /bin/bash

docker-db-shell: ## Open a PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d greenthumb_dev

docker-clean: ## Remove Docker containers, volumes, and images
	docker-compose down -v --rmi all

celery-worker: ## Start Celery worker
	celery -A backend.tasks.celery_app worker --loglevel=info

celery-beat: ## Start Celery beat scheduler
	celery -A backend.tasks.celery_app beat --loglevel=info

celery-flower: ## Start Celery Flower monitoring
	celery -A backend.tasks.celery_app flower --port=5555

setup-dev: install-dev migrate ## Set up development environment
	@echo "$(GREEN)Development environment setup complete!$(RESET)"

init-db: ## Initialize database with seed data
	python scripts/maintenance/init_db.py

backup-db: ## Backup database
	@mkdir -p database/backups
	docker-compose exec -T postgres pg_dump -U postgres greenthumb_dev > database/backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backed up successfully!$(RESET)"

restore-db: ## Restore database from latest backup (usage: make restore-db FILE=backup_file.sql)
	docker-compose exec -T postgres psql -U postgres greenthumb_dev < $(FILE)

logs-app: ## Show application logs
	tail -f logs/application/*.log

logs-error: ## Show error logs
	tail -f logs/error/*.log

