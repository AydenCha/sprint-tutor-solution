-- Fix module_checklist_items foreign key constraint
-- Remove the incorrect foreign key that references onboarding_modules
-- The correct foreign key to content_modules already exists

ALTER TABLE module_checklist_items
DROP CONSTRAINT IF EXISTS fkfv6eqqfb7sar2tq4qsvt4vbv5;

-- Add comment for documentation
COMMENT ON TABLE module_checklist_items IS 'Checklist items for content modules (Type D)';
COMMENT ON COLUMN module_checklist_items.module_id IS 'References content_modules.id';
