-- 000009_school_classes.down.sql
DROP POLICY IF EXISTS classes_teacher_school ON school_classes;
DROP POLICY IF EXISTS classes_council_all ON school_classes;
ALTER TABLE school_classes DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS school_classes;
