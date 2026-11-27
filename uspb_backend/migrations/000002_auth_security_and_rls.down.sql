-- 000002_auth_security_and_rls.down.sql

DROP POLICY IF EXISTS audit_logs_admin_select ON audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_app ON audit_logs;
DROP POLICY IF EXISTS sessions_self_manage ON auth_sessions;
DROP POLICY IF EXISTS sessions_admin_all ON auth_sessions;
DROP POLICY IF EXISTS users_self_update ON users;
DROP POLICY IF EXISTS users_self_select ON users;
DROP POLICY IF EXISTS users_admin_all ON users;

ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS auth_sessions;

ALTER TABLE users
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS locked_until,
    DROP COLUMN IF EXISTS failed_login_attempts,
    DROP COLUMN IF EXISTS must_change_password,
    DROP COLUMN IF EXISTS is_active;
