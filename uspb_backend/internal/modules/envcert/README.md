# Environmental Certificate Management Module (`envcert`)

Handles business environmental clearance intake, status tracking, and automated monthly expiry checks for the **Health Division — Balangoda Urban Council (USPB)**.

## Database Table
- **`env_cert_businesses`** (`migrations/000002_env_cert_businesses.up.sql`)
- Supported statuses (`env_cert_status`): `PENDING`, `UNDER_INSPECTION`, `APPROVED`, `REJECTED`, `EXPIRED`

## API Endpoints (`/api/v1/environmental-certs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/environmental-certs` | List all registered environmental clearance applications |
| `GET` | `/api/v1/environmental-certs/:id` | Retrieve a single application record by ID |
| `POST` | `/api/v1/environmental-certs` | Register a new business environmental clearance application |
| `POST` | `/api/v1/environmental-certs/check-expiry` | Trigger an on-demand expiry scan for approved certificates |

## Scheduled Background Job
- Defined in `internal/jobs/monthly_cron.go` (`RunEnvCertExpiryCheck`).
- Runs on the 1st of every month (`0 0 1 * *`) and transitions `APPROVED` certificates whose `expiry_date` has passed to `EXPIRED`.