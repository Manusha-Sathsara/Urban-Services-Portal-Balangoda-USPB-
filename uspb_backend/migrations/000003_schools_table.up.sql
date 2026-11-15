-- 000003_schools_table.up.sql
-- Adds schools registry for teacher assignment and school-level isolation.

CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schools_admin_all ON schools;
CREATE POLICY schools_admin_all ON schools
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS schools_auth_read ON schools;
CREATE POLICY schools_auth_read ON schools
    FOR SELECT
    USING (NULLIF(current_setting('app.current_user_id', true), '') IS NOT NULL);
