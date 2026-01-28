-- ============================================
-- Add document_content column to tasks table
-- ============================================
-- This migration adds document_content column to tasks table
-- to support inline Markdown content for instructor tasks
-- ============================================

BEGIN;

-- Add document_content column
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS document_content TEXT;

-- Add comment
COMMENT ON COLUMN tasks.document_content IS 'Markdown content for inline documentation (alternative to document_url)';

COMMIT;
