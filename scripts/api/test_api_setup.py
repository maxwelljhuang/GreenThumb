#!/usr/bin/env python3
"""
Test API Setup
Tests the basic FastAPI application setup.

Usage:
    python scripts/api/test_api_setup.py
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

def test_imports():
    """Test that all API modules can be imported."""
    print("=== Test 1: Module Imports ===")

    try:
        from backend.api.config import get_settings
        print("✓ config module imported")

        from backend.api.dependencies import get_db, get_search_service
        print("✓ dependencies module imported")

        from backend.api.errors import APIError, setup_error_handlers
        print("✓ errors module imported")

        from backend.api.middleware import RequestLoggingMiddleware, RequestTimingMiddleware
        print("✓ middleware module imported")

        from backend.api.routers import health_router
        print("✓ routers module imported")

        from backend.api.main import app
        print("✓ main module imported")

        print("\n✓ All imports successful\n")
        return True

    except Exception as e:
        print(f"\n✗ Import failed: {e}\n")
        return False


def test_config():
    """Test configuration loading."""
    print("=== Test 2: Configuration ===")

    try:
        from backend.api.config import get_settings

        settings = get_settings()
        print(f"✓ Settings loaded")
        print(f"  App name: {settings.app_name}")
        print(f"  Version: {settings.version}")
        print(f"  Host: {settings.host}:{settings.port}")
        print(f"  Database: {settings.database_url.split('@')[-1]}")
        print(f"  Redis: {settings.redis_host}:{settings.redis_port}")
        print(f"  Cache enabled: {settings.enable_cache}")
        print(f"  Target p95: {settings.target_p95_latency_ms}ms")

        print("\n✓ Configuration test passed\n")
        return True

    except Exception as e:
        print(f"\n✗ Configuration test failed: {e}\n")
        return False


def test_app_creation():
    """Test FastAPI app creation."""
    print("=== Test 3: App Creation ===")

    try:
        from backend.api.main import create_app

        app = create_app()
        print(f"✓ FastAPI app created")
        print(f"  Title: {app.title}")
        print(f"  Version: {app.version}")
        print(f"  Docs URL: {app.docs_url}")

        # Check routes
        routes = [route.path for route in app.routes]
        print(f"\n  Routes registered:")
        for route in sorted(routes):
            print(f"    {route}")

        # Verify key routes exist
        assert "/" in routes
        assert "/health" in routes
        assert "/status" in routes
        assert "/metrics" in routes
        assert "/docs" in routes

        print("\n✓ App creation test passed\n")
        return True

    except Exception as e:
        print(f"\n✗ App creation test failed: {e}\n")
        return False


def test_middleware():
    """Test middleware configuration."""
    print("=== Test 4: Middleware ===")

    try:
        from backend.api.main import app
        from backend.api.middleware import RequestLoggingMiddleware, RequestTimingMiddleware
        from fastapi.middleware.cors import CORSMiddleware
        from fastapi.middleware.gzip import GZipMiddleware

        # Check middleware is registered
        print("✓ Middleware registered:")

        middleware_types = [type(m.cls) for m in app.user_middleware]

        if RequestLoggingMiddleware in [m.cls for m in app.user_middleware]:
            print("  ✓ RequestLoggingMiddleware")

        if RequestTimingMiddleware in [m.cls for m in app.user_middleware]:
            print("  ✓ RequestTimingMiddleware")

        print(f"\n  Total middleware: {len(app.user_middleware)}")

        print("\n✓ Middleware test passed\n")
        return True

    except Exception as e:
        print(f"\n✗ Middleware test failed: {e}\n")
        return False


def test_error_handlers():
    """Test error handler configuration."""
    print("=== Test 5: Error Handlers ===")

    try:
        from backend.api.main import app

        # Check exception handlers are registered
        handlers_count = len(app.exception_handlers)
        print(f"✓ Exception handlers registered: {handlers_count}")

        print("\n✓ Error handlers test passed\n")
        return True

    except Exception as e:
        print(f"\n✗ Error handlers test failed: {e}\n")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("FastAPI Setup Tests")
    print("=" * 60)
    print()

    tests = [
        test_imports,
        test_config,
        test_app_creation,
        test_middleware,
        test_error_handlers,
    ]

    results = []
    for test in tests:
        results.append(test())

    print("=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    if all(results):
        print("\n✓ All tests passed! API is ready to run.")
        print("\nTo start the API:")
        print("  python -m backend.api.main")
        print("  # or")
        print("  uvicorn backend.api.main:app --reload")
        return 0
    else:
        print("\n✗ Some tests failed. Please fix errors before running the API.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
