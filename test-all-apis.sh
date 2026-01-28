#!/bin/bash

# Comprehensive API Test Script
# Tests all API endpoints and verifies database state

# Don't exit on error - collect all test results

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api}"
PM_EMAIL="${PM_EMAIL:-}"
PM_PASSWORD="${PM_PASSWORD:-}"
INSTRUCTOR_ACCESS_CODE="${INSTRUCTOR_ACCESS_CODE:-}"

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
    echo "     PM_EMAIL=pm@codeit.com PM_PASSWORD='your-password' ./test-all-apis.sh"
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

# Check if backend is running
check_backend() {
    print_header "Checking Backend Health"
    # Try /api/health endpoint (context path is /api)
    if curl -s "${API_BASE_URL}/health" > /dev/null 2>&1; then
        print_success "Backend is running"
        return 0
    else
        print_failure "Backend is not running. Please start the backend first."
        exit 1
    fi
}

# Authentication
PM_TOKEN=""
INSTRUCTOR_TOKEN=""
PM_USER_ID=""
INSTRUCTOR_USER_ID=""

test_pm_login() {
    print_header "Testing PM Authentication"
    
    print_test "PM Login"
    RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\":\"${PM_EMAIL}\",\"password\":\"${PM_PASSWORD}\"}")
    
    if echo "$RESPONSE" | grep -q "token"; then
        PM_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        PM_USER_ID=$(echo "$RESPONSE" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
        print_success "PM Login successful (Token: ${PM_TOKEN:0:20}..., UserID: $PM_USER_ID)"
    else
        # If login failed due to email verification, try to verify email via MailHog
        if echo "$RESPONSE" | grep -q "이메일 인증"; then
            print_test "Email not verified. Attempting to verify via MailHog..."
            verify_email_via_mailhog
            # Retry login
            sleep 2
            RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
                -H "Content-Type: application/json" \
                -d "{\"identifier\":\"${PM_EMAIL}\",\"password\":\"${PM_PASSWORD}\"}")
            
            if echo "$RESPONSE" | grep -q "token"; then
                PM_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
                PM_USER_ID=$(echo "$RESPONSE" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
                print_success "PM Login successful after email verification (Token: ${PM_TOKEN:0:20}..., UserID: $PM_USER_ID)"
            else
                print_failure "PM Login failed even after email verification: $RESPONSE"
                exit 1
            fi
        else
            print_failure "PM Login failed: $RESPONSE"
            exit 1
        fi
    fi
}

verify_email_via_mailhog() {
    # Request verification email
    print_test "Requesting verification email..."
    curl -s -X POST "${API_BASE_URL}/auth/resend-verification?email=${PM_EMAIL}" > /dev/null
    sleep 3

    # 더 이상 자동 토큰 추출 스크립트를 사용하지 않습니다.
    print_test "자동 토큰 추출 스크립트는 제거되었습니다. MailHog UI에서 토큰을 확인해 수동으로 검증하세요."

    return 1
}

test_instructor_login() {
    print_header "Testing Instructor Authentication"
    
    if [ -z "$INSTRUCTOR_ACCESS_CODE" ]; then
        print_skip "Instructor login (no access code provided)"
        return
    fi
    
    print_test "Instructor Login"
    RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\":\"${INSTRUCTOR_ACCESS_CODE}\",\"password\":\"${INSTRUCTOR_ACCESS_CODE}\"}")
    
    if echo "$RESPONSE" | grep -q "token"; then
        INSTRUCTOR_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        INSTRUCTOR_USER_ID=$(echo "$RESPONSE" | grep -o '"userId":[0-9]*' | cut -d':' -f2)
        print_success "Instructor Login successful (Token: ${INSTRUCTOR_TOKEN:0:20}..., UserID: $INSTRUCTOR_USER_ID)"
    else
        print_failure "Instructor Login failed: $RESPONSE"
    fi
}

