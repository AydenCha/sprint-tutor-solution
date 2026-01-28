-- ============================================
-- V14: Create audit_logs table
-- ============================================
-- This migration creates the audit_logs table if it doesn't exist
-- and ensures proper data types for all columns

BEGIN;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    performed_by_pm_id BIGINT,
    old_value JSONB,
    new_value JSONB,
    description TEXT,
    metadata JSONB,
    action_time TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_log_performed_by 
        FOREIGN KEY (performed_by_pm_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_logs(performed_by_pm_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_time ON audit_logs(action_time);

-- Ensure users table has correct column types (VARCHAR/TEXT, not BYTEA)
-- Check and fix if needed
DO $$
BEGIN
    -- Check if name column exists and is not the correct type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name' 
        AND data_type = 'bytea'
    ) THEN
        ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(255) USING name::text;
    END IF;
    
    -- Check if email column exists and is not the correct type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email' 
        AND data_type = 'bytea'
    ) THEN
        ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255) USING email::text;
    END IF;
END $$;

COMMIT;
