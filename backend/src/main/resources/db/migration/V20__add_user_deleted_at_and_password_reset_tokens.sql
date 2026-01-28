-- ============================================
-- V17: Add user soft delete and password reset tokens
-- ============================================

-- Add deleted_at column to users table for soft delete
ALTER TABLE users 
ADD COLUMN deleted_at TIMESTAMP;

-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);

-- Add comments
COMMENT ON COLUMN users.deleted_at IS '회원 탈퇴 시간 (soft delete)';
COMMENT ON TABLE password_reset_tokens IS '비밀번호 재설정 토큰';
COMMENT ON COLUMN password_reset_tokens.token IS 'UUID 기반 토큰';
COMMENT ON COLUMN password_reset_tokens.expires_at IS '토큰 만료 시간 (1시간)';
COMMENT ON COLUMN password_reset_tokens.used_at IS '사용 완료 시간';
