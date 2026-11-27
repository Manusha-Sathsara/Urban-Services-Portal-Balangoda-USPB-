-- Migration 000007: Create Badge Definitions, Threshold History, and Awards tables

-- 1. Badge Definitions Table
CREATE TABLE IF NOT EXISTS badge_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Award',
    milestone_threshold NUMERIC(10, 2) NOT NULL CHECK (milestone_threshold > 0),
    eligibility_metric VARCHAR(50) NOT NULL DEFAULT 'lifetime_earned' CHECK (eligibility_metric IN ('lifetime_earned', 'available_points')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badges_status ON badge_definitions(status);
CREATE INDEX IF NOT EXISTS idx_badges_name ON badge_definitions(name);

-- 3. Badge Threshold History Table (for audit trail of threshold revisions)
CREATE TABLE IF NOT EXISTS badge_threshold_history (
    id SERIAL PRIMARY KEY,
    badge_id INT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    milestone_threshold NUMERIC(10, 2) NOT NULL,
    eligibility_metric VARCHAR(50) NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    reason TEXT NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badge_threshold_history_badge_id ON badge_threshold_history(badge_id);

-- 4. Student Badge Awards Table
CREATE TABLE IF NOT EXISTS student_badge_awards (
    id SERIAL PRIMARY KEY,
    award_reference VARCHAR(50) NOT NULL UNIQUE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    badge_id INT NOT NULL REFERENCES badge_definitions(id) ON DELETE RESTRICT,
    qualifying_points NUMERIC(10, 2) NOT NULL,
    threshold_at_award NUMERIC(10, 2) NOT NULL,
    award_date DATE NOT NULL DEFAULT CURRENT_DATE,
    awarded_by VARCHAR(150) NOT NULL,
    notes TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'awarded' CHECK (status IN ('awarded', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_badge UNIQUE (student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_awards_student ON student_badge_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_awards_badge ON student_badge_awards(badge_id);
CREATE INDEX IF NOT EXISTS idx_awards_date ON student_badge_awards(award_date);
CREATE INDEX IF NOT EXISTS idx_awards_status ON student_badge_awards(status);

-- 5. Badge Award Audit Logs Table
CREATE TABLE IF NOT EXISTS badge_award_audit_logs (
    id SERIAL PRIMARY KEY,
    award_id INT NOT NULL REFERENCES student_badge_awards(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_award_audit_award_id ON badge_award_audit_logs(award_id);

-- 6. Seed Initial Balangoda School Eco-Rewards Badges
INSERT INTO badge_definitions (id, name, description, icon_name, milestone_threshold, eligibility_metric, status, created_at, updated_at)
VALUES 
    (1, 'Eco-Sprout', 'Awarded to students embarking on their segregation journey with initial recyclable deposits.', 'Leaf', 50.00, 'lifetime_earned', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (2, 'Waste Warrior', 'Recognizes disciplined sorting habits and sustained participation in classroom waste separation.', 'ShieldCheck', 100.00, 'lifetime_earned', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (3, 'Recycling Champion', 'Honors students who consistently meet high recyclable yield milestones in school collections.', 'Sparkles', 250.00, 'lifetime_earned', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (4, 'Green Ambassador', 'Bestowed upon exemplary student leaders driving community environmental consciousness.', 'Award', 500.00, 'lifetime_earned', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (5, 'Balangoda Green Guardian', 'The highest municipal environmental distinction awarded by the Balangoda Urban Council.', 'Crown', 1000.00, 'lifetime_earned', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
ON CONFLICT (name) DO NOTHING;

SELECT setval('badge_definitions_id_seq', (SELECT MAX(id) FROM badge_definitions));

-- Seed Initial Threshold Histories for Baseline Badges
INSERT INTO badge_threshold_history (badge_id, milestone_threshold, eligibility_metric, effective_from, effective_to, reason, changed_by, created_at)
VALUES
    (1, 50.00, 'lifetime_earned', NOW() - INTERVAL '30 days', NULL, 'Municipal baseline threshold established', 'SYSTEM_ADMIN', NOW() - INTERVAL '30 days'),
    (2, 100.00, 'lifetime_earned', NOW() - INTERVAL '30 days', NULL, 'Municipal baseline threshold established', 'SYSTEM_ADMIN', NOW() - INTERVAL '30 days'),
    (3, 250.00, 'lifetime_earned', NOW() - INTERVAL '30 days', NULL, 'Municipal baseline threshold established', 'SYSTEM_ADMIN', NOW() - INTERVAL '30 days'),
    (4, 500.00, 'lifetime_earned', NOW() - INTERVAL '30 days', NULL, 'Municipal baseline threshold established', 'SYSTEM_ADMIN', NOW() - INTERVAL '30 days'),
    (5, 1000.00, 'lifetime_earned', NOW() - INTERVAL '30 days', NULL, 'Municipal baseline threshold established', 'SYSTEM_ADMIN', NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;
