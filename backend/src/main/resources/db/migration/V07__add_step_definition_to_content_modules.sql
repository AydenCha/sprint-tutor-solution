-- Add step_definition_id column to content_modules table
-- This allows modules to be owned by Step Definitions

ALTER TABLE content_modules 
ADD COLUMN IF NOT EXISTS step_definition_id BIGINT;

-- Add foreign key constraint
ALTER TABLE content_modules
ADD CONSTRAINT fk_content_module_step_definition
FOREIGN KEY (step_definition_id) REFERENCES step_definitions(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_content_module_step_definition 
ON content_modules(step_definition_id);

