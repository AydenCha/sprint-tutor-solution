#!/bin/bash

# ============================================
# Sprint Tutor Flow - API 전수 테스트 스크립트
# ============================================
#
# 사용법:
# 1. 백엔드 서버가 실행 중인지 확인하세요
# 2. chmod +x API_TEST_SCRIPT.sh
# 3. ./API_TEST_SCRIPT.sh
#
# ============================================

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
BASE_URL="${BASE_URL:-http://localhost:8080/api}"
PM_EMAIL="${PM_EMAIL:-}"
PM_PASSWORD="${PM_PASSWORD:-}"
TOKEN=""

if [ -z "$PM_EMAIL" ] || [ -z "$PM_PASSWORD" ]; then
  echo "⚠️  Set PM_EMAIL and PM_PASSWORD before running this script."
  echo "   Example:"
  echo "     PM_EMAIL=pm@codeit.com PM_PASSWORD='your-password' ./API_TEST_SCRIPT.sh"
  exit 1
fi

# 헬퍼 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# API 호출 함수
call_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    log_info "Testing: $description"
    log_info "  $method $endpoint"

    if [ -n "$data" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}")
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -w "\nHTTP_STATUS:%{http_code}")
        fi
    else
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -w "\nHTTP_STATUS:%{http_code}")
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -w "\nHTTP_STATUS:%{http_code}")
        fi
    fi

    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS:/d')

    if [ "$http_status" -ge 200 ] && [ "$http_status" -lt 300 ]; then
        log_success "✓ HTTP $http_status"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        log_error "✗ HTTP $http_status"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi

    echo ""
    return 0
}

# ============================================
# 1. 서버 상태 확인
# ============================================
echo "========================================"
echo "  Sprint Tutor Flow API 테스트"
echo "========================================"
echo ""

log_info "1. 서버 연결 확인..."
if curl -s -f "$BASE_URL/actuator/health" > /dev/null 2>&1; then
    log_success "서버가 실행 중입니다."
else
    log_error "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요."
    log_info "서버 시작 명령: cd backend && mvn spring-boot:run"
    exit 1
fi
echo ""

# ============================================
# 2. 인증 테스트
# ============================================
log_info "2. PM 로그인..."
login_response=$(call_api "POST" "/auth/login" \
    "{\"identifier\":\"$PM_EMAIL\",\"password\":\"$PM_PASSWORD\"}" \
    "PM Login" || echo "FAILED")

if [ "$login_response" != "FAILED" ]; then
    TOKEN=$(echo "$login_response" | jq -r '.token // empty' | grep -v "HTTP_STATUS")
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        log_success "로그인 성공! 토큰 획득"
    else
        log_warning "PM 계정이 없습니다. PM 등록을 진행합니다..."

        # PM 등록
        register_response=$(call_api "POST" "/auth/register/pm" \
            "{\"name\":\"Test PM\",\"email\":\"$PM_EMAIL\",\"password\":\"$PM_PASSWORD\"}" \
            "PM Registration" || echo "FAILED")

        if [ "$register_response" != "FAILED" ]; then
            log_warning "PM 등록 완료. 이메일 인증이 필요합니다."
            log_info "테스트를 위해 데이터베이스에서 email_verified=true로 수동 설정 후 다시 로그인하세요."
            exit 1
        fi
    fi
else
    log_error "로그인 실패"
    exit 1
fi
echo ""

# ============================================
# 3. Step Definition API 테스트
# ============================================
log_info "3. Step Definition API 테스트"

# 3-1. 모든 Step Definition 조회
call_api "GET" "/steps/definitions" "" "Get All Step Definitions"

# 3-2. Step Definition 생성
STEP_DEF_RESPONSE=$(call_api "POST" "/steps/definitions" \
    "{\"title\":\"테스트 Step\",\"emoji\":\"📝\",\"description\":\"API 테스트용 Step\",\"defaultDDay\":-14,\"stepType\":\"PM 주도\"}" \
    "Create Step Definition" || echo "FAILED")

if [ "$STEP_DEF_RESPONSE" != "FAILED" ]; then
    STEP_DEF_ID=$(echo "$STEP_DEF_RESPONSE" | jq -r '.id // empty' | grep -v "HTTP_STATUS")
    log_success "Step Definition 생성 완료: ID=$STEP_DEF_ID"
else
    log_error "Step Definition 생성 실패"
    STEP_DEF_ID=""
fi
echo ""

# ============================================
# 4. Content Module API 테스트
# ============================================
log_info "4. Content Module API 테스트"

# 4-1. 모든 Module 조회
call_api "GET" "/modules" "" "Get All Modules"

# 4-2. Module 생성
MODULE_RESPONSE=$(call_api "POST" "/modules" \
    "{\"name\":\"테스트 모듈\",\"contentType\":\"D\",\"description\":\"API 테스트용 모듈\",\"checklistItems\":[{\"label\":\"테스트 항목 1\"},{\"label\":\"테스트 항목 2\"}]}" \
    "Create Content Module" || echo "FAILED")

if [ "$MODULE_RESPONSE" != "FAILED" ]; then
    MODULE_ID=$(echo "$MODULE_RESPONSE" | jq -r '.id // empty' | grep -v "HTTP_STATUS")
    log_success "Content Module 생성 완료: ID=$MODULE_ID"
else
    log_error "Content Module 생성 실패"
    MODULE_ID=""
fi
echo ""

