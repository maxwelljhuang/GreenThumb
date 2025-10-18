# Deployment Documentation

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- PostgreSQL 15+
- Git

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd discovery-mvp
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Start Services with Docker Compose
```bash
docker-compose up -d
```

### 4. Run Database Migrations
```bash
make migrate
```

### 5. Start the Development Server
```bash
make run-dev
```

## Docker Deployment

### Build Docker Image
```bash
docker build -t greenthumb-discovery:latest .
```

### Run Container
```bash
docker run -p 8000:8000 --env-file .env greenthumb-discovery:latest
```

## Production Deployment

### Environment Configuration
- Set all required environment variables
- Configure database connection strings
- Set up logging and monitoring

### Database Setup
1. Create production database
2. Run migrations
3. Configure backups

### Application Deployment
- Use production WSGI server (Gunicorn)
- Set up reverse proxy (Nginx)
- Configure SSL/TLS
- Set up monitoring and alerting

## Monitoring

### Health Checks
- `/health` endpoint for liveness check
- `/health/ready` endpoint for readiness check

### Metrics
- Application metrics via Prometheus
- Database connection pool metrics
- Request latency and throughput

### Logging
- Structured JSON logging
- Log aggregation with ELK stack or similar
- Error tracking with Sentry

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery enabled
- Backup retention policy

### Disaster Recovery
- Recovery time objective (RTO): TBD
- Recovery point objective (RPO): TBD

