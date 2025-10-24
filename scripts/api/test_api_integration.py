#!/usr/bin/env python
"""
API Integration Test Script
Tests all FastAPI endpoints with realistic data.
"""

import sys
import time
import requests
from typing import Dict, Any, Optional
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class Colors:
    """Terminal colors for output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class APITester:
    """API integration tester."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize API tester.

        Args:
            base_url: Base URL of the API
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.passed = 0
        self.failed = 0
        self.warnings = 0

    def print_header(self, text: str):
        """Print section header."""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")

    def print_success(self, text: str):
        """Print success message."""
        print(f"{Colors.GREEN}✓ {text}{Colors.END}")
        self.passed += 1

    def print_error(self, text: str):
        """Print error message."""
        print(f"{Colors.RED}✗ {text}{Colors.END}")
        self.failed += 1

    def print_warning(self, text: str):
        """Print warning message."""
        print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")
        self.warnings += 1

    def test_health_endpoints(self):
        """Test health check endpoints."""
        self.print_header("Testing Health Endpoints")

        # Test /health
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.print_success("GET /health - Returns healthy status")
                else:
                    self.print_error(f"GET /health - Unexpected status: {data.get('status')}")
            else:
                self.print_error(f"GET /health - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"GET /health - Exception: {e}")

        # Test /status
        try:
            response = self.session.get(f"{self.base_url}/status")
            if response.status_code == 200:
                data = response.json()
                if "database" in data and "redis" in data:
                    self.print_success("GET /status - Returns detailed status")

                    # Check component status
                    if data["database"].get("status") == "healthy":
                        self.print_success("  Database connection healthy")
                    else:
                        self.print_warning(f"  Database status: {data['database'].get('status')}")

                    if data["redis"].get("status") == "healthy":
                        self.print_success("  Redis connection healthy")
                    else:
                        self.print_warning(f"  Redis status: {data['redis'].get('status')}")
                else:
                    self.print_error("GET /status - Missing required fields")
            else:
                self.print_error(f"GET /status - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"GET /status - Exception: {e}")

        # Test /metrics
        try:
            response = self.session.get(f"{self.base_url}/metrics")
            if response.status_code == 200:
                data = response.json()
                if "latency" in data:
                    self.print_success("GET /metrics - Returns latency metrics")
                    latency = data["latency"]
                    p95 = latency.get("p95_ms", 0)
                    if p95 < 150:
                        self.print_success(f"  p95 latency: {p95:.2f}ms (within target)")
                    else:
                        self.print_warning(f"  p95 latency: {p95:.2f}ms (exceeds 150ms target)")
                else:
                    self.print_error("GET /metrics - Missing latency data")
            else:
                self.print_error(f"GET /metrics - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"GET /metrics - Exception: {e}")

        # Test /cache/stats
        try:
            response = self.session.get(f"{self.base_url}/cache/stats")
            if response.status_code == 200:
                data = response.json()
                if "cache" in data:
                    self.print_success("GET /cache/stats - Returns cache statistics")
                    cache = data["cache"]
                    hit_rate = cache.get("hit_rate_percent", 0)
                    self.print_success(f"  Cache hit rate: {hit_rate:.1f}%")
                else:
                    self.print_error("GET /cache/stats - Missing cache data")
            else:
                self.print_error(f"GET /cache/stats - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"GET /cache/stats - Exception: {e}")

        # Test /performance
        try:
            response = self.session.get(f"{self.base_url}/performance")
            if response.status_code == 200:
                data = response.json()
                if "performance" in data:
                    self.print_success("GET /performance - Returns performance summary")
                    perf = data["performance"]
                    health = perf.get("health", "unknown")
                    self.print_success(f"  API health: {health}")
                else:
                    self.print_error("GET /performance - Missing performance data")
            else:
                self.print_error(f"GET /performance - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"GET /performance - Exception: {e}")

    def test_search_endpoint(self):
        """Test search endpoint."""
        self.print_header("Testing Search Endpoint")

        # Test basic search
        search_request = {
            "query": "summer dresses",
            "limit": 10
        }

        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/v1/search",
                json=search_request
            )
            duration_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()

                # Validate response structure
                required_fields = ["results", "total", "query", "search_time_ms", "total_time_ms"]
                if all(field in data for field in required_fields):
                    self.print_success(f"POST /api/v1/search - Basic search successful ({duration_ms:.2f}ms)")

                    # Check results
                    results = data["results"]
                    self.print_success(f"  Returned {len(results)} results")

                    # Validate result structure
                    if results and len(results) > 0:
                        result = results[0]
                        required_result_fields = ["product_id", "title", "price", "similarity", "rank"]
                        if all(field in result for field in required_result_fields):
                            self.print_success("  Result structure valid")
                        else:
                            self.print_error(f"  Missing result fields: {required_result_fields}")

                    # Check performance
                    if data["total_time_ms"] < 150:
                        self.print_success(f"  Performance: {data['total_time_ms']:.2f}ms (within target)")
                    else:
                        self.print_warning(f"  Performance: {data['total_time_ms']:.2f}ms (exceeds target)")
                else:
                    self.print_error(f"POST /api/v1/search - Missing fields: {required_fields}")
            else:
                self.print_error(f"POST /api/v1/search - Status code: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            self.print_error(f"POST /api/v1/search - Exception: {e}")

        # Test search with filters
        filtered_request = {
            "query": "red shoes",
            "filters": {
                "min_price": 30.0,
                "max_price": 100.0,
                "in_stock": True
            },
            "limit": 5
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/search",
                json=filtered_request
            )

            if response.status_code == 200:
                data = response.json()
                self.print_success("POST /api/v1/search - Search with filters successful")

                # Verify filters were applied
                if data.get("filters_applied"):
                    self.print_success("  Filters applied correctly")
                else:
                    self.print_warning("  Filters may not have been applied")
            else:
                self.print_error(f"POST /api/v1/search (filtered) - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"POST /api/v1/search (filtered) - Exception: {e}")

        # Test cache hit on second request
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/search",
                json=search_request
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("cached"):
                    self.print_success("  Cache hit on repeated query")
                else:
                    self.print_warning("  Expected cache hit but got cache miss")
            else:
                self.print_error(f"POST /api/v1/search (cache test) - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"POST /api/v1/search (cache test) - Exception: {e}")

    def test_recommend_endpoint(self):
        """Test recommendation endpoint."""
        self.print_header("Testing Recommendation Endpoint")

        # Test basic recommendations
        recommend_request = {
            "user_id": 123,
            "context": "feed",
            "limit": 10
        }

        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/v1/recommend",
                json=recommend_request
            )
            duration_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()

                # Validate response structure
                required_fields = ["results", "total", "user_id", "context", "recommendation_time_ms"]
                if all(field in data for field in required_fields):
                    self.print_success(f"POST /api/v1/recommend - Basic recommendations successful ({duration_ms:.2f}ms)")

                    # Check personalization
                    if data.get("personalized"):
                        self.print_success("  Recommendations are personalized")
                    else:
                        self.print_warning("  Recommendations may not be personalized")

                    # Check blend weights
                    if "blend_weights" in data:
                        weights = data["blend_weights"]
                        self.print_success(f"  Blend weights: {weights}")
                else:
                    self.print_error(f"POST /api/v1/recommend - Missing fields: {required_fields}")
            elif response.status_code == 404:
                self.print_warning("POST /api/v1/recommend - User has no embeddings (expected for new users)")
            else:
                self.print_error(f"POST /api/v1/recommend - Status code: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            self.print_error(f"POST /api/v1/recommend - Exception: {e}")

        # Test search-based recommendations
        search_recommend_request = {
            "user_id": 123,
            "context": "search",
            "search_query": "winter jackets",
            "limit": 5
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/recommend",
                json=search_recommend_request
            )

            if response.status_code == 200:
                data = response.json()
                self.print_success("POST /api/v1/recommend - Search-based recommendations successful")
            elif response.status_code == 404:
                self.print_warning("POST /api/v1/recommend (search) - User has no embeddings")
            else:
                self.print_error(f"POST /api/v1/recommend (search) - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"POST /api/v1/recommend (search) - Exception: {e}")

    def test_feedback_endpoint(self):
        """Test feedback endpoint."""
        self.print_header("Testing Feedback Endpoint")

        # Test click feedback
        feedback_request = {
            "user_id": 123,
            "product_id": 456,
            "interaction_type": "click",
            "session_id": "test_session_123",
            "context": "search",
            "query": "summer dresses",
            "position": 2
        }

        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/v1/feedback",
                json=feedback_request
            )
            duration_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()

                # Validate response
                required_fields = ["success", "user_id", "product_id", "interaction_type"]
                if all(field in data for field in required_fields):
                    self.print_success(f"POST /api/v1/feedback - Feedback recorded ({duration_ms:.2f}ms)")

                    # Check updates
                    if data.get("session_updated"):
                        self.print_success("  Session embeddings updated")

                    if data.get("cache_invalidated"):
                        self.print_success("  User cache invalidated")
                else:
                    self.print_error(f"POST /api/v1/feedback - Missing fields: {required_fields}")
            else:
                self.print_error(f"POST /api/v1/feedback - Status code: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            self.print_error(f"POST /api/v1/feedback - Exception: {e}")

        # Test purchase feedback
        purchase_request = {
            "user_id": 123,
            "product_id": 789,
            "interaction_type": "purchase"
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/feedback",
                json=purchase_request
            )

            if response.status_code == 200:
                self.print_success("POST /api/v1/feedback - Purchase feedback recorded")
            else:
                self.print_error(f"POST /api/v1/feedback (purchase) - Status code: {response.status_code}")
        except Exception as e:
            self.print_error(f"POST /api/v1/feedback (purchase) - Exception: {e}")

    def test_error_handling(self):
        """Test error handling."""
        self.print_header("Testing Error Handling")

        # Test invalid search query
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/search",
                json={"query": ""}  # Empty query
            )

            if response.status_code == 422:  # Validation error
                self.print_success("Validation error handling - Empty query rejected")
            else:
                self.print_warning(f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.print_error(f"Error handling test - Exception: {e}")

        # Test invalid feedback type
        try:
            response = self.session.post(
                f"{self.base_url}/api/v1/feedback",
                json={
                    "user_id": 123,
                    "product_id": 456,
                    "interaction_type": "invalid_type"
                }
            )

            if response.status_code == 422:
                self.print_success("Validation error handling - Invalid interaction type rejected")
            else:
                self.print_warning(f"Expected 422, got {response.status_code}")
        except Exception as e:
            self.print_error(f"Error handling test - Exception: {e}")

    def print_summary(self):
        """Print test summary."""
        self.print_header("Test Summary")

        total = self.passed + self.failed + self.warnings

        print(f"{Colors.GREEN}✓ Passed: {self.passed}{Colors.END}")
        print(f"{Colors.RED}✗ Failed: {self.failed}{Colors.END}")
        print(f"{Colors.YELLOW}⚠ Warnings: {self.warnings}{Colors.END}")
        print(f"\nTotal tests: {total}")

        if self.failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}All tests passed!{Colors.END}")
            return 0
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}Some tests failed!{Colors.END}")
            return 1

    def run_all_tests(self):
        """Run all integration tests."""
        print(f"\n{Colors.BOLD}FastAPI Integration Tests{Colors.END}")
        print(f"Testing API at: {self.base_url}\n")

        # Run test suites
        self.test_health_endpoints()
        self.test_search_endpoint()
        self.test_recommend_endpoint()
        self.test_feedback_endpoint()
        self.test_error_handling()

        # Print summary
        return self.print_summary()


def main():
    """Main test runner."""
    import argparse

    parser = argparse.ArgumentParser(description='Test FastAPI integration')
    parser.add_argument(
        '--url',
        default='http://localhost:8000',
        help='API base URL (default: http://localhost:8000)'
    )

    args = parser.parse_args()

    tester = APITester(base_url=args.url)
    exit_code = tester.run_all_tests()

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
