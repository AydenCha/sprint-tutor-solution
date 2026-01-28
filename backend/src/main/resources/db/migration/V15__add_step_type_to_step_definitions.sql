-- Add step_type column to step_definitions table
-- This allows PMs to categorize steps with keywords like "PM 주도", "자가 점검", "지연", "생략"

ALTER TABLE step_definitions
ADD COLUMN step_type VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN step_definitions.step_type IS 'Step 유형 키워드 (PM 주도, 자가 점검, 지연, 생략 등)';
