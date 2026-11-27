# Urban Services Portal Balangoda (USPB)
## Municipal Community & School Waste Rewards Management Platform
### Balangoda Urban Council (BUC) — Sabaragamuwa Province, Sri Lanka

[![Branch](https://img.shields.io/badge/branch-feat%2Fpraneepa--school--rewards-maroon)](https://github.com/BalangodaUC/Urban-Services-Portal-Balangoda-USPB-)
[![Go Backend](https://img.shields.io/badge/backend-Go%201.24%20%7C%20Fiber%20v2-00ADD8?logo=go)](uspb_backend/)
[![Next.js Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%7C%20TypeScript%20%7C%20Tailwind-black?logo=next.js)](uspb_frontend/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%2015+-336791?logo=postgresql)](uspb_backend/migrations/)

---

## 1. Executive Overview

The **Urban Services Portal Balangoda (USPB)** is the official municipal administration platform designed for the **Balangoda Urban Council (BUC)** to digitize public health administration, garbage collection billing, environmental certification, and educational waste rewards.

This branch (`feat/praneepa-school-rewards`) delivers the complete, audited implementation of the **School Waste Rewards Management** subsystem, encompassing three core administrative and student recognition modules:

1. **School Management**: Onboards and oversees participating primary and secondary schools in the Balangoda urban limits, assigns municipal codes, tracks administrative contacts, manages active/inactive status, and dynamically computes municipal coverage KPIs.
2. **Waste Category Management**: Governs authorized recyclable waste streams (Plastic & PET, Paper & Cardboard, Metal Cans, Glass, E-Waste), standard measurement units (`kg`), baseline points rates, and enforces **immutable, auditable rate history** with measurement unit locks for transactional integrity.
3. **Badge Configuration, Eligibility & Award Management**: Configures municipal eco-milestones, computes student eligibility through an isolated points engine, manages bestowals with physical medal tracking, freezes award-time thresholds, supports **post-bestowal award status modifications (`awarded` <-> `revoked`)** with complete council audit logging, enforces teacher school scoping, and exports official committee CSV ledgers.

---

## 2. Monorepo Architecture & Technology Stack

The project adheres strictly to a decoupled monorepo architecture:

```
Urban-Services-Portal-Balangoda-USPB-/
├── uspb_backend/               # Go REST API Backend
│   ├── cmd/server/main.go      # Fiber application entrypoint & routing
│   ├── internal/
│   │   ├── middleware/         # JWT authentication, RBAC, school scoping
│   │   └── modules/
│   │       ├── auth/           # Login, demo-token issuance
│   │       └── schoolrewards/  # Schools, categories, badges, awards, points ledger
│   ├── migrations/             # golang-migrate SQL scripts (000001 - 000005)
│   └── go.mod
│
├── uspb_frontend/              # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/(dashboard)/    # Next.js App Router (schools, categories, badges)
│   │   ├── components/         # Reusable municipal UI tables, modals, cards
│   │   ├── services/           # Axios API service integrations
│   │   ├── types/              # TypeScript interfaces matching backend models
│   │   └── lib/                # Axios instance, interceptors, routing
│   ├── tailwind.config.ts      # Balangoda municipal maroon theme (#800000)
│   └── package.json
│
└── README.md                   # Single Authoritative Repository Documentation
```

### Technology Matrix

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Go 1.24, Fiber v2, SQLx, PGX v5 driver, Golang-JWT v5, Bcrypt |
| **Database** | PostgreSQL 15+ (with automatic thread-safe in-memory repository fallback for zero-setup local dev) |
| **Design Language** | Balangoda Municipal Palette: Maroon (`#800000`), Dark Crimson (`#680000`), Warm Slate, Off-White |

---

## 3. Subsystem Modules & Functional Specifications

### 3.1. School Management (`/schools`)
- **Municipal School Registry**: Onboards participating educational institutions with registration code, institutional name, address, telephone, principal contact, and grade tiers.
- **Operational Status Management**: Single-click activation / deactivation with protection against deleting historical records.
- **Dynamic Coverage KPI**: Automatically calculates and displays council coverage percentage:
  $$\text{Program Coverage (\%)} = \left(\frac{\text{Active Schools}}{\text{Total Registered Schools}}\right) \times 100$$
- **Search & Filter Controls**: Real-time substring search by school code, name, or address, with status tabs (`All`, `Active`, `Inactive`).

### 3.2. Waste Category Management (`/categories`)
- **Authorized Waste Catalog**: Manages recyclable categories, descriptions, measurement units (`kg`), active points per unit, and status.
- **Measurement Unit Lock**: If a category has been utilized in historical collections, modifying its measurement unit is blocked (`409 Conflict`) to prevent corrupting historical weight logs.
- **Immutable Rate History & Auditing**:
  - Whenever a point rate changes (e.g. 10.0 $\to$ 12.0 pts/kg), the previous rate record in `category_rate_history` is closed (`effective_to = NOW()`).
  - A new rate record is inserted (`effective_from = NOW()`, `effective_to = NULL`, revision reason, authorizing officer).
  - Rate revisions apply **only to future collections**; past collections permanently preserve their original transaction rate and are **never recalculated**.
- **Rate Timeline Modal**: Visual chronological timeline inspecting past rates, effective intervals, and council justifications.

### 3.3. Badge Configuration, Eligibility & Award Management (`/badges`)
- **Badge Catalog & Milestones (Tab 1)**:
  - Configure milestone thresholds with dynamic Lucide icons (`Leaf`, `ShieldCheck`, `Sparkles`, `Award`, `Crown`, etc.).
  - Revising thresholds automatically archives the previous threshold to `badge_threshold_history`.
- **Student Eligibility Management (Tab 2)**:
  - Candidate roster displaying student ID, school name, badge milestone, required threshold, qualifying points, progress bar, and eligibility status (`Eligible`, `In Progress`, `Awarded`).
  - Multi-facet filtering by School, Badge, Eligibility (`All`, `Eligible Only`, `In Progress`), and Award Status (`Not Yet Awarded`, `Awarded`).
  - **Authoritative Points Verification**: Student points are fetched directly from the backend points ledger; frontend-submitted point values are rejected.
  - Single-click **Bestow Badge** action for eligible students.
- **Award History & Ledger (Tab 3)**:
  - Municipal Award Ledger recording unique reference (`AWD-YYYY-XXXX`), student, school, badge, date, conferring officer, and status (`Awarded` vs `Revoked`).
  - **Post-Bestowal Status Modification (`awarded` $\leftrightarrow$ `revoked`)**:
    - Supervisors or teachers (within their school) can revoke an award (e.g. physical verification failed, administrative error) or reinstate a revoked award.
    - Every status change requires an official municipal reason and creates an immutable entry in `badge_award_audit_logs`.
    - Revoking an award decrements `total_awards` and marks the badge as un-awarded for the student in eligibility rosters.
  - **Audit Detail Certificate**: View modal rendering the official Balangoda Urban Council certificate with frozen award threshold and student points.
  - **Official CSV Export**: RFC 4180 compliant CSV export with active status, school, badge, and date filters.

---

## 4. Integration Contracts (For External Modules / Manusha)

### 4.1. School Waste Collection Logging Integration
As part of the concurrent development with the Waste Collection Logging module (Manusha):

1. **Backend-Authoritative Pricing**: The collection logging frontend must **never** calculate or submit `points_earned`. The backend service queries the category's active point rate at commit time.
2. **Active Categories Endpoint**: Populates the collection form dropdown with active categories only:
   - **Method**: `GET`
   - **Endpoint**: `/api/v1/categories/active`
   - **Access**: Bearer JWT (`TEACHER`, `GARBAGE_SUPERVISOR`, `ADMIN`)
3. **Recommended Collection Recording Logic (Go)**:
   ```go
   func (s *collectionService) RecordCollection(req *RecordCollectionRequest, teacherEmail string) (*CollectionRecord, error) {
       // 1. Authoritative active category check
       cat, err := s.categoryRepo.GetByID(req.CategoryID)
       if err != nil || cat.Status != "active" {
           return nil, errors.New("cannot log collections for an inactive category")
       }
       // 2. Lock in point rate and points earned at commit time
       pointsEarned := req.Quantity * cat.CurrentPointsPerUnit
       record := &CollectionRecord{
           SchoolID:     req.SchoolID,
           CategoryID:   cat.ID,
           Quantity:     req.Quantity,
           Unit:         cat.MeasurementUnit,
           AppliedRate:  cat.CurrentPointsPerUnit,
           PointsEarned: pointsEarned,
           RecordedBy:   teacherEmail,
           RecordedAt:   time.Now(),
       }
       return s.collectionRepo.Insert(record)
   }
   ```

### 4.2. Points Policy Isolation (`PointsLedgerProvider`)
Because the council has not finalized whether milestone badges will evaluate **lifetime earned points** or **net available points**, the badge subsystem isolates points retrieval behind an abstract interface:

```go
type StudentPoints struct {
    StudentID       int     `json:"student_id"`
    LifetimeEarned  float64 `json:"lifetime_earned"`
    AvailablePoints float64 `json:"available_points"`
}

type PointsLedgerProvider interface {
    GetStudentPoints(studentID int) (*StudentPoints, error)
    GetBatchStudentPoints(studentIDs []int) (map[int]*StudentPoints, error)
}
```

- When Manusha's `student_collections` table is migrated, `sqlPointsLedgerProvider` queries live sums:
  ```sql
  SELECT COALESCE(SUM(points_earned), 0) FROM student_collections WHERE student_id = $1;
  ```
- If not yet migrated or during local standalone development, it falls back gracefully to baseline student records without throwing exceptions.
- Changing council policy (`lifetime_earned` vs `available_points`) is done in a single backend function (`resolvePoints`) without requiring database migrations or changes to award records.

---

## 5. Security & Multi-Tenant School Scoping

1. **Role-Based Access Control (RBAC)**:
   - `ADMIN` & `GARBAGE_SUPERVISOR`: Council-wide management privileges. Can configure badges, revise thresholds, view all schools, and bestow/revoke awards.
   - `TEACHER`: Restricted strictly to their assigned school (`school_id`).
2. **Teacher School Scoping**:
   - The Go Fiber backend automatically extracts `SchoolID` from authenticated JWT claims.
   - Teachers querying eligibility or awards are scoped exclusively to their school (`school_id`).
   - If a teacher attempts to bestow or modify a badge award for a student outside their assigned school, the backend rejects the request with `403 Forbidden: teachers can only manage awards for their assigned school`.

---

## 6. Database Architecture & Migrations

All tables are created via sequential migration files in `uspb_backend/migrations/`:

```
000001_create_schools_table.up.sql
000002_create_users_table.up.sql
000003_create_garbage_fees_tables.up.sql
000004_create_waste_categories_tables.up.sql
000005_create_badge_management_tables.up.sql
```

### Core Schema Definitions:

```sql
-- 1. Schools
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(20) NOT NULL UNIQUE,
    school_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    principal_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Recyclable Waste Categories
CREATE TABLE IF NOT EXISTS garbage_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    measurement_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    current_points_per_unit NUMERIC(10, 2) NOT NULL CHECK (current_points_per_unit > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Category Rate History (Audit Log)
CREATE TABLE IF NOT EXISTS category_rate_history (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES garbage_categories(id) ON DELETE CASCADE,
    points_per_unit NUMERIC(10, 2) NOT NULL CHECK (points_per_unit > 0),
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    reason TEXT NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Students
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_identifier VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(75) NOT NULL,
    last_name VARCHAR(75) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Badge Definitions
CREATE TABLE IF NOT EXISTS badge_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name VARCHAR(50) NOT NULL DEFAULT 'Award',
    milestone_threshold NUMERIC(10, 2) NOT NULL CHECK (milestone_threshold > 0),
    eligibility_metric VARCHAR(30) NOT NULL DEFAULT 'lifetime_earned' CHECK (eligibility_metric IN ('lifetime_earned', 'available_points')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Badge Threshold Revision History
CREATE TABLE IF NOT EXISTS badge_threshold_history (
    id SERIAL PRIMARY KEY,
    badge_id INT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    milestone_threshold NUMERIC(10, 2) NOT NULL CHECK (milestone_threshold > 0),
    eligibility_metric VARCHAR(30) NOT NULL DEFAULT 'lifetime_earned',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    reason TEXT NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Student Badge Awards
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

-- 8. Badge Award Audit Logs
CREATE TABLE IF NOT EXISTS badge_award_audit_logs (
    id SERIAL PRIMARY KEY,
    award_id INT NOT NULL REFERENCES student_badge_awards(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. REST API Endpoint Reference

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>`.

### School Endpoints
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/schools` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Paginated, filtered school registry |
| `GET` | `/schools/stats` | `ADMIN`, `GARBAGE_SUPERVISOR` | Municipal statistics and coverage percentage |
| `GET` | `/schools/:id` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | School profile by ID |
| `POST` | `/schools` | `ADMIN`, `GARBAGE_SUPERVISOR` | Register new educational institution |
| `PUT` | `/schools/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Update school details |
| `PATCH` | `/schools/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active/inactive status |

### Waste Category Endpoints
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Paginated, sorted recyclable categories |
| `GET` | `/categories/active` | `TEACHER`, `GARBAGE_SUPERVISOR`, `ADMIN` | Active categories for collection dropdowns |
| `GET` | `/categories/stats` | `ADMIN`, `GARBAGE_SUPERVISOR` | Category metrics & average rates |
| `GET` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Single category details |
| `GET` | `/categories/:id/rate-history` | `ADMIN`, `GARBAGE_SUPERVISOR` | Full rate change timeline |
| `POST` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Register new category |
| `PUT` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Update metadata (unit locked if used) |
| `PATCH` | `/categories/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active/inactive status |
| `PATCH` | `/categories/:id/rate` | `ADMIN`, `GARBAGE_SUPERVISOR` | Revise point rate with audit reason |

### Badge, Eligibility & Award Endpoints
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/badges` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Filtered, sorted badge catalog |
| `GET` | `/badges/active` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Active badge list |
| `GET` | `/badges/stats` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Badge program KPI statistics |
| `GET` | `/badges/:id` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Badge definition details |
| `GET` | `/badges/:id/threshold-history`| `ADMIN`, `GARBAGE_SUPERVISOR` | Milestone threshold revision timeline |
| `POST` | `/badges` | `ADMIN`, `GARBAGE_SUPERVISOR` | Create milestone badge |
| `PUT` | `/badges/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Update badge metadata |
| `PATCH` | `/badges/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active/inactive status |
| `PATCH` | `/badges/:id/threshold` | `ADMIN`, `GARBAGE_SUPERVISOR` | Revise milestone threshold with audit trail |
| `GET` | `/badges/eligibility` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Student eligibility roster (school-scoped) |
| `GET` | `/badges/awards` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Award ledger (filtered by status/school) |
| `GET` | `/badges/awards/:id` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Award inspection certificate |
| `POST` | `/badges/awards` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Bestow badge to eligible student |
| `PATCH`| `/badges/awards/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Update award status (`awarded` $\leftrightarrow$ `revoked`) |
| `GET` | `/badges/awards/export/csv` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Download official award ledger as CSV |

---

## 8. Setup & Development Guide

### Prerequisites
- **Node.js** 18+ or 20+
- **Go** 1.22+ or 1.24+
- **PostgreSQL** 15+ (Optional: backend automatically falls back to in-memory mode if DB is unavailable)

### 1. Backend Setup (`uspb_backend`)
```bash
cd uspb_backend

# Copy environment template
cp .env.example .env

# Run database migrations (when PostgreSQL is active)
# migrate -path ./migrations -database "postgres://postgres:password@localhost:5432/uspb_db?sslmode=disable" up

# Run backend server (default port 8081 or 8080)
PORT=8081 go run ./cmd/server/main.go
```

### 2. Frontend Setup (`uspb_frontend`)
```bash
cd uspb_frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Authentication for Testing
During local development, obtain a pre-signed JWT via the demo-token endpoint:
```bash
# Council Supervisor Token:
curl "http://localhost:8081/api/v1/auth/demo-token?role=GARBAGE_SUPERVISOR"

# School Teacher Token (Scoped to School #1):
curl "http://localhost:8081/api/v1/auth/demo-token?role=TEACHER&school_id=1"
```

---

## 9. Automated Testing & Verification

### Backend Go Test Suites
Execute the full test suite covering School Management, Waste Category Management, and Badge Management:
```bash
cd uspb_backend
go test -v ./internal/modules/schoolrewards
```
**Results:** `25 passed, 0 failed` across all modules:
- School CRUD, duplicate prevention, and program coverage calculation.
- Category creation, measurement unit locking, and rate history preservation.
- Badge creation, threshold revision timeline, and positive threshold validation.
- Points policy evaluation, candidate eligibility, and duplicate award prevention.
- Award bestowal, threshold freezing, and post-bestowal status modification (`awarded` $\leftrightarrow$ `revoked`).
- Teacher school isolation and multi-tenant security barriers.
- RFC 4180 CSV export validation.

### Frontend Production Build
```bash
cd uspb_frontend
npm run build
```
**Results:** Next.js Turbopack compiled successfully with **0 TypeScript errors**, pre-rendering `/schools`, `/categories`, and `/badges`.
