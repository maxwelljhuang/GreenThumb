#!/bin/bash

# GreenThumb Discovery Pipeline - Quick Setup Script
# This script provides a quick setup for Unix-like systems (Linux/macOS)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  GreenThumb Discovery Pipeline - Quick Setup  ${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

# Check if running on supported OS
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    print_success "Operating system supported: $OSTYPE"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Check Python version
print_step "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if [[ $(echo "$PYTHON_VERSION >= 3.8" | bc -l) -eq 1 ]]; then
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3.8+ required, found $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python 3 not found"
    exit 1
fi

# Check PostgreSQL
print_step "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    print_success "PostgreSQL client found"
else
    print_error "PostgreSQL not found"
    echo "Please install PostgreSQL:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install postgresql"
    else
        echo "  sudo apt-get install postgresql postgresql-contrib"
    fi
    exit 1
fi

# Create virtual environment
print_step "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_success "Virtual environment activated"

# Upgrade pip
print_step "Upgrading pip..."
pip install --upgrade pip --quiet
print_success "pip upgraded"

# Install dependencies
print_step "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
    print_success "Dependencies installed from requirements.txt"
else
    # Install core dependencies
    pip install psycopg2-binary sqlalchemy pandas numpy pydantic --quiet
    pip install python-dotenv click tqdm pyyaml tabulate --quiet
    print_success "Core dependencies installed"
fi

# Create directory structure
print_step "Creating directory structure..."
directories=(
    "backend/ingestion"
    "backend/api"
    "backend/models"
    "backend/utils"
    "scripts/automation"
    "scripts/monitoring"
    "scripts/database"
    "scripts/maintenance"
    "database/migrations"
    "database/backups"
    "logs/application"
    "logs/ingestion"
    "logs/transformation"
    "logs/monitoring"
    "logs/automation"
    "logs/error"
    "reports"
    "data/raw"
    "data/processed"
    "config"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
done
print_success "Directory structure created"

# Create .env file if it doesn't exist
print_step "Creating configuration files..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# GreenThumb Discovery Pipeline Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/greenthumb_dev
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

INGESTION_CHUNK_SIZE=1000
QUALITY_THRESHOLD=0.3
ENABLE_DEDUP=true
MAX_RETRIES=3

MONITORING_INTERVAL=30
MIN_QUALITY_SCORE=0.5
MIN_SUCCESS_RATE=0.8

APP_ENV=development
LOG_LEVEL=INFO
EOF
    print_success ".env file created"
else
    print_info ".env file already exists"
fi

# Database setup
print_step "Setting up PostgreSQL database..."

# Check if database exists
DB_NAME="greenthumb_dev"
DB_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    print_info "Database '$DB_NAME' already exists"
else
    # Create database
    createdb -U postgres $DB_NAME 2>/dev/null || {
        print_error "Failed to create database. Please run:"
        echo "  createdb -U postgres $DB_NAME"
    }
    print_success "Database '$DB_NAME' created"
fi

# Install pgvector extension
print_step "Installing PostgreSQL extensions..."
psql -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null || {
    print_info "pgvector extension not available"
}

psql -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null
psql -U postgres -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>/dev/null
print_success "PostgreSQL extensions configured"

# Create schemas
psql -U postgres -d $DB_NAME << EOF 2>/dev/null
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS marts;
CREATE SCHEMA IF NOT EXISTS analytics;
EOF
print_success "Database schemas created"

# Initialize database tables
print_step "Initializing database tables..."
if [ -f "scripts/maintenance/init_db.py" ]; then
    python scripts/maintenance/init_db.py
    print_success "Database tables initialized"
else
    print_info "init_db.py not found, skipping table initialization"
fi

# Install DBT
print_step "Installing DBT..."
pip install dbt-postgres --quiet 2>/dev/null || {
    print_info "DBT installation skipped"
}

# Final checks
print_step "Running verification..."
if [ -f "scripts/verify_system.py" ]; then
    python scripts/verify_system.py
fi

# Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}         Setup Completed Successfully!          ${NC}"
echo -e "${GREEN}================================================${NC}\n"

echo "Next steps:"
echo "1. Activate virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Test database connection:"
echo "   python scripts/database/connection_manager.py --test"
echo ""
echo "3. Run your first ingestion:"
echo "   make ingest FILE=sample.csv MERCHANT_ID=1001"
echo ""
echo "4. Monitor the pipeline:"
echo "   make monitor"
echo ""
echo "For detailed instructions, see SETUP.md"