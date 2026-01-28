-- Make correct_answer and options columns nullable in quiz_questions table
--
-- correct_answer: Legacy column that is no longer used by the application
-- The application now uses correct_answer_index and correct_answer_text instead
--
-- options: Should be nullable because SUBJECTIVE questions don't have options
-- Only OBJECTIVE questions need options

ALTER TABLE quiz_questions
ALTER COLUMN correct_answer DROP NOT NULL;

ALTER TABLE quiz_questions
ALTER COLUMN options DROP NOT NULL;

COMMENT ON COLUMN quiz_questions.correct_answer IS 'Legacy column - use correct_answer_index or correct_answer_text instead';
COMMENT ON COLUMN quiz_questions.options IS 'Required for OBJECTIVE questions, null for SUBJECTIVE questions';