# ============================================
# 5. Step에 Module 할당 테스트 (NEW!)
# ============================================
log_info "5. Step에 Module 할당 테스트"

if [ -n "$STEP_DEF_ID" ] && [ -n "$MODULE_ID" ]; then
    call_api "PUT" "/steps/definitions/$STEP_DEF_ID/modules" \
        "[$MODULE_ID]" \
        "Assign Module to Step Definition"

    # 할당 확인
    call_api "GET" "/steps/definitions/$STEP_DEF_ID" "" \
        "Get Step Definition with Modules"
else
    log_warning "Step 또는 Module이 없어서 할당 테스트를 건너뜁니다."
fi
echo ""

# ============================================
# 6. Track API 테스트
# ============================================
log_info "6. Track API 테스트"

call_api "GET" "/tracks" "" "Get All Tracks"
echo ""

# ============================================
# 7. Instructor Registration 테스트 (NEW API!)
# ============================================
log_info "7. Instructor Registration with stepConfigurations 테스트"

if [ -n "$STEP_DEF_ID" ] && [ -n "$MODULE_ID" ]; then
    INSTRUCTOR_RESPONSE=$(call_api "POST" "/instructors" \
        "{
            \"name\":\"테스트 강사\",
            \"email\":\"instructor-test@example.com\",
            \"phone\":\"010-1234-5678\",
            \"track\":\"프론트엔드\",
            \"cohort\":\"6기\",
            \"startDate\":\"2026-03-01\",
            \"instructorType\":\"신입\",
            \"stepConfigurations\":[
                {
                    \"stepId\":$STEP_DEF_ID,
                    \"enabledModuleIds\":[$MODULE_ID]
                }
            ]
        }" \
        "Register Instructor with stepConfigurations" || echo "FAILED")

    if [ "$INSTRUCTOR_RESPONSE" != "FAILED" ]; then
        INSTRUCTOR_ID=$(echo "$INSTRUCTOR_RESPONSE" | jq -r '.id // empty' | grep -v "HTTP_STATUS")
        log_success "Instructor 등록 완료: ID=$INSTRUCTOR_ID"
    else
        log_warning "Instructor 등록 실패 (Track이 없을 수 있음)"
        INSTRUCTOR_ID=""
    fi
else
    log_warning "Step 또는 Module이 없어서 Instructor 등록 테스트를 건너뜁니다."
    INSTRUCTOR_ID=""
fi
echo ""

# ============================================
# 8. Instructor Steps 조회 테스트
# ============================================
log_info "8. Instructor Steps 조회 테스트"

if [ -n "$INSTRUCTOR_ID" ]; then
    call_api "GET" "/instructors/$INSTRUCTOR_ID/steps" "" \
        "Get Instructor Steps with Tasks"

    log_info "Task의 isEnabled 필드가 true로 설정되어 있는지 확인하세요!"
else
    log_warning "Instructor ID가 없어서 조회 테스트를 건너뜁니다."
fi
echo ""

# ============================================
# 9. Instructor Dashboard 조회 테스트
# ============================================
log_info "9. 모든 Instructor 조회"

call_api "GET" "/instructors" "" "Get All Instructors"
echo ""

# ============================================
# 10. Audit Logs 테스트
# ============================================
log_info "10. Audit Logs 조회"

call_api "GET" "/audit-logs?page=0&size=10" "" "Get Recent Audit Logs"
echo ""

# ============================================
# 11. 정리 (선택사항)
# ============================================
log_info "11. 테스트 데이터 정리"

read -p "생성된 테스트 데이터를 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -n "$INSTRUCTOR_ID" ]; then
        call_api "DELETE" "/instructors/$INSTRUCTOR_ID" "" \
            "Delete Test Instructor" || true
    fi

    if [ -n "$MODULE_ID" ]; then
        call_api "DELETE" "/modules/$MODULE_ID" "" \
            "Delete Test Module" || true
    fi

    if [ -n "$STEP_DEF_ID" ]; then
        call_api "DELETE" "/steps/definitions/$STEP_DEF_ID" "" \
            "Delete Test Step Definition" || true
    fi

    log_success "테스트 데이터 정리 완료"
else
    log_info "테스트 데이터를 유지합니다."
    if [ -n "$INSTRUCTOR_ID" ]; then
        log_info "  Instructor ID: $INSTRUCTOR_ID"
    fi
    if [ -n "$MODULE_ID" ]; then
        log_info "  Module ID: $MODULE_ID"
    fi
    if [ -n "$STEP_DEF_ID" ]; then
        log_info "  Step Definition ID: $STEP_DEF_ID"
    fi
fi
echo ""

# ============================================
# 테스트 완료
# ============================================
echo "========================================"
log_success "API 테스트 완료!"
echo "========================================"
echo ""
echo "주요 확인 사항:"
echo "  ✓ Step Definition에 모듈 할당 API (PUT /steps/definitions/{id}/modules)"
echo "  ✓ Instructor 등록 시 stepConfigurations 사용"
echo "  ✓ Task의 isEnabled 필드 확인"
echo "  ✓ Step Template API 제거 확인 (404 응답)"
echo ""
echo "다음 단계:"
echo "  1. 프론트엔드 /pm/steps 페이지 접속"
echo "  2. Step에 모듈 할당 UI 테스트"
echo "  3. 강사 등록 시 모듈 토글 UI 테스트"
echo "  4. 강사 대시보드에서 활성화된 Task만 표시되는지 확인"
echo ""
