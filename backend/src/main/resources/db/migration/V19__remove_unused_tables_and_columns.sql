-- ============================================
-- V15: Remove unused tables and columns
-- ============================================
-- This migration removes:
-- 1. Legacy quiz_questions.correct_answer column (replaced by correct_answer_index and correct_answer_text)
-- 2. Unused onboarding_paths and path_modules tables (replaced by StepTemplate system)

BEGIN;

-- 1. Remove legacy quiz_questions.correct_answer column
-- This column was replaced by correct_answer_index (for OBJECTIVE) and correct_answer_text (for SUBJECTIVE)
-- Already marked as nullable in V10, safe to drop
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS correct_answer;

-- 2. Remove unused onboarding_paths system
-- These tables are not used in the frontend and have been replaced by StepTemplate system
-- PathController exists but is not called from frontend
DROP TABLE IF EXISTS path_modules CASCADE;
DROP TABLE IF EXISTS onboarding_paths CASCADE;

COMMIT;
