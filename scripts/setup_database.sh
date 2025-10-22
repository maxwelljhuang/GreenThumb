#!/bin/bash

# GreenThumb Database Setup Script
# This script sets up PostgreSQL using Docker and runs migrations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_CONTAINER_NAME="greenthumb-postgres"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="greenthumb_dev"
DB_PORT="5432"

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}GreenThumb Database Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if alembic is installed
if ! command -v alembic &> /dev/null; then
    echo -e "${YELLOW}Alembic not found. Installing...${NC}"
    pip install alembic sqlalchemy psycopg2-binary
fi

echo -e "${YELLOW}Step 1: Stopping any existing PostgreSQL containers...${NC}"
# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=${DB_CONTAINER_NAME})" ]; then
    echo "  - Found existing container: ${DB_CONTAINER_NAME}"
    docker stop ${DB_CONTAINER_NAME} 2>/dev/null || true
    docker rm ${DB_CONTAINER_NAME} 2>/dev/null || true
    echo -e "${GREEN}  ✓ Stopped and removed existing container${NC}"
else
    echo -e "${GREEN}  ✓ No existing container found${NC}"
fi

# Also try to stop any container using port 5432
CONTAINER_ON_PORT=$(docker ps -q --filter "publish=${DB_PORT}")
if [ ! -z "$CONTAINER_ON_PORT" ]; then
    echo "  - Found container using port ${DB_PORT}: $CONTAINER_ON_PORT"
    docker stop $CONTAINER_ON_PORT 2>/dev/null || true
    echo -e "${GREEN}  ✓ Stopped container using port ${DB_PORT}${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Starting PostgreSQL container with pgvector...${NC}"

# Use pgvector image for vector support
docker run -d \
    --name ${DB_CONTAINER_NAME} \
    -e POSTGRES_USER=${DB_USER} \
    -e POSTGRES_PASSWORD=${DB_PASSWORD} \
    -e POSTGRES_DB=${DB_NAME} \
    -p ${DB_PORT}:5432 \
    -v greenthumb_postgres_data:/var/lib/postgresql/data \
    pgvector/pgvector:pg15

echo -e "${GREEN}  ✓ PostgreSQL container started${NC}"
echo ""

echo -e "${YELLOW}Step 3: Waiting for PostgreSQL to be ready...${NC}"
# Wait for PostgreSQL to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec ${DB_CONTAINER_NAME} pg_isready -U ${DB_USER} -d ${DB_NAME} > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ PostgreSQL is ready!${NC}"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 1

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo ""
        echo -e "${RED}Error: PostgreSQL did not become ready in time.${NC}"
        echo "Container logs:"
        docker logs ${DB_CONTAINER_NAME}
        exit 1
    fi
done
echo ""

# Additional wait to ensure PostgreSQL is fully initialized
sleep 3

echo -e "${YELLOW}Step 4: Installing required PostgreSQL extensions...${NC}"

# Install extensions with better error handling
extensions=("uuid-ossp" "pg_trgm" "vector")
for ext in "${extensions[@]}"; do
    if docker exec ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS \"${ext}\";" 2>/dev/null; then
        echo -e "${GREEN}  ✓ ${ext} extension installed${NC}"
    else
        if [ "$ext" = "vector" ]; then
            echo -e "${YELLOW}  ⚠ ${ext} extension not available (optional)${NC}"
        else
            echo -e "${RED}  ✗ Failed to install ${ext} extension${NC}"
        fi
    fi
done
echo ""

echo -e "${YELLOW}Step 5: Running Alembic migrations...${NC}"

# Set database URL
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

# Navigate to migrations directory
cd "${PROJECT_ROOT}/database/migrations" || {
    echo -e "${RED}Error: Could not find migrations directory${NC}"
    echo "Expected path: ${PROJECT_ROOT}/database/migrations"
    exit 1
}

# Check if alembic.ini exists
if [ ! -f "alembic.ini" ]; then
    echo -e "${RED}Error: alembic.ini not found in $(pwd)${NC}"
    exit 1
fi

# Run migrations
if alembic upgrade head; then
    echo -e "${GREEN}  ✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}  ✗ Migration failed${NC}"
    echo "Attempting to show error details:"
    docker exec ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "\dt"
    exit 1
fi

# Return to project root
cd "${PROJECT_ROOT}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Database setup completed!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Connection details:"
echo -e "  Host: localhost"
echo -e "  Port: ${DB_PORT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  User: ${DB_USER}"
echo -e "  Password: ${DB_PASSWORD}"
echo ""
echo -e "Connection string:"
echo -e "  ${BLUE}postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}${NC}"
echo ""
echo -e "To verify the setup, run:"
echo -e "  ${BLUE}python scripts/verify_database.py${NC}"
echo ""
echo -e "To connect to the database:"
echo -e "  ${BLUE}docker exec -it ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}${NC}"
echo ""