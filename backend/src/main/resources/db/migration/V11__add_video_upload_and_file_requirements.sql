-- ============================================
-- V8: Add video upload support and enhance file requirements
-- ============================================

-- Add video_stored_filename column for Type B modules
ALTER TABLE content_modules 
ADD COLUMN video_stored_filename VARCHAR(500);

-- Add comment to explain the fields
COMMENT ON COLUMN content_modules.video_url IS '동영상 URL (외부 링크: YouTube, Vimeo 등) 또는 로컬 업로드 파일의 접근 경로';
COMMENT ON COLUMN content_modules.video_stored_filename IS '업로드된 동영상 파일의 서버 저장 이름 (UUID 기반)';
COMMENT ON COLUMN content_modules.required_files IS '파일 업로드 요구사항 (JSON: placeholder, fileNameHint, allowedExtensions, required)';

-- Note: required_files column type is already JSON, no need to change
-- The structure will change from List<String> to List<FileRequirement> in the application layer
-- Existing data migration will be handled by the application if needed
