-- Migrate existing required_files from string arrays to FileRequirement objects
--
-- This migration converts simple string arrays like:
--   ["file1.pdf", "file2.zip"]
--
-- To FileRequirement objects like:
--   [
--     {"placeholder": "파일을 업로드해주세요: file1.pdf", "fileNameHint": "file1", "allowedExtensions": [".pdf"], "required": true},
--     {"placeholder": "파일을 업로드해주세요: file2.zip", "allowedExtensions": [".zip"], "required": true}
--   ]

-- Function to extract file extension
CREATE OR REPLACE FUNCTION get_file_extension(filename TEXT)
RETURNS TEXT AS $$
BEGIN
    IF filename LIKE '%.%' THEN
        RETURN '.' || split_part(filename, '.', array_length(string_to_array(filename, '.'), 1));
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to extract filename without extension
CREATE OR REPLACE FUNCTION get_filename_hint(filename TEXT)
RETURNS TEXT AS $$
BEGIN
    IF filename LIKE '%.%' THEN
        RETURN substring(filename from 1 for position('.' in filename) - 1);
    ELSE
        RETURN filename;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Migrate content_modules.required_files
UPDATE content_modules
SET required_files = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'placeholder', '파일을 업로드해주세요: ' || file_name::text,
            'fileNameHint', get_filename_hint(file_name::text),
            'allowedExtensions', CASE
                WHEN get_file_extension(file_name::text) IS NOT NULL
                THEN jsonb_build_array(get_file_extension(file_name::text))
                ELSE jsonb_build_array('.pdf', '.docx', '.zip')
            END,
            'required', true
        )
    )
    FROM jsonb_array_elements_text(required_files) AS file_name
)
WHERE required_files IS NOT NULL
  AND jsonb_typeof(required_files) = 'array'
  AND required_files::text NOT LIKE '%placeholder%';  -- Only migrate if not already migrated

-- Migrate template_tasks.required_files (if any exist)
UPDATE template_tasks
SET required_files = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'placeholder', '파일을 업로드해주세요: ' || file_name::text,
            'fileNameHint', get_filename_hint(file_name::text),
            'allowedExtensions', CASE
                WHEN get_file_extension(file_name::text) IS NOT NULL
                THEN jsonb_build_array(get_file_extension(file_name::text))
                ELSE jsonb_build_array('.pdf', '.docx', '.zip')
            END,
            'required', true
        )
    )
    FROM jsonb_array_elements_text(required_files) AS file_name
)
WHERE required_files IS NOT NULL
  AND jsonb_typeof(required_files) = 'array'
  AND required_files::text NOT LIKE '%placeholder%';

-- Migrate tasks.required_files (if any exist)
UPDATE tasks
SET required_files = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'placeholder', '파일을 업로드해주세요: ' || file_name::text,
            'fileNameHint', get_filename_hint(file_name::text),
            'allowedExtensions', CASE
                WHEN get_file_extension(file_name::text) IS NOT NULL
                THEN jsonb_build_array(get_file_extension(file_name::text))
                ELSE jsonb_build_array('.pdf', '.docx', '.zip')
            END,
            'required', true
        )
    )
    FROM jsonb_array_elements_text(required_files) AS file_name
)
WHERE required_files IS NOT NULL
  AND jsonb_typeof(required_files) = 'array'
  AND required_files::text NOT LIKE '%placeholder%';

-- Clean up temporary functions
DROP FUNCTION IF EXISTS get_file_extension(TEXT);
DROP FUNCTION IF EXISTS get_filename_hint(TEXT);
