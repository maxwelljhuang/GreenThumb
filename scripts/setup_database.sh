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

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}GreenThumb Database Setup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
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
echo -e "${YELLOW}Step 2: Starting PostgreSQL container...${NC}"
docker run -d \
    --name ${DB_CONTAINER_NAME} \
    -e POSTGRES_USER=${DB_USER} \
    -e POSTGRES_PASSWORD=${DB_PASSWORD} \
    -e POSTGRES_DB=${DB_NAME} \
    -p ${DB_PORT}:5432 \
    -v greenthumb_postgres_data:/var/lib/postgresql/data \
    postgres:15-alpine

echo -e "${GREEN}  ✓ PostgreSQL container started${NC}"
echo ""

echo -e "${YELLOW}Step 3: Waiting for PostgreSQL to be ready...${NC}"
# Wait for PostgreSQL to be ready
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec ${DB_CONTAINER_NAME} pg_isready -U ${DB_USER} > /dev/null 2>&1; then
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
sleep 2

echo -e "${YELLOW}Step 4: Installing required PostgreSQL extensions...${NC}"
# Install extensions
docker exec ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /dev/null
echo -e "${GREEN}  ✓ uuid-ossp extension installed${NC}"

docker exec ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";" > /dev/null
echo -e "${GREEN}  ✓ pg_trgm extension installed${NC}"

docker exec ${DB_CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS \"pgvector\";" > /dev/null 2>&1 || {
    echo -e "${YELLOW}  ⚠ pgvector extension not available (this is optional for now)${NC}"
}
echo ""

echo -e "${YELLOW}Step 5: Running Alembic migrations...${NC}"
# Go to project root and run migrations
cd "$(dirname "$0")/.."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

# Run migrations
cd database/migrations
alembic upgrade head

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✓ Migrations completed successfully${NC}"
else
    echo -e "${RED}  ✗ Migration failed${NC}"
    exit 1
fi

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
