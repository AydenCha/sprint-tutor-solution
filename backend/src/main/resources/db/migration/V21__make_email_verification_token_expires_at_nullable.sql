-- ============================================
-- V18: Make email verification token expires_at nullable (remove time limit)
-- ============================================

-- Make expires_at nullable to allow unlimited email verification tokens
ALTER TABLE email_verification_tokens 
ALTER COLUMN expires_at DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN email_verification_tokens.expires_at IS '토큰 만료 시간 (null이면 만료 없음)';
