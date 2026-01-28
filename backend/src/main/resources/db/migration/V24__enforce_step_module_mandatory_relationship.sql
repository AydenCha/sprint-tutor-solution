-- V24: Enforce mandatory Step-Module relationship
-- Migration: Assign all orphaned modules to first StepDefinition
-- Author: Sprint Tutor Team
-- Date: 2026-01-23

-- =====================================================
-- CRITICAL: Backup database before running this migration!
-- pg_dump -h <HOST> -U <USER> -d <DB> > backup_before_v24_$(date +%Y%m%d_%H%M%S).sql
-- =====================================================

-- Step 1: Verify first StepDefinition exists and count orphaned modules
DO $$
DECLARE
    first_step_id BIGINT;
    first_step_title VARCHAR;
    orphaned_count INT;
BEGIN
    -- Find first StepDefinition
    SELECT id, title INTO first_step_id, first_step_title
    FROM step_definitions
    ORDER BY display_order ASC
    LIMIT 1;

    -- Check if StepDefinition exists
    IF first_step_id IS NULL THEN
        RAISE EXCEPTION 'No StepDefinition found. Please create at least one StepDefinition before migration.';
    END IF;

    -- Count orphaned modules
    SELECT COUNT(*) INTO orphaned_count
    FROM content_modules
    WHERE step_definition_id IS NULL;

    RAISE NOTICE 'First StepDefinition: ID=%, Title="%"', first_step_id, first_step_title;
    RAISE NOTICE 'Orphaned modules to be assigned: %', orphaned_count;
END $$;

-- Step 2: Assign all orphaned modules to first StepDefinition
UPDATE content_modules
SET step_definition_id = (
    SELECT id
    FROM step_definitions
    ORDER BY display_order ASC
    LIMIT 1
)
WHERE step_definition_id IS NULL;

-- Step 3: Verify update
DO $$
DECLARE
    updated_count INT;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM content_modules
    WHERE step_definition_id = (
        SELECT id
        FROM step_definitions
        ORDER BY display_order ASC
        LIMIT 1
    );

    RAISE NOTICE 'Modules assigned to first step: %', updated_count;
END $$;

-- Step 4: Make step_definition_id NOT NULL
ALTER TABLE content_modules
ALTER COLUMN step_definition_id SET NOT NULL;

-- Step 5: Add foreign key constraint with CASCADE
ALTER TABLE content_modules
DROP CONSTRAINT IF EXISTS fk_content_module_step_definition;

ALTER TABLE content_modules
ADD CONSTRAINT fk_content_module_step_definition
FOREIGN KEY (step_definition_id)
REFERENCES step_definitions(id)
ON DELETE CASCADE;

-- Step 6: Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_content_modules_step_definition
ON content_modules(step_definition_id);

-- Step 7: Mark default_module_ids as deprecated
COMMENT ON COLUMN step_definitions.default_module_ids IS
'DEPRECATED: Use bidirectional relationship (ContentModule.stepDefinition) instead. Will be removed in future version.';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check for null step_definition_id (should return 0)
DO $$
DECLARE
    null_count INT;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM content_modules
    WHERE step_definition_id IS NULL;

    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % modules still have NULL step_definition_id', null_count;
    END IF;

    RAISE NOTICE 'Verification: No orphaned modules (NULL step_definition_id count = 0)';
END $$;

-- Show module distribution across steps
DO $$
DECLARE
    distribution_record RECORD;
BEGIN
    RAISE NOTICE '=== Module Distribution Across Steps ===';

    FOR distribution_record IN
        SELECT
            sd.id,
            sd.title,
            sd.emoji,
            sd.display_order,
            COUNT(cm.id) as module_count
        FROM step_definitions sd
        LEFT JOIN content_modules cm ON sd.id = cm.step_definition_id
        GROUP BY sd.id, sd.title, sd.emoji, sd.display_order
        ORDER BY sd.display_order
    LOOP
        RAISE NOTICE 'Step % (ID=%): % modules',
            COALESCE(distribution_record.emoji || ' ' || distribution_record.title, distribution_record.title),
            distribution_record.id,
            distribution_record.module_count;
    END LOOP;

    RAISE NOTICE '=========================================';
    RAISE NOTICE 'V24 Migration completed successfully!';
    RAISE NOTICE 'All modules now have mandatory step_definition_id';
    RAISE NOTICE 'Foreign key constraint added with CASCADE';
    RAISE NOTICE 'Index created for performance';
END $$;
