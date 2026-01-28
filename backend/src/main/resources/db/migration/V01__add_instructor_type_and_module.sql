-- Add instructor type and onboarding module fields to instructors table
-- Also add step_type field to onboarding_steps table

ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS instructor_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS onboarding_module VARCHAR(50);

ALTER TABLE onboarding_steps
ADD COLUMN IF NOT EXISTS step_type VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instructor_type ON instructors(instructor_type);
CREATE INDEX IF NOT EXISTS idx_instructor_module ON instructors(onboarding_module);
CREATE INDEX IF NOT EXISTS idx_step_type ON onboarding_steps(step_type);


