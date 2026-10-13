# Urban Services Portal Balangoda (USPB)
## Phase 1: Project Structuring & Initialization Guide for Antigravity

**CONTEXT FOR AI ASSISTANT (ANTIGRAVITY):**
The human developer has already completed the following steps:
1. Created the root project folder.
2. Initialized Git in the root folder.
3. Created the frontend directory (`uspb_frontend`) initialized with Next.js 14 (App Router), TypeScript, Tailwind CSS, and React Compiler.

**YOUR OBJECTIVE:** 
Your task is to structure the rest of the workspace, initialize the Go backend, set up the required environment files, and establish the Git commit baseline. 

---

### Step 1: Frontend Folder Structuring (`uspb_frontend`)
Navigate to `uspb_frontend` and scaffold the internal directory structure for a scalable Next.js application.

1. **Create the following directory tree:**
   ```text
   uspb_frontend/
   ├── app/
   │   ├── (auth)/
   │   │   └── login/page.tsx
   │   ├── (dashboard)/
   │   │   ├── layout.tsx
   │   │   ├── admin/
   │   │   ├── garbage-fees/
   │   │   ├── environmental/
   │   │   └── schools/
   ├── components/
   │   ├── ui/               # shadcn/ui components will go here
   │   ├── shared/           # DataTables, StatCards, Modals
   │   └── layouts/          # Sidebar, Header components
   ├── lib/
   │   ├── api.ts            # Axios client with JWT interceptors
   │   └── utils.ts          # Tailwind merge utilities (clsx, twMerge)
   ├── types/                # TS Interfaces matching Go structs
   └── .env.example          # Template for frontend environment variables
   ```

2. **Environment Variables:** Create `.env.example` and `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

---

### Step 2: Backend Initialization (`uspb_backend`)

Return to the root directory and initialize the Go backend for a Modular Monolith architecture.

1. **Initialize the Go Module:**
```bash
mkdir uspb_backend
cd uspb_backend
go mod init github.com/BalangodaUC/uspb_backend
```

2. **Install Core Dependencies:**
```bash
go get -u github.com/gofiber/fiber/v2
go get -u github.com/jmoiron/sqlx
go get -u github.com/jackc/pgx/v5
go get -u github.com/golang-jwt/jwt/v5
go get -u golang.org/x/crypto/bcrypt
go get -u github.com/robfig/cron/v3
go get -u github.com/joho/godotenv
```

3. **Create the Directory Tree:**
```text
uspb_backend/
├── cmd/
│   └── server/
│       └── main.go       # Fiber app initialization and router setup
├── internal/
│   ├── middleware/       # jwt.go, rbac.go
│   ├── modules/
│   │   ├── garbagefee/   # handler.go, service.go, repository.go
│   │   ├── envcert/      # handler.go, service.go, repository.go
│   │   └── schoolrewards/# handler.go, service.go, repository.go
│   └── jobs/             # monthly_cron.go
├── pkg/
│   ├── database/         # postgres.go (sqlx connection pool)
│   └── utils/            # hash.go, response.go
├── migrations/           # Directory for golang-migrate .sql files
├── .env.example
└── .env
```

4. **Environment Variables:** Create `.env.example` and `.env`:
```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=uspb_db
DB_SSLMODE=disable
JWT_SECRET=super_secret_key_change_in_production
```

---

### Step 3: Database Migration Setup

The project uses `golang-migrate` for PostgreSQL schema management.

1. Create the first migration files in `uspb_backend/migrations/`:
```bash
# (If golang-migrate is installed locally, otherwise create manually)
migrate create -ext sql -dir migrations -seq init_schema
```

2. Populate `000001_init_schema.up.sql` with the Users and Roles schema.
3. Populate `000001_init_schema.down.sql` with the DROP commands.

---

### Step 4: Git Protocol & Commit Instructions (CRITICAL)

Before executing code or moving to the next sprint task, you must commit the scaffolding.

1. **Stage all changes:** `git add .`
2. **Commit using Conventional Commits.** Do NOT use generic messages like "setup folders".
* Execute: `git commit -m "chore: scaffold frontend and backend directory structures for USPB"`
* Execute: `git commit -m "build(go): initialize go.mod and install core fiber, sqlx, and jwt dependencies"`

3. **Future Commits Reminder:** For all future tasks, you must commit atomic changes using `feat:`, `fix:`, `refactor:`, or `chore:` prefixes.

### Antigravity Execution Trigger:

Please begin executing Step 1 and Step 2. Once complete, confirm the directory structures and ask the human user to provide the initial SQL schema for Step 3.
