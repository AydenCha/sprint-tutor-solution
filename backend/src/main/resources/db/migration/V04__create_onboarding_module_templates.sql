-- ============================================
-- 온보딩 모듈별 Step 템플릿 생성
-- 신규 강사 등록 시 미리보기에 표시되는 모듈에 맞춘 템플릿
-- ============================================

BEGIN;

-- Step Definition ID를 가져오기 위한 변수 (실제 ID는 동적으로 가져와야 함)
-- 여기서는 Step Definition이 이미 존재한다고 가정하고 진행
-- 실제로는 Step Definition의 ID를 조회해서 사용해야 함

-- 모듈 A. 육성형 (신입 + 여유) 템플릿
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '육성형 (모듈 A) - 신입 + 여유',
    '모든 항목을 꼼꼼히 검증하여 코드잇 강사로 육성합니다. PM 주도: Step 3(콘텐츠) & Step 6(역량), 자가 점검: Step 1(규정), Step 2(조직), Step 4(환경), Step 5(도구)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- 모듈 A 템플릿의 Step들 (Step Definition ID는 실제 존재하는 ID로 변경 필요)
-- Step 1: 규정 및 행정 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -14,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    2,
    -10,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '조직 및 문화';

-- Step 3: 콘텐츠 숙지 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -7,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    4,
    -5,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '환경 설정';

-- Step 5: 도구 사용법 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    5,
    -3,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '도구 사용법';

-- Step 6: 역량 검증 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    6,
    -1,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '육성형 (모듈 A) - 신입 + 여유'
  AND sd.title = '역량 검증';

-- ============================================
-- 모듈 B. 생존형 (신입 + 긴급) 템플릿
-- ============================================
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '생존형 (모듈 B) - 신입 + 긴급',
    '행정 사고 방지와 첫 주 수업 진행에 올인합니다. PM 주도: Step 1(규정 - 금지사항) & Step 3(1주차 콘텐츠), 자가 점검: Step 4(환경 - 필수 항목만), Step 5(도구 - 필수 항목만), 지연: Step 2(조직), 생략: Step 6(역량)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- Step 1: 규정 및 행정 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -7,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (지연)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    2,
    0,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '조직 및 문화';

-- Step 3: 콘텐츠 숙지 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -5,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    4,
    -3,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '환경 설정';

-- Step 5: 도구 사용법 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    5,
    -2,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '도구 사용법';

-- Step 6: 역량 검증 (생략 - 하지만 템플릿에는 포함)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    6,
    0,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '생존형 (모듈 B) - 신입 + 긴급'
  AND sd.title = '역량 검증';

-- ============================================
-- 모듈 C. 얼라인형 (경력 + 여유) 템플릿
-- ============================================
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '얼라인형 (모듈 C) - 경력 + 여유',
    '타 기관 습관을 버리고 코드잇의 톤앤매너를 입힙니다. PM 주도: Step 1(규정 - 차이점) & Step 2(조직 - 문화), 자가 점검: Step 3(콘텐츠), Step 4(환경), Step 5(도구), 생략: Step 6(역량)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- Step 1: 규정 및 행정 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -14,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    2,
    -10,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '조직 및 문화';

-- Step 3: 콘텐츠 숙지 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -7,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    4,
    -5,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '환경 설정';

-- Step 5: 도구 사용법 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    5,
    -3,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '도구 사용법';

-- Step 6: 역량 검증 (생략 - 하지만 템플릿에는 포함)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    6,
    0,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '얼라인형 (모듈 C) - 경력 + 여유'
  AND sd.title = '역량 검증';

-- ============================================
-- 모듈 D. 속성 적응형 (경력 + 긴급) 템플릿
-- ============================================
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '속성 적응형 (모듈 D) - 경력 + 긴급',
    '강의력은 신뢰하되, 규정 리스크만 확실히 차단합니다. PM 주도: Step 1(행정 패턴 - 필수), 자가 점검: Step 3(콘텐츠), Step 5(도구 - LMS/ZEP), 지연: Step 2(조직 융화 전반)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- Step 1: 규정 및 행정 (PM 주도)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -7,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '속성 적응형 (모듈 D) - 경력 + 긴급'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (지연)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    2,
    0,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '속성 적응형 (모듈 D) - 경력 + 긴급'
  AND sd.title = '조직 및 문화';

