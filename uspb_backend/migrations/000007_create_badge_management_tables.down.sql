-- Migration 000005 Rollback: Drop Badge Management Tables
DROP TABLE IF EXISTS badge_award_audit_logs;
DROP TABLE IF EXISTS student_badge_awards;
DROP TABLE IF EXISTS badge_threshold_history;
DROP TABLE IF EXISTS badge_definitions;
DROP TABLE IF EXISTS students;
