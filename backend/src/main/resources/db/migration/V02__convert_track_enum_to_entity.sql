-- ============================================
-- Convert Track enum to Track entity
-- ============================================
-- This migration:
-- 1. Creates tracks table
-- 2. Inserts initial track data from enum
-- 3. Adds track_id column to instructors and bootcamp_templates
-- 4. Migrates existing data
-- 5. Drops old track enum columns
-- ============================================

BEGIN;

-- 1. Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    korean_name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Insert initial track data from enum
INSERT INTO tracks (name, korean_name, code, enabled, description) VALUES
    ('FRONTEND', '프론트엔드', 'FE', true, '프론트엔드 개발 트랙'),
    ('BACKEND', '백엔드', 'BE', true, '백엔드 개발 트랙'),
    ('FULLSTACK', '풀스택', 'FS', true, '풀스택 개발 트랙'),
    ('DATA_ANALYSIS', '데이터 분석', 'DA', true, '데이터 분석 트랙'),
    ('AI_ML', 'AI/ML', 'AI', true, 'AI/ML 트랙')
ON CONFLICT (name) DO NOTHING;

-- 3. Add track_id column to instructors table
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS track_id BIGINT;

-- 4. Migrate existing data in instructors table
UPDATE instructors i
SET track_id = t.id
FROM tracks t
WHERE 
    (i.track = 'FRONTEND' AND t.name = 'FRONTEND') OR
    (i.track = 'BACKEND' AND t.name = 'BACKEND') OR
    (i.track = 'FULLSTACK' AND t.name = 'FULLSTACK') OR
    (i.track = 'DATA_ANALYSIS' AND t.name = 'DATA_ANALYSIS') OR
    (i.track = 'AI_ML' AND t.name = 'AI_ML');

-- 5. Make track_id NOT NULL and add foreign key constraint
ALTER TABLE instructors
ALTER COLUMN track_id SET NOT NULL;

ALTER TABLE instructors
ADD CONSTRAINT fk_instructor_track 
FOREIGN KEY (track_id) REFERENCES tracks(id);

-- 6. Add track_id column to bootcamp_templates table
ALTER TABLE bootcamp_templates 
ADD COLUMN IF NOT EXISTS track_id BIGINT;

-- 7. Migrate existing data in bootcamp_templates table
UPDATE bootcamp_templates bt
SET track_id = t.id
FROM tracks t
WHERE 
    (bt.track = 'FRONTEND' AND t.name = 'FRONTEND') OR
    (bt.track = 'BACKEND' AND t.name = 'BACKEND') OR
    (bt.track = 'FULLSTACK' AND t.name = 'FULLSTACK') OR
    (bt.track = 'DATA_ANALYSIS' AND t.name = 'DATA_ANALYSIS') OR
    (bt.track = 'AI_ML' AND t.name = 'AI_ML');

-- 8. Make track_id NOT NULL and add foreign key constraint for bootcamp_templates
ALTER TABLE bootcamp_templates
ALTER COLUMN track_id SET NOT NULL;

ALTER TABLE bootcamp_templates
ADD CONSTRAINT fk_bootcamp_template_track 
FOREIGN KEY (track_id) REFERENCES tracks(id);

-- 9. Drop old track enum columns and constraints
ALTER TABLE instructors DROP COLUMN IF EXISTS track;
ALTER TABLE bootcamp_templates DROP COLUMN IF EXISTS track;

-- Drop old track check constraint
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_track_check;
ALTER TABLE bootcamp_templates DROP CONSTRAINT IF EXISTS bootcamp_templates_track_check;

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_instructor_track_id ON instructors(track_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_template_track_id ON bootcamp_templates(track_id);

COMMIT;

