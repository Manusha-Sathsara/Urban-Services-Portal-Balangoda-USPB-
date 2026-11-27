# Urban Services Portal Balangoda (USPB) — Project Documentation

> **Client:** Balangoda Urban Council  
> **Architecture:** Modular Monolith (`uspb_backend` in Go + Fiber) & Next.js App Router (`uspb_frontend` in TypeScript/Tailwind CSS)  
> **Database:** Self-hosted PostgreSQL 18 with Row-Level Security (RLS)

---

## 1. Project Overview & Modules

| Module | Owner(s) | Core Capabilities |
| :--- | :--- | :--- |
| **Authentication & Access Control** | Manusha | Staff-only accounts, HttpOnly JWT + rotating refresh tokens, CSRF protection, RBAC, teacher school-isolation, admin user CRUD, audit logs |
| **Garbage Fee Management** | Team | Business registration, annual fee assessments, payment recording, unpaid tracking, receipts |
| **Environmental Certificates** | Team | Applications, field inspections, approvals, monthly renewal checks, official stationery printing |
| **School Waste Rewards** | Manusha & Praneepa | Student management, waste collection logging, automatic point calculation (`Qty × Rate`), 1,000-pt redemptions preserving remainder, badges, council reports |

---

## 2. Live Progress Plan

| Phase | Scope | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1: DB & RLS** | `users` hardening, `auth_sessions`, `audit_logs`, Postgres RLS, `bootstrap_db.sql` | **Done** | Least-privilege `uspb_app` role (`NOBYPASSRLS`) |
| **Phase 2: Backend Auth** | `config`, `WithRLS`, JWT/CSRF/RBAC middleware, `auth` module, rate limiter, `seed_admin` | **Done** | Wired in `cmd/server/main.go` |
| **Phase 3: Backend Tests** | Unit & HTTP tests for config, middleware, lockout, refresh rotation, RBAC | **Done** | 10/10 Go tests passing |
| **Phase 4: Frontend Auth** | Cookie-based `api.ts`, `AuthProvider`, Figma-themed `/login`, `/change-password`, `/dashboard`, `/access-denied`, `/admin` user management | **Done** | Synced with `origin/dev` white/maroon theme |
| **Phase 5: Verification** | `eslint`, `next build`, `go test ./...`, live DB migration & end-to-end API/UI checks | **Done** | 10/10 backend tests + live browser E2E passing |
| **Phase 6: School Rewards** | Students, waste collections, points ledger, payouts, official council rates, Praneepa integration | **Done** | Sampath Kendraya 1,000-pt = Rs. 1,000/= + `unslop` UI |

---

## 3. Documentation Index
- [Architecture & Security](file:///d:/dev/Urban%20Services%20Portal%20Balangoda%20%28USPB%29/documentation/ARCHITECTURE_AND_SECURITY.md) — System architecture, auth sequence diagram, RBAC matrix, and Postgres RLS.
- [Database ERD](file:///d:/dev/Urban%20Services%20Portal%20Balangoda%20%28USPB%29/documentation/DATABASE_ERD.md) — Entity-Relationship diagrams for auth and planned business modules.
- [Testing & Changelog](file:///d:/dev/Urban%20Services%20Portal%20Balangoda%20%28USPB%29/documentation/TESTING_AND_CHANGELOG.md) — Test results, bugs resolved, and security decisions.
