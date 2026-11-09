# Testing Log, Decisions & Issue Tracker

## 1. Automated Backend Test Results (`go test -v -count=1 ./...`)

| Package | Test Cases | Status | Verified Behavior |
| :--- | :--- | :--- | :--- |
| `internal/config` | `TestLoadRejectsShortJWTSecret`, `TestLoadRejectsPlaceholderInProduction`, `TestLoadValidConfigDefaults` | **PASS** | Rejects weak/placeholder `JWT_SECRET`, validates defaults |
| `internal/middleware` | `TestJWTMiddleware_CookieAndBearerAndRevocation`, `TestRequireRolesAndSchoolScope`, `TestCSRFMiddleware` | **PASS** | Cookie & Bearer auth, revoked session -> 401, cross-school teacher -> 403, missing CSRF -> 403 |
| `internal/modules/auth` | `TestLogin_SuccessAndLockout`, `TestRefresh_RotationAndReuseDetection`, `TestAdminCreateTeacherRequiresSchoolAndDeactivateRevokesSessions`, `TestHandler_LoginMeLogoutFlow` | **PASS** | Lockout after threshold, refresh rotation & reuse revocation, teacher `school_id` enforcement, login -> me -> 403 -> logout -> 401 |

---

## 2. Issues & Bugs Resolved During Development

| Date | Area | Issue Found | Resolution |
| :--- | :--- | :--- | :--- |
| Oct 22 | Middleware | Original `jwt.go` used `Email` claim and hardcoded fallback `JWT_SECRET` | Replaced with `Username`, `SchoolID`, `SessionID` claims; moved secret validation to `config.Load()` |
| Oct 29 | Auth Cookies | Original `api.ts` stored JWT in `localStorage` (XSS risk) | Migrated backend & frontend to `HttpOnly` cookies + `X-CSRF-Token` double-submit |
| Nov 1 | Go Build | `fiber/middleware/limiter` failed compilation due to missing `github.com/tinylib/msgp/msgp` in `go.sum` | Ran `go get github.com/gofiber/fiber/v2/middleware/limiter@v2.52.15` and `go mod tidy` |
| Nov 9 | Theme Sync | `feat/auth-module` had old Oct 14 green theme | Merged `origin/dev` to adopt Balangoda UC white/maroon/gold Figma theme |

---

## 3. Architectural Decisions
- **ADR-001 (Cookie + CSRF vs. `localStorage` Bearer)**: Chose `HttpOnly` cookies for browser sessions to prevent XSS token theft, while retaining `Authorization: Bearer` support for `curl`/Postman API testing.
- **ADR-002 (PostgreSQL RLS)**: Enabled `FORCE ROW LEVEL SECURITY` on `users`, `auth_sessions`, and `audit_logs` with transaction-local `set_config` via `database.WithRLS` so data isolation is enforced at the database layer as well as Go middleware.