-- Step 3: 콘텐츠 숙지 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -5,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '속성 적응형 (모듈 D) - 경력 + 긴급'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (생략 - 하지만 템플릿에는 포함하지 않음)
-- 모듈 D에는 Step 4가 없으므로 생략

-- Step 5: 도구 사용법 (자가 점검)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    5,
    -2,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '속성 적응형 (모듈 D) - 경력 + 긴급'
  AND sd.title = '도구 사용법';

-- Step 6: 역량 검증 (생략 - 하지만 템플릿에는 포함하지 않음)

-- ============================================
-- 모듈 E. 업데이트형 (재계약 + 여유) 템플릿
-- ============================================
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '업데이트형 (모듈 E) - 재계약 + 여유',
    '변경된 사항만 체크하고, 비전을 다시 공유합니다. PM 주도: Step 3(변경된 콘텐츠) & Step 2(조직 - 리텐션), 자가 점검: Step 1(규정 - 변경점만), Step 4(환경 - 기기 변경 시), 생략: Step 5(도구), Step 6(역량)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- Step 1: 규정 및 행정 (자가 점검 - 변경점만)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -14,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '업데이트형 (모듈 E) - 재계약 + 여유'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (PM 주도 - 리텐션)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    2,
    -10,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '업데이트형 (모듈 E) - 재계약 + 여유'
  AND sd.title = '조직 및 문화';

-- Step 3: 콘텐츠 숙지 (PM 주도 - 변경된 콘텐츠)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -7,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '업데이트형 (모듈 E) - 재계약 + 여유'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (자가 점검 - 기기 변경 시)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    4,
    -5,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '업데이트형 (모듈 E) - 재계약 + 여유'
  AND sd.title = '환경 설정';

-- Step 5: 도구 사용법 (생략 - 하지만 템플릿에는 포함하지 않음)
-- Step 6: 역량 검증 (생략 - 하지만 템플릿에는 포함하지 않음)

-- ============================================
-- 모듈 F. 최소 확인형 (재계약 + 긴급) 템플릿
-- ============================================
INSERT INTO step_templates (name, description, created_by_pm_id, created_at, updated_at)
SELECT 
    '최소 확인형 (모듈 F) - 재계약 + 긴급',
    '계약 및 필수 행정 절차만 빠르게 완료합니다. PM 주도: Step 1(계약/필수 행정), 자가 점검: Step 3(콘텐츠 - 서명만), Step 5(도구 - 서명만), 생략: Step 2(조직), Step 4(환경), Step 6(역량)',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.email = 'pm@codeit.com'
LIMIT 1;

-- Step 1: 규정 및 행정 (PM 주도 - 계약/필수 행정)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    1,
    -3,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '최소 확인형 (모듈 F) - 재계약 + 긴급'
  AND sd.title = '규정 및 행정';

-- Step 2: 조직 및 문화 (생략 - 하지만 템플릿에는 포함하지 않음)
-- Step 3: 콘텐츠 숙지 (자가 점검 - 서명만)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    3,
    -2,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '최소 확인형 (모듈 F) - 재계약 + 긴급'
  AND sd.title = '콘텐츠 숙지';

-- Step 4: 환경 설정 (생략 - 하지만 템플릿에는 포함하지 않음)
-- Step 5: 도구 사용법 (자가 점검 - 서명만)
INSERT INTO step_template_steps (step_template_id, step_definition_id, display_order, d_day, created_at, updated_at)
SELECT 
    st.id,
    sd.id,
    5,
    -1,
    NOW(),
    NOW()
FROM step_templates st, step_definitions sd
WHERE st.name = '최소 확인형 (모듈 F) - 재계약 + 긴급'
  AND sd.title = '도구 사용법';

-- Step 6: 역량 검증 (생략 - 하지만 템플릿에는 포함하지 않음)

COMMIT;

