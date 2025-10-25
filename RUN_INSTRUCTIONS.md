# GreenThumb - Complete Setup & Run Instructions

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+ and pip
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for containerized setup)

## 📋 Setup Instructions

### 1. Backend Setup

#### Option A: Local Development Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-ml.txt

# Set up environment variables
cp env.example .env
# Edit .env with your database and Redis credentials

# Set up database
# 1. Create PostgreSQL database
createdb greenthumb_db

# 2. Run database migrations
python scripts/setup_database.sh

# 3. Load initial data (optional)
python scripts/ingestion/ingest_products.py

# Start backend services
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

#### Option B: Docker Setup (Recommended)
```bash
# Navigate to project root
cd /Users/maxwellhuang/Desktop/GreenThumb

# Start all services with Docker Compose
docker-compose up -d

# This will start:
# - PostgreSQL database
# - Redis cache
# - Backend API
# - ML services
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your API base URL

# Start development server
npm run dev
# or
yarn dev
```

## 🎯 Running the Application

### 1. Start Backend Services

#### Local Development
```bash
# Terminal 1: Start PostgreSQL
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Linux

# Terminal 2: Start Redis
brew services start redis  # macOS
# or
sudo systemctl start redis  # Linux

# Terminal 3: Start Backend API
cd backend
source venv/bin/activate
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

#### Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Check services are running
docker-compose ps
```

### 2. Start Frontend

```bash
# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432 (PostgreSQL)
- **Redis**: localhost:6379

## 🔧 Configuration

### Backend Environment Variables
```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/greenthumb_db
REDIS_URL=redis://localhost:6379
ML_MODEL_PATH=./models
FAISS_INDEX_PATH=./data/indices
ENABLE_CACHE=true
CACHE_TTL_SEARCH=300
CACHE_TTL_RECOMMEND=3600
```

### Frontend Environment Variables
```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 🧪 Testing the Integration

### 1. Test Backend API
```bash
# Test health endpoint
curl http://localhost:8000/api/v1/health

# Test search endpoint
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "summer dress", "limit": 10}'

# Test recommendations endpoint
curl -X POST http://localhost:8000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "context": "feed", "limit": 10}'
```

### 2. Test Frontend
1. Open http://localhost:3000
2. Complete the onboarding flow
3. Browse the personalized feed
4. Test search functionality
5. Test user interactions (like, save, share)

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running
redis-cli ping

# Check backend logs
tail -f logs/application/app.log

# Restart backend
pkill -f uvicorn
python -m uvicorn api.main:app --reload
```

#### Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Check for port conflicts
lsof -i :3000
lsof -i :8000

# Install dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# Reset database
dropdb greenthumb_db
createdb greenthumb_db
python scripts/setup_database.sh

# Check database connection
psql greenthumb_db -c "SELECT 1;"
```

#### Redis Issues
```bash
# Check Redis connection
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

### Performance Issues

#### Backend Performance
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/health

# Monitor database performance
psql greenthumb_db -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
redis-cli info memory
```

#### Frontend Performance
```bash
# Check bundle size
npm run build
npm run analyze

# Check for memory leaks
npm run dev -- --inspect
```

## 📊 Monitoring

### Backend Monitoring
```bash
# Check API health
curl http://localhost:8000/api/v1/health

# Check system metrics
curl http://localhost:8000/api/v1/metrics

# Check cache statistics
curl http://localhost:8000/api/v1/cache/stats
```

### Frontend Monitoring
```bash
# Check build performance
npm run build

# Check bundle analysis
npm run analyze

# Check for accessibility issues
npm run lint
```

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build Docker image
docker build -t greenthumb-backend .

# Run in production
docker run -d \
  --name greenthumb-backend \
  -p 8000:8000 \
  -e DATABASE_URL=your_production_db_url \
  -e REDIS_URL=your_production_redis_url \
  greenthumb-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
vercel deploy
```

## 🔧 Development Tools

### Backend Development
```bash
# Run tests
pytest

# Run linting
flake8 api/
black api/

# Run type checking
mypy api/
```

### Frontend Development
```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run Storybook
npm run storybook

# Run linting
npm run lint
```

## 📝 Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Start database and Redis
docker-compose up -d

# Terminal 2: Start backend
cd backend && python -m uvicorn api.main:app --reload

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### 2. Make Changes
- Backend changes auto-reload with `--reload` flag
- Frontend changes auto-reload with Next.js hot reload
- Database changes require migration

### 3. Test Changes
- Backend: Check API endpoints in browser or Postman
- Frontend: Check UI in browser
- Integration: Test complete user flows

## 🎉 Success Indicators

### Backend Running Successfully
- ✅ API accessible at http://localhost:8000
- ✅ Health check returns 200 OK
- ✅ Database connection established
- ✅ Redis connection established
- ✅ ML models loaded

### Frontend Running Successfully
- ✅ App accessible at http://localhost:3000
- ✅ Onboarding flow works
- ✅ Feed loads with recommendations
- ✅ Search works
- ✅ User interactions tracked

### Full Integration Working
- ✅ User onboarding creates backend embeddings
- ✅ Search returns ML-powered results
- ✅ Recommendations are personalized
- ✅ User interactions update embeddings
- ✅ All API calls successful

## 🆘 Getting Help

### Check Logs
```bash
# Backend logs
tail -f logs/application/app.log

# Frontend logs
# Check browser console

# Database logs
tail -f /var/log/postgresql/postgresql-14-main.log

# Redis logs
tail -f /var/log/redis/redis-server.log
```

### Common Commands
```bash
# Restart everything
docker-compose down && docker-compose up -d

# Reset database
dropdb greenthumb_db && createdb greenthumb_db

# Clear all caches
redis-cli FLUSHALL

# Reinstall dependencies
rm -rf node_modules && npm install
```

The application is now ready to run with complete backend integration! 🚀
