# GreenThumb ML API - Usage Guide

Complete guide to using the GreenThumb ML-powered product search and recommendation API.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health & Monitoring](#health--monitoring)
  - [Search](#search)
  - [Recommendations](#recommendations)
  - [Feedback](#feedback)
- [Performance](#performance)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Getting Started

### Base URL

```
http://localhost:8000
```

### Quick Start

```bash
# Check API health
curl http://localhost:8000/health

# Search for products
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "summer dresses", "limit": 10}'
```

---

## Authentication

Currently, API key authentication is optional. To enable:

```python
# Set environment variable
export API_REQUIRE_KEY=true
export API_KEYS=your-api-key-here

# Include in requests
curl -H "X-API-Key: your-api-key-here" ...
```

---

## Endpoints

### Health & Monitoring

#### GET /health

Simple health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### GET /status

Detailed system status.

**Response:**
```json
{
  "database": {
    "status": "healthy",
    "latency_ms": 5.2
  },
  "redis": {
    "status": "healthy",
    "latency_ms": 1.8
  },
  "faiss": {
    "status": "healthy",
    "num_vectors": 50000,
    "index_type": "IndexIVFFlat"
  },
  "performance": {
    "p95_latency_ms": 125.3,
    "meeting_target": true
  }
}
```

#### GET /metrics

Performance metrics.

**Response:**
```json
{
  "requests": {
    "total": 15000
  },
  "latency": {
    "p50_ms": 45.2,
    "p95_ms": 125.8,
    "p99_ms": 280.5,
    "mean_ms": 62.3
  }
}
```

#### GET /cache/stats

Cache performance statistics.

**Response:**
```json
{
  "cache": {
    "hits": 12350,
    "misses": 2070,
    "hit_rate_percent": 85.64,
    "hits_by_type": {
      "search": 8200,
      "recommend": 4150
    }
  }
}
```

#### GET /performance

Comprehensive performance analysis.

**Response:**
```json
{
  "performance": {
    "overall": {
      "p50_ms": 45.2,
      "p95_ms": 125.8,
      "p99_ms": 280.5
    },
    "health": "good",
    "meeting_target": true,
    "operations": {
      "search": { "p95": 118.5 },
      "recommend": { "p95": 135.2 }
    }
  },
  "recommendations": [
    {
      "priority": "medium",
      "endpoint": "/api/v1/recommend",
      "issue": "Low cache hit rate (45.2%)",
      "recommendation": "Increase cache TTL or implement cache warming"
    }
  ]
}
```

---

### Search

#### POST /api/v1/search

Text-based product search with ML-powered similarity matching.

**Request:**
```json
{
  "query": "summer dresses",
  "user_id": 123,
  "filters": {
    "min_price": 30.0,
    "max_price": 100.0,
    "in_stock": true,
    "merchant_ids": [1, 5, 10],
    "category_ids": [20],
    "brand_ids": [42]
  },
  "offset": 0,
  "limit": 20,
  "use_ranking": true,
  "enable_diversity": true
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | Search query (1-500 chars) |
| `user_id` | integer | ❌ | User ID for personalization |
| `filters` | object | ❌ | Product filters |
| `filters.min_price` | float | ❌ | Minimum price |
| `filters.max_price` | float | ❌ | Maximum price |
| `filters.in_stock` | boolean | ❌ | Only in-stock products |
| `filters.merchant_ids` | array | ❌ | Filter by merchants |
| `filters.category_ids` | array | ❌ | Filter by categories |
| `filters.brand_ids` | array | ❌ | Filter by brands |
| `offset` | integer | ❌ | Results offset (default: 0) |
| `limit` | integer | ❌ | Results limit (1-100, default: 20) |
| `use_ranking` | boolean | ❌ | Apply heuristic ranking (default: true) |
| `enable_diversity` | boolean | ❌ | Apply result diversity (default: true) |

**Response:**
```json
{
  "results": [
    {
      "product_id": 456,
      "title": "Floral Summer Dress",
      "description": "Beautiful floral print dress",
      "price": 59.99,
      "rrp_price": 89.99,
      "currency": "GBP",
      "image_url": "https://example.com/image.jpg",
      "product_url": "https://awin.com/deeplink/...",
      "merchant_id": 5,
      "merchant_name": "Fashion Boutique",
      "brand": "StyleCo",
      "brand_id": 42,
      "in_stock": true,
      "stock_quantity": 15,
      "category_id": 8,
      "category_name": "Dresses",
      "colour": "Floral Print",
      "fashion_category": "Summer Dresses",
      "fashion_size": "M",
      "quality_score": 0.89,
      "rating": 4.5,
      "review_count": 127,
      "similarity": 0.92,
      "rank": 0,
      "final_score": 0.87
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 20,
  "page": 1,
  "query": "summer dresses",
  "user_id": 123,
  "search_time_ms": 45.2,
  "total_time_ms": 78.5,
  "personalized": true,
  "cached": false,
  "filters_applied": true,
  "ranking_applied": true
}
```

**Example (Python):**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/search",
    json={
        "query": "red running shoes",
        "filters": {"min_price": 50, "in_stock": True},
        "limit": 10
    }
)

results = response.json()
for product in results["results"]:
    print(f"{product['title']} - £{product['price']}")
```

**Example (cURL):**
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vintage denim jackets",
    "filters": {
      "min_price": 30,
      "max_price": 100
    },
    "limit": 5
  }'
```

---

### Recommendations

#### POST /api/v1/recommend

Personalized product recommendations based on user embeddings.

**Request:**
```json
{
  "user_id": 123,
  "context": "feed",
  "product_id": 456,
  "category_id": 20,
  "search_query": "winter coats",
  "filters": {
    "min_price": 50.0,
    "in_stock": true
  },
  "offset": 0,
  "limit": 20,
  "use_session_context": true,
  "enable_diversity": true,
  "diversity_lambda": 0.5
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | ✅ | User ID |
| `context` | string | ❌ | Context type: `feed`, `search`, `similar`, `category` (default: feed) |
| `product_id` | integer | ❌ | Product ID (required for context=similar) |
| `category_id` | integer | ❌ | Category ID (required for context=category) |
| `search_query` | string | ❌ | Search query (required for context=search) |
| `filters` | object | ❌ | Product filters |
| `offset` | integer | ❌ | Results offset |
| `limit` | integer | ❌ | Results limit (1-100, default: 20) |
| `use_session_context` | boolean | ❌ | Use session embeddings (default: true) |
| `enable_diversity` | boolean | ❌ | Apply diversity (default: true) |
| `diversity_lambda` | float | ❌ | Diversity weight 0-1 (default: 0.5) |

**Contexts:**

- **`feed`**: General personalized feed (blends long-term + session)
- **`search`**: Search-based recommendations (blends query + user profile)
- **`similar`**: Similar to a product (blends product + user profile)
- **`category`**: Category-specific recommendations

**Response:**
```json
{
  "results": [/* same as search results */],
  "total": 150,
  "offset": 0,
  "limit": 20,
  "page": 1,
  "user_id": 123,
  "context": "feed",
  "recommendation_time_ms": 45.2,
  "total_time_ms": 78.5,
  "personalized": true,
  "cached": false,
  "has_long_term_profile": true,
  "has_session_context": true,
  "blend_weights": {
    "long_term": 0.6,
    "session": 0.4
  }
}
```

**Example (Python):**
```python
# Get personalized feed
response = requests.post(
    "http://localhost:8000/api/v1/recommend",
    json={
        "user_id": 123,
        "context": "feed",
        "limit": 20
    }
)

# Get similar products
response = requests.post(
    "http://localhost:8000/api/v1/recommend",
    json={
        "user_id": 123,
        "context": "similar",
        "product_id": 456,
        "limit": 10
    }
)
```

---

### Feedback

#### POST /api/v1/feedback

Record user-product interactions for personalization.

**Request:**
```json
{
  "user_id": 123,
  "product_id": 456,
  "interaction_type": "click",
  "rating": 4.5,
  "session_id": "sess_abc123",
  "context": "search",
  "query": "summer dresses",
  "position": 2,
  "metadata": {
    "page": "search_results",
    "device": "mobile"
  },
  "update_embeddings": true,
  "update_session": true
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | ✅ | User ID |
| `product_id` | integer | ✅ | Product ID |
| `interaction_type` | string | ✅ | Type: `view`, `click`, `add_to_cart`, `purchase`, `like`, `share`, `rating` |
| `rating` | float | ❌ | Rating 0-5 (required for type=rating) |
| `session_id` | string | ❌ | Session identifier |
| `context` | string | ❌ | Context (search, feed, similar, etc.) |
| `query` | string | ❌ | Search query that led to interaction |
| `position` | integer | ❌ | Position in results (for CTR analysis) |
| `metadata` | object | ❌ | Additional metadata |
| `update_embeddings` | boolean | ❌ | Trigger embedding update (default: true) |
| `update_session` | boolean | ❌ | Update session embeddings (default: true) |

**Interaction Weights:**

| Type | Weight | Session Decay |
|------|--------|---------------|
| `view` | 0.1 | 5 min |
| `click` | 0.3 | 10 min |
| `add_to_cart` | 0.6 | 30 min |
| `purchase` | 1.0 | 60 min |
| `like` | 0.5 | 30 min |
| `share` | 0.4 | 20 min |
| `rating` | 0.7 | 45 min |

**Response:**
```json
{
  "success": true,
  "message": "Feedback recorded",
  "interaction_id": 78901,
  "user_id": 123,
  "product_id": 456,
  "interaction_type": "click",
  "embeddings_updated": true,
  "session_updated": true,
  "cache_invalidated": true,
  "recorded_at": "2025-01-15T10:30:00Z",
  "processing_time_ms": 12.5
}
```

**Example (Python):**
```python
# Record click
requests.post(
    "http://localhost:8000/api/v1/feedback",
    json={
        "user_id": 123,
        "product_id": 456,
        "interaction_type": "click",
        "context": "search",
        "position": 2
    }
)

# Record purchase
requests.post(
    "http://localhost:8000/api/v1/feedback",
    json={
        "user_id": 123,
        "product_id": 789,
        "interaction_type": "purchase"
    }
)
```

---

## Performance

### Target Metrics

- **p95 latency**: < 150ms
- **Cache hit rate**: > 70%
- **Error rate**: < 1%

### Optimization Tips

1. **Use caching**: Repeated queries are cached (5min for search, 2min for recommendations)
2. **Pagination**: Request only needed results with `limit` parameter
3. **Filters**: Apply filters server-side for better performance
4. **Session IDs**: Group interactions with session_id for better tracking

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 404 | Not found (e.g., user has no embeddings) |
| 422 | Validation error |
| 500 | Internal server error |

### Error Response Format

```json
{
  "detail": "Error message",
  "status_code": 400,
  "details": {
    "field": "query",
    "error": "Query too short"
  }
}
```

---

## Best Practices

### 1. Search Optimization

```python
# ✅ Good: Use filters to narrow results
response = requests.post("/api/v1/search", json={
    "query": "shoes",
    "filters": {"in_stock": True, "min_price": 30},
    "limit": 20
})

# ❌ Bad: Fetch all results and filter client-side
response = requests.post("/api/v1/search", json={
    "query": "shoes",
    "limit": 100
})
# Filter in Python...
```

### 2. Personalization

```python
# ✅ Good: Include user_id for personalized results
response = requests.post("/api/v1/search", json={
    "query": "dresses",
    "user_id": 123
})

# Record interactions to improve personalization
requests.post("/api/v1/feedback", json={
    "user_id": 123,
    "product_id": 456,
    "interaction_type": "click"
})
```

### 3. Recommendation Contexts

```python
# Homepage feed
requests.post("/api/v1/recommend", json={
    "user_id": 123,
    "context": "feed"
})

# Product detail page (similar items)
requests.post("/api/v1/recommend", json={
    "user_id": 123,
    "context": "similar",
    "product_id": 456
})

# Search results enhancement
requests.post("/api/v1/recommend", json={
    "user_id": 123,
    "context": "search",
    "search_query": "winter coats"
})
```

### 4. Error Handling

```python
try:
    response = requests.post("/api/v1/search", json={...})
    response.raise_for_status()
    results = response.json()
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 404:
        print("User has no embeddings yet")
    else:
        print(f"Error: {e}")
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/greenthumb/issues
- API Docs: http://localhost:8000/docs (Swagger UI)
- Redoc: http://localhost:8000/redoc
