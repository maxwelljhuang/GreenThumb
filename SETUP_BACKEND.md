# 🚀 GreenThumb Backend Setup

## Quick Fix for Your Current Issue

The requirements files are in the **root directory**, not in the backend folder. Here's how to fix it:

### Option 1: Use Root Directory Requirements (Recommended)
```bash
# Navigate to project root
cd /Users/maxwellhuang/Desktop/GreenThumb

# Create virtual environment
python -m venv backend/venv
source backend/venv/bin/activate  # Windows: backend\venv\Scripts\activate

# Install from root requirements
pip install -r requirements.txt
pip install -r requirements-ml.txt
pip install -r requirements-api.txt
```

### Option 2: Copy Requirements to Backend
```bash
# Copy requirements to backend directory
cp requirements.txt backend/
cp requirements-ml.txt backend/
cp requirements-api.txt backend/

# Then install from backend directory
cd backend
pip install -r requirements.txt
pip install -r requirements-ml.txt
pip install -r requirements-api.txt
```

## 🎯 Complete Backend Setup

### 1. Environment Setup
```bash
# Navigate to project root
cd /Users/maxwellhuang/Desktop/GreenThumb

# Create and activate virtual environment
python -m venv backend/venv
source backend/venv/bin/activate  # Windows: backend\venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip
```

### 2. Install Dependencies
```bash
# Install all requirements
pip install -r requirements.txt
pip install -r requirements-ml.txt
pip install -r requirements-api.txt
pip install -r requirements-dev.txt
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
# DATABASE_URL=postgresql://user:password@localhost:5432/greenthumb_db
# REDIS_URL=redis://localhost:6379
# ML_MODEL_PATH=./models
```

### 4. Database Setup
```bash
# Install PostgreSQL (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb greenthumb_db

# Run database setup
python scripts/setup_database.sh
```

### 5. Start Backend
```bash
# Start the API server
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Alternative: Docker Setup (Easier)

### 1. Start All Services with Docker
```bash
# Navigate to project root
cd /Users/maxwellhuang/Desktop/GreenThumb

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps
```

### 2. Access Services
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## ✅ Verify Setup

### 1. Check Backend Health
```bash
curl http://localhost:8000/api/v1/health
```

### 2. Check API Documentation
Open http://localhost:8000/docs in your browser

### 3. Test API Endpoints
```bash
# Test search
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "summer dress", "limit": 10}'

# Test recommendations
curl -X POST http://localhost:8000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "context": "feed", "limit": 10}'
```

## 🐛 Troubleshooting

### If pip install fails:
```bash
# Update pip
pip install --upgrade pip

# Install with specific versions
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
```

### If database connection fails:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### If ML models fail to load:
```bash
# Download models
python scripts/ml/download_models.py

# Check model files
ls -la models/
```

## 🎉 Success Indicators

You'll know the backend is working when:
- ✅ API accessible at http://localhost:8000
- ✅ Health check returns 200 OK
- ✅ Database connection established
- ✅ Redis connection established
- ✅ ML models loaded successfully

## 🚀 Next Steps

Once the backend is running:
1. Start the frontend: `cd frontend && npm run dev`
2. Access the app at http://localhost:3000
3. Complete the onboarding flow
4. Test the personalized feed

Your complete GreenThumb application is ready! 🎉
