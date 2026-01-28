-- ============================================
-- Add display_order to step_definitions
-- ============================================
-- This migration adds display_order column to step_definitions table
-- to allow PMs to reorder step definitions via drag-and-drop
-- ============================================

BEGIN;

-- 1. Add display_order column to step_definitions
ALTER TABLE step_definitions 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 2. Initialize display_order based on current id order
UPDATE step_definitions 
SET display_order = id 
WHERE display_order IS NULL;

-- 3. Make display_order NOT NULL with default value
ALTER TABLE step_definitions 
ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE step_definitions 
ALTER COLUMN display_order SET DEFAULT 0;

-- 4. Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_step_definition_display_order 
ON step_definitions(display_order);

COMMIT;
