# Architecture & Security Design

## 1. Modular Monolith Architecture

```mermaid
flowchart LR
    Browser["Next.js Frontend (:3100)"] -->|HTTPS + HttpOnly Cookies + X-CSRF-Token| Fiber["Go Fiber API (:8080)"]
    Fiber --> MW["Middleware: Recover, Logger, CORS, RateLimit, JWT, CSRF, RBAC"]
    MW --> AuthMod["internal/modules/auth"]
    MW --> GFMod["internal/modules/garbagefee"]
    MW --> EnvMod["internal/modules/envcert"]
    MW --> SRMod["internal/modules/schoolrewards"]
    AuthMod --> RLS["database.WithRLS (SET LOCAL app.current_user_id / role)"]
    RLS --> PG["PostgreSQL (uspb_auth_db, role: uspb_app)"]
```

---

## 2. Authentication & Session Lifecycle

```mermaid
sequenceDiagram
    participant U as Staff Browser
    participant API as Go Fiber (/api/v1/auth)
    participant DB as PostgreSQL (RLS)

    U->>API: POST /auth/login {username, password}
    API->>DB: WithRLS(auth_flow=true) -> Lookup user & verify bcrypt
    API->>DB: Insert auth_sessions (hashed refresh token) + audit_logs
    API-->>U: 200 OK + Set-Cookie: uspb_access_token (HttpOnly), uspb_refresh_token (HttpOnly), uspb_csrf_token
    U->>API: GET /auth/me (Cookie: uspb_access_token)
    API->>DB: IsSessionActive(session_id, user_id)
    API-->>U: 200 OK {user}
    U->>API: POST /auth/logout (Cookie + X-CSRF-Token)
    API->>DB: Revoke session (revoked_at = NOW()) + audit_logs
    API-->>U: 200 OK + Clear cookies
```

---

## 3. Role-Based Access Control (RBAC) & School Isolation

| Role | Default Dashboard | Permitted Modules | Scope Constraint |
| :--- | :--- | :--- | :--- |
| `ADMIN` | `/admin` | Auth Admin (`/admin/users`, `/admin/audit-logs`), read summaries | System-wide |
| `FEE_OFFICER` | `/garbage-fees` | Garbage Fee Management | Module-wide |
| `ENV_OFFICER` | `/environmental` | Environmental Certificates | Module-wide |
| `GARBAGE_SUPERVISOR` | `/schools` | School Waste Rewards (council-wide, rates, reports) | All schools |
| `TEACHER` | `/schools` | School Waste Rewards (students, collections, payouts) | **Single assigned `school_id` only** |

---

## 4. Key Security Controls
1. **Least-Privilege Database Role**: Application connects as `uspb_app` (`NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`) to isolated database `uspb_auth_db`.
2. **PostgreSQL Row-Level Security (RLS)**: `FORCE ROW LEVEL SECURITY` enabled on `users`, `auth_sessions`, and `audit_logs`. Every repository call runs inside `database.WithRLS` which sets transaction-local `app.current_user_id`, `app.current_role`, and `app.auth_flow`.
3. **No `localStorage` Tokens**: Access and refresh tokens are stored strictly in `HttpOnly` cookies; state-changing requests require a matching `X-CSRF-Token` header (double-submit cookie).
4. **Refresh Token Rotation & Reuse Detection**: Each `/auth/refresh` rotates the opaque refresh token hash. Presenting a previously revoked refresh token revokes **all** active sessions for that user.
5. **Brute-Force Protection**: IP-based rate limiting on `/auth/login` plus per-account lockout (`failed_login_attempts`, `locked_until`).
6. **Fail-Fast Config**: `config.Load()` rejects missing or short (`< 32` chars) `JWT_SECRET` at startup.
