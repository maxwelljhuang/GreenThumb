# 🚀 GreenThumb Quick Start

## Prerequisites
- Node.js 18+ and npm
- Python 3.9+ and pip
- PostgreSQL 14+
- Redis 6+

## 🎯 Quick Run Commands

### 1. Start Backend (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-ml.txt
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Alternative: Docker Setup
```bash
# Start everything with Docker
docker-compose up -d

# Check services
docker-compose ps
```

## ✅ Success Indicators
- Backend API accessible at http://localhost:8000
- Frontend app accessible at http://localhost:3000
- Onboarding flow works
- Feed loads with recommendations
- Search functionality works

## 🐛 Troubleshooting
```bash
# Check if ports are free
lsof -i :3000
lsof -i :8000

# Restart services
pkill -f uvicorn
pkill -f next

# Clear caches
rm -rf .next node_modules
npm install
```

That's it! Your complete GreenThumb application with full backend integration is ready to run! 🎉
