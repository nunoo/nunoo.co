-- Add performance indexes for common queries
-- This migration adds optimized indexes for the users table

-- Index for email lookups (already unique, but explicit index for performance)
CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON users (email);

-- Partial index for active sessions (if we add last_login field in future)
-- CREATE INDEX IF NOT EXISTS idx_users_active ON users (id) WHERE last_login > NOW() - INTERVAL '30 days';

-- Index for created_at for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Analyze table for query planner
ANALYZE users;