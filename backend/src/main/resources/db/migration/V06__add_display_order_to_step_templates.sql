-- ============================================
-- Add display_order to step_templates
-- ============================================
-- This migration adds display_order column to step_templates table
-- to allow PMs to reorder templates via drag-and-drop
-- ============================================

BEGIN;

-- 1. Add display_order column to step_templates
ALTER TABLE step_templates 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 2. Initialize display_order based on current id order
UPDATE step_templates 
SET display_order = id 
WHERE display_order IS NULL;

-- 3. Make display_order NOT NULL with default value
ALTER TABLE step_templates 
ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE step_templates 
ALTER COLUMN display_order SET DEFAULT 0;

-- 4. Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_step_template_display_order 
ON step_templates(display_order);

COMMIT;
