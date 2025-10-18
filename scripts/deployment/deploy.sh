#!/bin/bash
# Deployment script for GreenThumb Discovery MVP

set -e

echo "🚀 Starting deployment..."

# Environment check
if [ -z "$APP_ENV" ]; then
    echo "❌ APP_ENV not set. Please set environment variables."
    exit 1
fi

echo "Environment: $APP_ENV"

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose run --rm api alembic upgrade head

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Health check
echo "🏥 Performing health check..."
sleep 5
curl -f http://localhost:8000/health || exit 1

echo "✅ Deployment complete!"

