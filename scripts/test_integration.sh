#!/bin/bash

# Integration Test Script
# Tests that frontend can communicate with backend

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL=${1:-"http://localhost:8000"}
FRONTEND_URL=${2:-"http://localhost:3001"}

echo "🧪 GreenThumb Integration Test"
echo "=============================="
echo "Backend:  $API_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# Test 1: Backend Health Check
echo -n "Testing backend health... "
HEALTH_RESPONSE=$(curl -s "$API_URL/health" || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Backend is not responding. Is it running?"
    exit 1
fi

# Test 2: Search Endpoint
echo -n "Testing search endpoint... "
SEARCH_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/search" \
    -H "Content-Type: application/json" \
    -d '{"query": "green sustainable plants", "limit": 10}' \
    || echo "FAILED")

if echo "$SEARCH_RESPONSE" | grep -q "results"; then
    NUM_RESULTS=$(echo "$SEARCH_RESPONSE" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✅ PASS${NC} (found $NUM_RESULTS results)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $SEARCH_RESPONSE"
fi

# Test 3: Recommendations Endpoint
echo -n "Testing recommendations endpoint... "
RECOMMEND_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/recommend" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "test_user", "limit": 10}' \
    || echo "FAILED")

if echo "$RECOMMEND_RESPONSE" | grep -q "results"; then
    NUM_RESULTS=$(echo "$RECOMMEND_RESPONSE" | grep -o '"total":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✅ PASS${NC} (found $NUM_RESULTS results)"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $RECOMMEND_RESPONSE"
fi

# Test 4: Feedback Endpoint
echo -n "Testing feedback endpoint... "
FEEDBACK_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/feedback" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "test_user", "product_id": 1, "interaction_type": "view"}' \
    || echo "FAILED")

if echo "$FEEDBACK_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $FEEDBACK_RESPONSE"
fi

# Test 5: Frontend Health
echo -n "Testing frontend... "
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")

if [ "$FRONTEND_RESPONSE" = "200" ] || [ "$FRONTEND_RESPONSE" = "307" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $FRONTEND_RESPONSE)"
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $FRONTEND_RESPONSE)"
    echo "Frontend is not responding. Is it running?"
fi

# Test 6: CORS
echo -n "Testing CORS headers... "
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/v1/search" \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: POST" \
    || echo "FAILED")

if echo "$CORS_RESPONSE" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    echo "CORS may not be configured. Frontend requests might fail."
fi

echo ""
echo "=============================="
echo -e "${GREEN}✨ Integration test complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit $FRONTEND_URL"
echo "2. Complete onboarding (select 3+ styles)"
echo "3. Browse personalized feed"
echo "4. Try searching for products"
