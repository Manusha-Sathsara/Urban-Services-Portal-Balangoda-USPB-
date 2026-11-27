-- 000005_school_rewards_ledger.up.sql
-- Students (per Sampath Kendraya 3R Society registration form), waste collections,
-- authoritative point_transactions ledger, and 1000-pt reward_payouts with Postgres RLS.

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    membership_no VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    name_with_initials VARCHAR(255) NOT NULL DEFAULT '',
    grade VARCHAR(30) NOT NULL DEFAULT '',
    class_name VARCHAR(30) NOT NULL DEFAULT '',
    date_of_birth DATE NULL,
    address TEXT NOT NULL DEFAULT '',
    guardian_name VARCHAR(255) NOT NULL DEFAULT '',
    guardian_phone VARCHAR(50) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cached_available_points NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_by INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, membership_no)
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);

CREATE TABLE IF NOT EXISTS waste_collections (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    recorded_by INT NOT NULL REFERENCES users(id),
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_points NUMERIC(12, 2) NOT NULL CHECK (total_points > 0),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    notes TEXT NOT NULL DEFAULT '',
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_by INT NULL REFERENCES users(id),
    reversal_reason TEXT NOT NULL DEFAULT '',
    reversed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waste_collections_school_student ON waste_collections(school_id, student_id);

CREATE TABLE IF NOT EXISTS waste_collection_items (
    id SERIAL PRIMARY KEY,
    collection_id INT NOT NULL REFERENCES waste_collections(id) ON DELETE CASCADE,
    category_id INT NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    measurement_unit VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    rate_snapshot NUMERIC(10, 2) NOT NULL CHECK (rate_snapshot > 0),
    points_earned NUMERIC(12, 2) NOT NULL CHECK (points_earned > 0)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON waste_collection_items(collection_id);

CREATE TABLE IF NOT EXISTS reward_payouts (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    recorded_by INT NOT NULL REFERENCES users(id),
    points_deducted NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (points_deducted = 1000.00),
    amount_lkr NUMERIC(12, 2) NOT NULL DEFAULT 1000.00 CHECK (amount_lkr = 1000.00),
    physical_card_ref VARCHAR(100) NOT NULL DEFAULT '',
    receipt_no VARCHAR(100) NOT NULL DEFAULT '',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'reversed')),
    reversed_by INT NULL REFERENCES users(id),
    reversal_reason TEXT NOT NULL DEFAULT '',
    reversed_at TIMESTAMPTZ NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_payouts_school_student ON reward_payouts(school_id, student_id);

CREATE TABLE IF NOT EXISTS point_transactions (
    id BIGSERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    tx_type VARCHAR(32) NOT NULL CHECK (tx_type IN ('EARN_COLLECTION', 'REDEEM_PAYOUT', 'COLLECTION_REVERSAL', 'PAYOUT_REVERSAL', 'ADJUSTMENT')),
    points_delta NUMERIC(12, 2) NOT NULL,
    reference_type VARCHAR(40) NOT NULL,
    reference_id INT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    note TEXT NOT NULL DEFAULT '',
    created_by INT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_student ON point_transactions(student_id, created_at DESC);

-- Enable & force Row-Level Security on all 5 tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;

ALTER TABLE waste_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections FORCE ROW LEVEL SECURITY;

ALTER TABLE waste_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collection_items FORCE ROW LEVEL SECURITY;

ALTER TABLE reward_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_payouts FORCE ROW LEVEL SECURITY;

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions FORCE ROW LEVEL SECURITY;

-- Policies: ADMIN & GARBAGE_SUPERVISOR have full council access; TEACHER is strictly isolated to app.current_school_id
DROP POLICY IF EXISTS students_council_all ON students;
CREATE POLICY students_council_all ON students
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS students_teacher_school ON students;
CREATE POLICY students_teacher_school ON students
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    )
    WITH CHECK (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    );

DROP POLICY IF EXISTS collections_council_all ON waste_collections;
CREATE POLICY collections_council_all ON waste_collections
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS collections_teacher_school ON waste_collections;
CREATE POLICY collections_teacher_school ON waste_collections
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    )
    WITH CHECK (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    );

DROP POLICY IF EXISTS collection_items_all ON waste_collection_items;
CREATE POLICY collection_items_all ON waste_collection_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM waste_collections wc
            WHERE wc.id = waste_collection_items.collection_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM waste_collections wc
            WHERE wc.id = waste_collection_items.collection_id
        )
    );

DROP POLICY IF EXISTS payouts_council_all ON reward_payouts;
CREATE POLICY payouts_council_all ON reward_payouts
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS payouts_teacher_school ON reward_payouts;
CREATE POLICY payouts_teacher_school ON reward_payouts
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    )
    WITH CHECK (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    );

DROP POLICY IF EXISTS ledger_council_all ON point_transactions;
CREATE POLICY ledger_council_all ON point_transactions
    FOR ALL
    USING (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'))
    WITH CHECK (current_setting('app.current_role', true) IN ('ADMIN', 'GARBAGE_SUPERVISOR'));

DROP POLICY IF EXISTS ledger_teacher_school ON point_transactions;
CREATE POLICY ledger_teacher_school ON point_transactions
    FOR ALL
    USING (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    )
    WITH CHECK (
        current_setting('app.current_role', true) = 'TEACHER'
        AND school_id = NULLIF(current_setting('app.current_school_id', true), '')::INT
    );
