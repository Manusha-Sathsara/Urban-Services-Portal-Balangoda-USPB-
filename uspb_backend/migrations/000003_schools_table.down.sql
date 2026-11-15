-- 000003_schools_table.down.sql

DROP POLICY IF EXISTS schools_auth_read ON schools;
DROP POLICY IF EXISTS schools_admin_all ON schools;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS schools;
