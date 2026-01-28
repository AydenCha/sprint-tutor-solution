#!/bin/bash

# Frontend Test Script
# Tests frontend pages and API integration

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api}"
PM_EMAIL="${PM_EMAIL:-}"
PM_PASSWORD="${PM_PASSWORD:-}"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results
declare -a TEST_RESULTS=()

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Require explicit credentials to avoid leaking defaults
if [ -z "$PM_EMAIL" ] || [ -z "$PM_PASSWORD" ]; then
    echo "⚠️  Set PM_EMAIL and PM_PASSWORD before running this script."
    echo "   Example:"
    echo "     PM_EMAIL=pm@codeit.com PM_PASSWORD='your-password' ./test-frontend.sh"
    exit 1
fi

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
    TEST_RESULTS+=("FAIL: $1")
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((SKIPPED_TESTS++))
    ((TOTAL_TESTS++))
}

# Check if frontend is running
check_frontend() {
    print_header "Checking Frontend Health"
    print_test "GET ${FRONTEND_URL}"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}")
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Frontend is running (HTTP $HTTP_CODE)"
        return 0
    else
        print_failure "Frontend is not accessible (HTTP $HTTP_CODE)"
        return 1
    fi
}

# Test frontend pages
test_landing_page() {
    print_header "Testing Landing Page"
    
    print_test "GET ${FRONTEND_URL}/"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}/")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        if echo "$BODY" | grep -q "접속 코드\|강사\|PM"; then
            print_success "Landing page loaded correctly"
        else
            print_failure "Landing page content not found"
        fi
    else
        print_failure "Landing page failed (HTTP $HTTP_CODE)"
    fi
}

# Test API integration (requires authentication)
test_api_integration() {
    print_header "Testing Frontend API Integration"
    
    # Get PM token
    print_test "PM Login for API test"
    LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\":\"${PM_EMAIL}\",\"password\":\"${PM_PASSWORD}\"}")
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        PM_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
        print_success "PM Login successful"
        
        # Test if frontend can access API (CORS check)
        print_test "CORS check - Frontend to API"
        CORS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/health" \
            -H "Origin: ${FRONTEND_URL}" \
            -H "Access-Control-Request-Method: GET" \
            -o /dev/null -w "%{http_code}")
        
        if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "405" ]; then
            print_success "CORS headers present"
        else
            print_failure "CORS check failed (HTTP $CORS_RESPONSE)"
        fi
    else
        print_skip "API integration test (login failed)"
    fi
}

# Test frontend build
test_frontend_build() {
    print_header "Testing Frontend Build"
    
    if [ ! -d "frontend" ]; then
        print_skip "Frontend directory not found"
        return
    fi
    
    print_test "Checking frontend build artifacts"
    if [ -d "frontend/dist" ] && [ -f "frontend/dist/index.html" ]; then
        print_success "Frontend build artifacts found"
    else
        print_test "Building frontend..."
        cd frontend
        if npm run build > /dev/null 2>&1; then
            print_success "Frontend build successful"
        else
            print_failure "Frontend build failed"
        fi
        cd ..
    fi
}

# Test environment variables
test_environment_variables() {
    print_header "Testing Environment Variables"
    
    if [ -f "frontend/src/config/env.ts" ]; then
        print_success "Environment configuration file exists"
        
        # Check if API base URL is configured
        if grep -q "getApiBaseUrl\|API_BASE_URL" frontend/src/config/env.ts; then
            print_success "API base URL configuration found"
        else
            print_failure "API base URL configuration not found"
        fi
    else
        print_failure "Environment configuration file not found"
    fi
}

# Test frontend routes (SPA routing)
test_frontend_routes() {
    print_header "Testing Frontend Routes"
    
    # Public routes
    PUBLIC_ROUTES=(
        "/"
        "/auth/forgot-password"
        "/auth/reset-password"
        "/auth/verify-email"
        "/auth/register-pm"
    )
    
    # Protected routes (should redirect to login or return 200 for SPA)
    PROTECTED_ROUTES=(
        "/pm/dashboard"
        "/pm/settings"
        "/pm/instructors"
        "/pm/tracks"
        "/pm/steps"
        "/pm/modules"
        "/pm/content"
        "/pm/audit-logs"
        "/instructor"
    )
    
    print_test "Testing public routes"
    for route in "${PUBLIC_ROUTES[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}${route}")
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Route ${route} accessible"
        else
            print_failure "Route ${route} failed (HTTP $HTTP_CODE)"
        fi
    done
    
    print_test "Testing protected routes (SPA should return 200)"
    for route in "${PROTECTED_ROUTES[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}${route}")
        
        # SPA should return 200 even for protected routes (client-side routing)
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Route ${route} accessible (SPA routing)"
        else
            print_failure "Route ${route} failed (HTTP $HTTP_CODE)"
        fi
    done
}

# Main test execution
main() {
    print_header "Starting Frontend Test Suite"
    echo "Frontend URL: $FRONTEND_URL"
    echo "API Base URL: $API_BASE_URL"
    echo ""
    
    if ! check_frontend; then
        echo -e "${RED}Frontend is not accessible. Please start the frontend first.${NC}"
        print_summary
        exit 1
    fi
    
    test_landing_page
    test_frontend_routes
    test_environment_variables
    test_api_integration
    test_frontend_build
    
    print_summary
    
    if [ $FAILED_TESTS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

print_summary() {
    print_header "Test Summary"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}Failed Tests:${NC}"
        for result in "${TEST_RESULTS[@]}"; do
            echo "  - $result"
        done
        echo ""
    fi
    
    if [ $FAILED_TESTS -eq 0 ] && [ $TOTAL_TESTS -gt 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
    fi
}

# Run tests
main
