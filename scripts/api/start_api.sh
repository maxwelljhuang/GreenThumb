#!/bin/bash
# Start FastAPI server with verification

set -e

echo "======================================"
echo "GreenThumb ML API Startup"
echo "======================================"
echo ""

# Set working directory to project root
cd "$(dirname "$0")/../.."

# Check Python version
echo "✓ Checking Python version..."
python3 --version

# Check environment variables
echo "✓ Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠ DATABASE_URL not set, using default"
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/greenthumb_dev"
fi

if [ -z "$REDIS_HOST" ]; then
    echo "⚠ REDIS_HOST not set, using localhost"
    export REDIS_HOST="localhost"
fi

# Check dependencies
echo "✓ Checking dependencies..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ FastAPI not installed. Installing requirements..."
    pip install -r requirements-api.txt
fi

# Check database connection
echo "✓ Checking database connection..."
python3 -c "
import psycopg2
from urllib.parse import urlparse
import sys

try:
    result = urlparse('$DATABASE_URL')
    conn = psycopg2.connect(
        database=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )
    conn.close()
    print('  Database connection successful')
except Exception as e:
    print(f'  ❌ Database connection failed: {e}')
    sys.exit(1)
"

# Check Redis connection
echo "✓ Checking Redis connection..."
python3 -c "
import redis
import sys

try:
    r = redis.Redis(host='$REDIS_HOST', port=6379, db=1)
    r.ping()
    print('  Redis connection successful')
except Exception as e:
    print(f'  ❌ Redis connection failed: {e}')
    sys.exit(1)
"

# Check FAISS index
echo "✓ Checking FAISS index..."
if [ -d "models/cache/faiss_index" ]; then
    echo "  FAISS index found"
else
    echo "  ⚠ FAISS index not found at models/cache/faiss_index"
    echo "  Run embedding generation first!"
fi

echo ""
echo "======================================"
echo "Starting API Server"
echo "======================================"
echo ""
echo "API will be available at: http://localhost:8000"
echo "Swagger docs: http://localhost:8000/docs"
echo "ReDoc: http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
uvicorn backend.api.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --log-level info
