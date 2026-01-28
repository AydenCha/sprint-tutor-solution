-- Fix module_quiz_questions table schema
-- Remove old correct_answer column and ensure correct_answer_index and correct_answer_text are nullable
-- Also fix foreign key constraint to reference content_modules instead of onboarding_modules

-- First, drop the old correct_answer column if it exists
ALTER TABLE module_quiz_questions 
DROP COLUMN IF EXISTS correct_answer;

-- Fix foreign key constraint: drop the incorrect one that references onboarding_modules
ALTER TABLE module_quiz_questions 
DROP CONSTRAINT IF EXISTS fklgfhkgjftb5q4yy729lxsuuuh;

-- Add the correct foreign key constraint that references content_modules
ALTER TABLE module_quiz_questions
ADD CONSTRAINT fk_module_quiz_questions_content_module
FOREIGN KEY (module_id) REFERENCES content_modules(id) ON DELETE CASCADE;

-- Ensure correct_answer_index is nullable (for subjective questions)
ALTER TABLE module_quiz_questions 
ALTER COLUMN correct_answer_index DROP NOT NULL;

-- Ensure correct_answer_text is nullable (for objective questions)
ALTER TABLE module_quiz_questions 
ALTER COLUMN correct_answer_text DROP NOT NULL;

-- Ensure options is nullable (for subjective questions)
ALTER TABLE module_quiz_questions 
ALTER COLUMN options DROP NOT NULL;

