-- ============================================
-- V23: Remove Step Template System and Add Step-Module Direct Assignment
-- ============================================
--
-- Purpose:
--   1. Add default_module_ids to step_definitions (JSON array of module IDs)
--   2. Add is_enabled to tasks (controls module visibility per instructor)
--   3. Drop template-related tables (step_templates, step_template_steps, step_template_modules)
--   4. Keep instructors.selected_step_template_id for audit trail (no foreign key)
--
-- Impact:
--   - Existing instructor data (onboarding_steps, tasks) remains unchanged
--   - All existing tasks get is_enabled = TRUE by default
--   - Template tables are permanently removed
--   - PM will manage modules directly per step definition
--
-- Author: System Migration
-- Date: 2026-01-13
-- ============================================

-- ============================================
-- Phase 1: Add new fields to step_definitions and tasks
-- ============================================

-- Add default_module_ids to step_definitions (stores JSONB array of module IDs)
ALTER TABLE step_definitions
ADD COLUMN IF NOT EXISTS default_module_ids JSONB NULL;

COMMENT ON COLUMN step_definitions.default_module_ids IS 'Array of ContentModule IDs assigned to this step definition';

-- Add is_enabled to tasks (controls module visibility per instructor)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN tasks.is_enabled IS 'Whether this task is enabled for the instructor';

-- Update existing tasks to have is_enabled = TRUE
UPDATE tasks SET is_enabled = TRUE WHERE is_enabled IS NULL;

-- ============================================
-- Phase 2: Drop foreign key constraints (must be done before dropping tables)
-- ============================================

-- Drop foreign keys from step_template_modules (PostgreSQL uses DROP CONSTRAINT)
DO $$
BEGIN
    ALTER TABLE step_template_modules DROP CONSTRAINT IF EXISTS fk_step_template_module_step_template;
    ALTER TABLE step_template_modules DROP CONSTRAINT IF EXISTS fk_step_template_module_step_template_step;
    ALTER TABLE step_template_modules DROP CONSTRAINT IF EXISTS fk_step_template_module_content_module;
    ALTER TABLE step_template_steps DROP CONSTRAINT IF EXISTS fk_step_template_step_step_template;
    ALTER TABLE step_template_steps DROP CONSTRAINT IF EXISTS fk_step_template_step_step_definition;
    ALTER TABLE step_templates DROP CONSTRAINT IF EXISTS fk_step_template_created_by;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- Phase 3: Drop tables (in correct order: child tables first)
-- ============================================

-- Drop step_template_modules (references step_templates and step_template_steps)
DROP TABLE IF EXISTS step_template_modules;

-- Drop step_template_steps (references step_templates)
DROP TABLE IF EXISTS step_template_steps;

-- Drop step_templates (parent table)
DROP TABLE IF EXISTS step_templates;

-- ============================================
-- Phase 4: Add indexes for performance
-- ============================================

-- Index for tasks.is_enabled (for filtering enabled tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_is_enabled ON tasks(is_enabled);

-- GIN Index for step_definitions.default_module_ids (for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_step_definitions_default_module_ids
ON step_definitions USING GIN (default_module_ids);

-- ============================================
-- Phase 5: Data integrity checks
-- ============================================

-- Verify instructors table still has selected_step_template_id (kept for audit)
-- This column is kept as-is for historical reference, no changes needed

-- Verify existing onboarding_steps and tasks are unchanged
-- No migration needed for existing instructor data

-- ============================================
-- Migration Summary
-- ============================================
-- Tables Added: 0
-- Tables Modified: 2 (step_definitions, tasks)
-- Tables Dropped: 3 (step_templates, step_template_steps, step_template_modules)
-- Fields Added: 2 (default_module_ids, is_enabled)
-- Indexes Added: 2
-- Foreign Keys Removed: 6
-- Data Migrated: None (existing data preserved)
-- ============================================

-- Note: Flyway manages transaction commits automatically, no explicit COMMIT needed
