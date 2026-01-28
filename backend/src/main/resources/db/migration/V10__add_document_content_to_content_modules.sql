-- ============================================
-- Add document_content column for Markdown support
-- ============================================
-- This migration adds document_content column to content_modules table
-- to support inline Markdown content as an alternative to external URLs
-- ============================================

BEGIN;

-- Add document_content column
ALTER TABLE content_modules 
ADD COLUMN IF NOT EXISTS document_content TEXT;

-- Add comment
COMMENT ON COLUMN content_modules.document_content IS 'Markdown content for inline documentation (alternative to document_url)';

COMMIT;
