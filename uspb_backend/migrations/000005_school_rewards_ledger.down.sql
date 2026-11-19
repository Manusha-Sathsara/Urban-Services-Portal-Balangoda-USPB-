-- 000005_school_rewards_ledger.down.sql

DROP POLICY IF EXISTS ledger_teacher_school ON point_transactions;
DROP POLICY IF EXISTS ledger_council_all ON point_transactions;
DROP POLICY IF EXISTS payouts_teacher_school ON reward_payouts;
DROP POLICY IF EXISTS payouts_council_all ON reward_payouts;
DROP POLICY IF EXISTS collection_items_all ON waste_collection_items;
DROP POLICY IF EXISTS collections_teacher_school ON waste_collections;
DROP POLICY IF EXISTS collections_council_all ON waste_collections;
DROP POLICY IF EXISTS students_teacher_school ON students;
DROP POLICY IF EXISTS students_council_all ON students;

ALTER TABLE point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_payouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collection_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS point_transactions;
DROP TABLE IF EXISTS reward_payouts;
DROP TABLE IF EXISTS waste_collection_items;
DROP TABLE IF EXISTS waste_collections;
DROP TABLE IF EXISTS students;
