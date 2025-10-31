"""
API Routers
FastAPI route handlers for different endpoints.
"""

from .health import router as health_router
from .search import router as search_router
from .recommend import router as recommend_router
from .feedback import router as feedback_router
from .admin import router as admin_router

__all__ = [
    'health_router',
    'search_router',
    'recommend_router',
    'feedback_router',
    'admin_router',
]
