-- 000009_school_classes.up.sql
-- Adds school_classes for class management per school with Postgres RLS.

CREATE TABLE IF NOT EXISTS school_classes (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    grade VARCHAR(30) NOT NULL,
    class_name VARCHAR(30) NOT NULL,
    teacher_in_charge VARCHAR(255) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, grade, class_name)
);

CREATE INDEX IF NOT EXISTS idx_school_classes_school ON school_classes(school_id);

ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_council_all ON school_classes;
CREATE POLICY classes_council_all ON school_classes
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS classes_teacher_school ON school_classes;
CREATE POLICY classes_teacher_school ON school_classes
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    )
    WITH CHECK (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    );
