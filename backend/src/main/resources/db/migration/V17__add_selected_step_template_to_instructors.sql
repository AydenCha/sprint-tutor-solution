-- Add selected_step_template_id column to instructors table
-- This tracks which StepTemplate was used during instructor registration (for reference only)

ALTER TABLE instructors
ADD COLUMN selected_step_template_id BIGINT;

-- Add index for faster lookup when checking if template is in use
CREATE INDEX idx_instructor_template_id ON instructors(selected_step_template_id);

-- No foreign key constraint to allow soft references
-- (StepTemplate can be deleted if no longer needed, won't break existing instructors)