# Health Check
test_health() {
    print_header "Testing Health Endpoint"
    
    print_test "GET /health"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/health")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Health check passed"
    else
        print_failure "Health check failed (HTTP $HTTP_CODE): $BODY"
    fi
}

# Instructor APIs
test_instructor_apis() {
    print_header "Testing Instructor APIs"
    
    print_test "GET /instructors (Get all instructors)"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/instructors?page=0&size=100&sortBy=dday&direction=ASC" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        INSTRUCTOR_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        print_success "Get all instructors (Found $INSTRUCTOR_COUNT instructors)"
        
        # Extract first instructor ID
        FIRST_INSTRUCTOR_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$FIRST_INSTRUCTOR_ID" ]; then
            test_instructor_by_id "$FIRST_INSTRUCTOR_ID"
        fi
    else
        print_failure "Get all instructors failed (HTTP $HTTP_CODE): $BODY"
    fi
}

test_instructor_by_id() {
    local INSTRUCTOR_ID=$1
    print_test "GET /instructors/$INSTRUCTOR_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/instructors/${INSTRUCTOR_ID}" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get instructor by ID ($INSTRUCTOR_ID)"
    else
        print_failure "Get instructor by ID failed (HTTP $HTTP_CODE)"
    fi
}

test_instructor_dashboard() {
    print_header "Testing Instructor Dashboard"
    
    if [ -z "$INSTRUCTOR_TOKEN" ]; then
        print_skip "Instructor dashboard (no instructor token)"
        return
    fi
    
    print_test "GET /instructors/dashboard"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/instructors/dashboard" \
        -H "Authorization: Bearer ${INSTRUCTOR_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Instructor dashboard retrieved"
    else
        print_failure "Instructor dashboard failed (HTTP $HTTP_CODE)"
    fi
}

# Track APIs
test_track_apis() {
    print_header "Testing Track APIs"
    
    print_test "GET /tracks"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/tracks" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        TRACK_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        print_success "Get all tracks (Found $TRACK_COUNT tracks)"
        
        # Extract first track ID
        FIRST_TRACK_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$FIRST_TRACK_ID" ]; then
            test_track_by_id "$FIRST_TRACK_ID"
        fi
    else
        print_failure "Get all tracks failed (HTTP $HTTP_CODE): $BODY"
    fi
}

test_track_by_id() {
    local TRACK_ID=$1
    print_test "GET /tracks/$TRACK_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/tracks/${TRACK_ID}" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get track by ID ($TRACK_ID)"
    else
        print_failure "Get track by ID failed (HTTP $HTTP_CODE)"
    fi
}

# Step Definition APIs
test_step_definition_apis() {
    print_header "Testing Step Definition APIs"
    
    print_test "GET /steps/definitions"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/steps/definitions" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        STEP_DEF_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        print_success "Get all step definitions (Found $STEP_DEF_COUNT definitions)"
        
        # Extract first step definition ID
        FIRST_STEP_DEF_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$FIRST_STEP_DEF_ID" ]; then
            test_step_definition_by_id "$FIRST_STEP_DEF_ID"
        fi
    else
        print_failure "Get all step definitions failed (HTTP $HTTP_CODE): $BODY"
    fi
}

test_step_definition_by_id() {
    local STEP_DEF_ID=$1
    print_test "GET /steps/definitions/$STEP_DEF_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/steps/definitions/${STEP_DEF_ID}" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get step definition by ID ($STEP_DEF_ID)"
    else
        print_failure "Get step definition by ID failed (HTTP $HTTP_CODE)"
    fi
}

# Module APIs
test_module_apis() {
    print_header "Testing Module APIs"
    
    print_test "GET /modules"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/modules" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        MODULE_COUNT=$(echo "$BODY" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
        print_success "Get all modules (Found $MODULE_COUNT modules)"
        
        # Extract first module ID
        FIRST_MODULE_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        if [ ! -z "$FIRST_MODULE_ID" ]; then
            test_module_by_id "$FIRST_MODULE_ID"
        fi
    else
        print_failure "Get all modules failed (HTTP $HTTP_CODE): $BODY"
    fi
}

test_module_by_id() {
    local MODULE_ID=$1
    print_test "GET /modules/$MODULE_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/modules/${MODULE_ID}" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get module by ID ($MODULE_ID)"
    else
        print_failure "Get module by ID failed (HTTP $HTTP_CODE)"
    fi
}

# Audit Log APIs
test_audit_log_apis() {
    print_header "Testing Audit Log APIs"
    
    print_test "GET /audit-logs"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/audit-logs?page=0&size=20" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get audit logs"
    else
        print_failure "Get audit logs failed (HTTP $HTTP_CODE)"
    fi
    
    if [ ! -z "$PM_USER_ID" ]; then
        print_test "GET /audit-logs/pm/$PM_USER_ID"
        RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/audit-logs/pm/${PM_USER_ID}?page=0&size=20" \
            -H "Authorization: Bearer ${PM_TOKEN}")
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Get audit logs by PM"
        else
            print_failure "Get audit logs by PM failed (HTTP $HTTP_CODE)"
        fi
    fi
    
    print_test "GET /audit-logs/stats/action-types"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/audit-logs/stats/action-types" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get audit log action type stats"
    else
        print_failure "Get audit log action type stats failed (HTTP $HTTP_CODE)"
    fi
    
    print_test "GET /audit-logs/stats/entity-types"
    RESPONSE=$(curl -s -w "\n%{http_code}" "${API_BASE_URL}/audit-logs/stats/entity-types" \
        -H "Authorization: Bearer ${PM_TOKEN}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Get audit log entity type stats"
    else
        print_failure "Get audit log entity type stats failed (HTTP $HTTP_CODE)"
    fi
}

# Auth APIs (additional)
test_auth_apis() {
    print_header "Testing Additional Auth APIs"
    
    print_test "POST /auth/forgot-password"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE_URL}/auth/forgot-password?email=${PM_EMAIL}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Request password reset"
    else
        print_failure "Request password reset failed (HTTP $HTTP_CODE)"
    fi
}

# Task APIs (if instructor token available)
test_task_apis() {
    print_header "Testing Task APIs"
    
    if [ -z "$INSTRUCTOR_TOKEN" ]; then
        print_skip "Task APIs (no instructor token)"
        return
    fi
    
    # Get instructor dashboard to find tasks
    print_test "Getting instructor dashboard to find tasks"
    RESPONSE=$(curl -s "${API_BASE_URL}/instructors/dashboard" \
        -H "Authorization: Bearer ${INSTRUCTOR_TOKEN}")
    
    # Extract first task ID from steps
    FIRST_TASK_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    if [ ! -z "$FIRST_TASK_ID" ]; then
        print_test "GET /tasks/$FIRST_TASK_ID (via instructor dashboard)"
        print_success "Task ID found: $FIRST_TASK_ID"
    else
        print_skip "Task APIs (no tasks found for instructor)"
    fi
}

# Database verification
verify_database() {
    print_header "Verifying Database State"
    
    # Check if PostgreSQL is accessible
    if command -v psql > /dev/null 2>&1; then
        print_test "Checking database connection"
        if PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -c "SELECT 1" > /dev/null 2>&1; then
            print_success "Database connection successful"
            
            # Count records
            print_test "Counting records in key tables"
            
            INSTRUCTOR_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM instructors WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NULL)" 2>/dev/null | tr -d ' ')
            USER_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL" 2>/dev/null | tr -d ' ')
            USER_PM_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'PM'" 2>/dev/null | tr -d ' ')
            USER_INSTRUCTOR_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'INSTRUCTOR'" 2>/dev/null | tr -d ' ')
            TRACK_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM tracks" 2>/dev/null | tr -d ' ')
            STEP_DEF_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM step_definitions" 2>/dev/null | tr -d ' ')
            MODULE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM content_modules" 2>/dev/null | tr -d ' ')
            AUDIT_LOG_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM audit_logs" 2>/dev/null | tr -d ' ')
            STEP_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM onboarding_steps" 2>/dev/null | tr -d ' ')
            TASK_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM tasks" 2>/dev/null | tr -d ' ')
            
            echo -e "${BLUE}Database Record Counts:${NC}"
            echo "  Users (not deleted): $USER_COUNT"
            echo "    - PM: $USER_PM_COUNT"
            echo "    - Instructor: $USER_INSTRUCTOR_COUNT"
            echo "  Instructors (with active users): $INSTRUCTOR_COUNT"
            echo "  Tracks: $TRACK_COUNT"
            echo "  Step Definitions: $STEP_DEF_COUNT"
            echo "  Content Modules: $MODULE_COUNT"
            echo "  Onboarding Steps: $STEP_COUNT"
            echo "  Tasks: $TASK_COUNT"
            echo "  Audit Logs: $AUDIT_LOG_COUNT"
            echo ""
            
            # Verify data integrity
            print_test "Verifying data integrity"
            
            # Check for instructors without users
            ORPHAN_INSTRUCTORS=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM instructors i LEFT JOIN users u ON i.user_id = u.id WHERE u.id IS NULL OR u.deleted_at IS NOT NULL" 2>/dev/null | tr -d ' ')
            if [ "$ORPHAN_INSTRUCTORS" = "0" ]; then
                print_success "No orphaned instructors (all have active users)"
            else
                print_failure "Found $ORPHAN_INSTRUCTORS orphaned instructors"
            fi
            
            # Check for steps without instructors
            ORPHAN_STEPS=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM onboarding_steps s LEFT JOIN instructors i ON s.instructor_id = i.id WHERE i.id IS NULL" 2>/dev/null | tr -d ' ')
            if [ "$ORPHAN_STEPS" = "0" ]; then
                print_success "No orphaned steps (all have instructors)"
            else
                print_failure "Found $ORPHAN_STEPS orphaned steps"
            fi
            
            # Check for tasks without steps
            ORPHAN_TASKS=$(PGPASSWORD=postgres psql -h localhost -U postgres -d onboarding_db -t -c "SELECT COUNT(*) FROM tasks t LEFT JOIN onboarding_steps s ON t.step_id = s.id WHERE s.id IS NULL" 2>/dev/null | tr -d ' ')
            if [ "$ORPHAN_TASKS" = "0" ]; then
                print_success "No orphaned tasks (all have steps)"
            else
                print_failure "Found $ORPHAN_TASKS orphaned tasks"
            fi
            
            if [ "$INSTRUCTOR_COUNT" -gt 0 ]; then
                print_success "Database contains instructor records"
            else
                print_failure "No instructor records found in database"
            fi
            
            if [ "$USER_COUNT" -gt 0 ]; then
                print_success "Database contains user records"
            else
                print_failure "No user records found in database"
            fi
        else
            print_skip "Database verification (psql not accessible or wrong credentials)"
        fi
    else
        print_skip "Database verification (psql not installed)"
    fi
}

# Main test execution
main() {
    print_header "Starting Comprehensive API Test Suite"
    echo "API Base URL: $API_BASE_URL"
    echo "PM Email: $PM_EMAIL"
    echo ""
    
    check_backend
    test_health
    test_pm_login
    
    if [ ! -z "$PM_TOKEN" ]; then
        test_instructor_apis
        test_track_apis
        test_step_definition_apis
        test_module_apis
        test_audit_log_apis
        test_auth_apis
    fi
    
    test_instructor_login
    if [ ! -z "$INSTRUCTOR_TOKEN" ]; then
        test_instructor_dashboard
        test_task_apis
    fi
    
    verify_database
    
    # Summary
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
        exit 1
    else
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    fi
}

# Run tests
main
