-- ============================================
-- Add track_id column to instructors table
-- Remove old track enum column
-- ============================================
-- This migration:
-- 1. Adds track_id column to instructors
-- 2. Migrates existing data from track enum to track_id
-- 3. Removes old track enum column and constraints
-- 4. Adds foreign key constraint
-- ============================================

BEGIN;

-- 1. Add track_id column (nullable first for data migration)
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS track_id BIGINT;

-- 2. Migrate existing data from track enum to track_id
UPDATE instructors i
SET track_id = t.id
FROM tracks t
WHERE i.track_id IS NULL
AND (
    (i.track = 'FRONTEND' AND t.name = 'FRONTEND') OR
    (i.track = 'BACKEND' AND t.name = 'BACKEND') OR
    (i.track = 'FULLSTACK' AND t.name = 'FULLSTACK') OR
    (i.track = 'DATA_ANALYSIS' AND t.name = 'DATA_ANALYSIS') OR
    (i.track = 'AI_ML' AND t.name = 'AI_ML') OR
    (i.track = 'SPRING BACKEND' AND t.name = 'SPRING BACKEND')
);

-- 3. Set track_id to NOT NULL (only if all rows have track_id)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM instructors WHERE track_id IS NULL) = 0 THEN
        ALTER TABLE instructors ALTER COLUMN track_id SET NOT NULL;
    END IF;
END $$;

-- 4. Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_instructor_track'
    ) THEN
        ALTER TABLE instructors 
        ADD CONSTRAINT fk_instructor_track 
        FOREIGN KEY (track_id) REFERENCES tracks(id);
    END IF;
END $$;

-- 5. Drop old track enum column and constraints
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_track_check;
DROP INDEX IF EXISTS idx_instructor_track_cohort;
ALTER TABLE instructors DROP COLUMN IF EXISTS track;

-- 6. Recreate index with track_id
CREATE INDEX IF NOT EXISTS idx_instructor_track_cohort 
ON instructors(track_id, cohort);

COMMIT;
