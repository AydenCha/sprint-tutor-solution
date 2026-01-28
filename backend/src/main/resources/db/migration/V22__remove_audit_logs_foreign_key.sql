-- ============================================
-- V19: Remove foreign key constraint from audit_logs
-- ============================================
-- audit_logs는 로그 성격이므로 외래키 제약 조건을 제거
-- 시점의 기록만 저장하고, 사용자 삭제와 무관하게 로그는 보존

-- 기존 외래키 제약 조건 제거 (제약 조건 이름이 다를 수 있으므로 여러 이름 시도)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- fk_audit_log_performed_by 제약 조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'audit_logs'::regclass
      AND contype = 'f'
      AND conname LIKE '%performed_by%'
    LIMIT 1;
    
    -- 제약 조건이 있으면 제거
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
    
    -- 다른 가능한 제약 조건 이름들도 시도
    -- Hibernate가 자동 생성한 제약 조건 이름 (예: fkbbhnovrq20qlv4uppmvlpm8o0)
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'audit_logs'::regclass
          AND contype = 'f'
          AND confrelid = 'users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- 인덱스는 유지 (조회 성능을 위해)
-- performed_by_pm_id는 외래키가 아니지만 인덱스는 유지

-- 주석 추가
COMMENT ON TABLE audit_logs IS '감사 로그 테이블 - 외래키 제약 조건 없음 (로그 보존을 위해)';
COMMENT ON COLUMN audit_logs.performed_by_pm_id IS '수행한 PM의 ID (참조 무결성 없음, 시점 기록용)';
