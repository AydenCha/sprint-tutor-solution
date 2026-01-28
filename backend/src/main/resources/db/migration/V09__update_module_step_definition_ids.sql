-- ============================================
-- 모듈에 Step Definition ID 할당
-- 각 모듈이 어떤 Step Definition에 속하는지 설정
-- ============================================

BEGIN;

-- Step Definition ID를 변수로 저장 (실제 ID는 동적으로 가져옴)
-- Step 1: 규정 및 행정 (ID: 1)
-- Step 2: 조직 및 문화 (ID: 2)
-- Step 3: 콘텐츠 숙지 (ID: 3)
-- Step 4: 환경 설정 (ID: 4)
-- Step 5: 도구 사용법 (ID: 5)
-- Step 6: 역량 검증 (ID: 6)

-- 모듈 1: 'KDT 규정 문서' -> Step 1 (규정 및 행정)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '규정 및 행정' LIMIT 1
)
WHERE name = 'KDT 규정 문서';

-- 모듈 2: '코드잇 문화 소개 영상' -> Step 2 (조직 및 문화)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '조직 및 문화' LIMIT 1
)
WHERE name = '코드잇 문화 소개 영상';

-- 모듈 3: '강의 준비 자료 제출' -> Step 5 (도구 사용법)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '도구 사용법' LIMIT 1
)
WHERE name = '강의 준비 자료 제출';

-- 모듈 4: '강의 환경 체크리스트' -> Step 4 (환경 설정)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '환경 설정' LIMIT 1
)
WHERE name = '강의 환경 체크리스트';

-- 모듈 5: '커리큘럼 가이드' -> Step 3 (콘텐츠 숙지)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '콘텐츠 숙지' LIMIT 1
)
WHERE name = '커리큘럼 가이드';

-- 모듈 6: '실습 프로젝트 안내' -> Step 3 (콘텐츠 숙지)
UPDATE content_modules
SET step_definition_id = (
    SELECT id FROM step_definitions WHERE title = '콘텐츠 숙지' LIMIT 1
)
WHERE name = '실습 프로젝트 안내';

-- step_template_modules 테이블을 참조하여 모듈의 step_definition_id 설정
-- 이미 템플릿에 할당된 모듈들은 해당 Step의 stepDefinitionId로 설정
UPDATE content_modules cm
SET step_definition_id = (
    SELECT DISTINCT sts.step_definition_id
    FROM step_template_modules stm
    JOIN step_template_steps sts ON stm.step_template_step_id = sts.id
    WHERE stm.module_id = cm.id
    LIMIT 1
)
WHERE cm.step_definition_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM step_template_modules stm
      JOIN step_template_steps sts ON stm.step_template_step_id = sts.id
      WHERE stm.module_id = cm.id
  );

COMMIT;

SELECT '✅ 모듈 Step Definition ID 업데이트 완료!' AS message;

