-- bootstrap_db.sql
-- Run once as PostgreSQL superuser (e.g. postgres) to provision an isolated
-- database and a least-privilege application role (NOSUPERUSER, NOBYPASSRLS).
-- Replace 'CHANGE_ME_STRONG_PASSWORD' before running, or pass via psql -v app_pw=...

\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'uspb_app') THEN
        CREATE ROLE uspb_app WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD'
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;
END
$$;

SELECT 'CREATE DATABASE uspb_auth_db OWNER uspb_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'uspb_auth_db')\gexec

\connect uspb_auth_db

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO uspb_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO uspb_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO uspb_app;
