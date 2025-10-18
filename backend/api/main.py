"""
FastAPI application main entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging.config
import os

# Configure logging
if os.path.exists("logging.conf"):
    logging.config.fileConfig("logging.conf")

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="GreenThumb Discovery MVP",
    description="Data ingestion and discovery platform for product data",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "GreenThumb Discovery MVP API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/health/ready")
async def readiness_check():
    """Readiness check endpoint."""
    # Add checks for database, redis, etc.
    return {"status": "ready"}


# Include routers here
# from backend.api.routes import products, ingestion
# app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
# app.include_router(ingestion.router, prefix="/api/v1/ingestion", tags=["ingestion"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

