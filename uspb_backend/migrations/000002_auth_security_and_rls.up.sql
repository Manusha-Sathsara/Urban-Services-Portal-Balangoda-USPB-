-- 000002_auth_security_and_rls.up.sql
-- Hardens users table, adds auth_sessions for rotating refresh tokens & revocation,
-- adds append-only audit_logs, and enables PostgreSQL Row-Level Security (RLS).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_hash ON auth_sessions(refresh_token_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL DEFAULT '',
    target_id VARCHAR(100) NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable and force Row-Level Security on auth tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Policies for users table
DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
    FOR ALL
    USING (current_setting('app.current_role', true) = 'ADMIN')
    WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

DROP POLICY IF EXISTS users_self_select ON users;
CREATE POLICY users_self_select ON users
    FOR SELECT
    USING (
        id = NULLIF(current_setting('app.current_user_id', true), '')::INT
        OR current_setting('app.auth_flow', true) = 'true'
    );

DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users
    FOR UPDATE
    USING (
        id = NULLIF(current_setting('app.current_user_id', true), '')::INT
        OR current_setting('app.auth_flow', true) = 'true'
    )
    WITH CHECK (
        id = NULLIF(current_setting('app.current_user_id', true), '')::INT
        OR current_setting('app.auth_flow', true) = 'true'
    );

-- Policies for auth_sessions table
DROP POLICY IF EXISTS sessions_admin_all ON auth_sessions;
CREATE POLICY sessions_admin_all ON auth_sessions
    FOR ALL
    USING (current_setting('app.current_role', true) = 'ADMIN')
    WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

DROP POLICY IF EXISTS sessions_self_manage ON auth_sessions;
CREATE POLICY sessions_self_manage ON auth_sessions
    FOR ALL
    USING (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INT
        OR current_setting('app.auth_flow', true) = 'true'
    )
    WITH CHECK (
        user_id = NULLIF(current_setting('app.current_user_id', true), '')::INT
        OR current_setting('app.auth_flow', true) = 'true'
    );

-- Policies for audit_logs (append-only for app flows, readable only by ADMIN)
DROP POLICY IF EXISTS audit_logs_insert_app ON audit_logs;
CREATE POLICY audit_logs_insert_app ON audit_logs
    FOR INSERT
    WITH CHECK (
        current_setting('app.auth_flow', true) = 'true'
        OR NULLIF(current_setting('app.current_user_id', true), '') IS NOT NULL
    );

DROP POLICY IF EXISTS audit_logs_admin_select ON audit_logs;
CREATE POLICY audit_logs_admin_select ON audit_logs
    FOR SELECT
    USING (current_setting('app.current_role', true) = 'ADMIN');
