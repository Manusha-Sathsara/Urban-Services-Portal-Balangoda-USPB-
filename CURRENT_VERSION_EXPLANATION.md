# Urban Services Portal Balangoda (USPB)
## School Waste Rewards Management — Subsystem Architecture & Functional Guide

---

## 1. Executive Summary: What is this Version About?

This version on branch `feat/praneepa-school-rewards` implements the three core administrative and student recognition modules of the **School Waste Rewards Management** subsystem for **Balangoda Urban Council (BUC)** in Sri Lanka:

1. **School Management Module**: Onboards participating primary and secondary schools in the Balangoda municipal jurisdiction, assigns official school codes, records addresses and principal contacts, tracks operational status (active/inactive), and provides council-wide coverage metrics.
2. **Waste Category Management Module**: Defines authorized recyclable categories (e.g., Plastic & PET Bottles, Paper & Cardboard, Metal Cans, Glass Bottles, E-Waste), standard measurement units (`kg`), baseline points rates, and maintains an **immutable, auditable rate history**.
3. **Badge Configuration, Eligibility & Award Management Module**: Configures milestone achievement badges, tracks student eligibility via an isolated points engine, manages badge bestowals with physical medal tracking, freezes award-time thresholds, and provides an exportable official council award ledger.

All three modules strictly adhere to the monorepo architecture:
- Frontend: `uspb_frontend` (Next.js 16, TypeScript, Tailwind CSS, Lucide icons, Balangoda municipal maroon branding `#800000`).
- Backend: `uspb_backend` (Go, Fiber v2, SQLx, PostgreSQL with seamless zero-setup in-memory fallback for local development).

---

## 2. Badge Configuration, Eligibility & Award Management: Core Features

```
+------------------------------------------------------------------------------------------------------------------+
|                  Balangoda Urban Council - School Badge Management Dashboard                                      |
+------------------------------------------------------------------------------------------------------------------+
|                                                                                                                  |
|  [ Stat Cards - Municipal Badge Metrics ]                                                                        |
|  * Total Registered Badges: 5               * Active Badges: 4                                                   |
|  * Inactive Badges: 1                       * Total Recorded Badge Awards: 6                                     |
|                                                                                                                  |
|  [ Badge Programme Charter Notice ]                                                                              |
|  "Empowering Balangoda's youth in eco-stewardship. Badges recognize student milestone achievements in source      |
|   segregation and waste recycling. Threshold revisions preserve historical records for audit compliance."        |
|                                                                                                                  |
|  [ Tab Navigation ]                                                                                              |
|  [ Tab 1: Badge Catalog & Milestones ]   [ Tab 2: Student Eligibility ]   [ Tab 3: Award History & Ledger ]      |
+------------------------------------------------------------------------------------------------------------------+
```

### Tab 1: Badge Catalog & Milestones
- **Badge Listing**: Icon, Badge Name, Category/Description, Milestone Threshold (pts), Eligibility Metric (`Lifetime Points` vs `Available Points`), and Status (`Active` / `Inactive`).
- **Main Action Button**: `Create New Badge` modal with dynamic Lucide icon picker, name, description, positive threshold validation, and metric selection.
- **Threshold Revision Modal**: Supervisors can adjust thresholds with an official council reason. Previous configurations are archived into `badge_threshold_history`.
- **Threshold History Modal**: Displays a visual timeline of all historical threshold changes, effective dates, revision reasons, and authorizing officers.
- **Badge Details & Status Toggle**: Quick inspection modal and safe activation/deactivation confirmation dialogs.

### Tab 2: Student Eligibility Management
- **Candidate Roster**: Displays candidate students across Balangoda schools with student ID, school name, badge milestone, required threshold, qualifying points, progress bar, and eligibility status (`Eligible`, `In Progress`, `Awarded`).
- **Filter Controls**: Multi-facet filtering by School, Badge, Eligibility (`All`, `Eligible Only`, `In Progress`), and Award Status (`Not Yet Awarded`, `Awarded`).
- **Authoritative Points Verification**: Student points are fetched directly from the backend `PointsLedgerProvider`. Never trusts client-submitted point values.
- **Direct Award Action**: Single-click `Bestow Badge` action for eligible students opening the award bestowal modal.

### Tab 3: Award History & Ledger
- **Council Award Ledger**: Table listing unique Award Reference (`AWD-YYYY-XXXX`), Student Name, School, Badge Name, Awarded Date, Authorizing Officer, Physical Medal Issued status, and Action buttons.
- **Audit Detail Certificate**: View modal rendering the official Balangoda Urban Council award certificate with frozen award threshold and student points.
- **CSV Ledger Export**: Single-click export of the award ledger with active filters for council committee reporting.
- **Immutability Guarantee**: Existing awards are permanently frozen at `threshold_at_award` and are never recalculated or revoked when badge thresholds change.

---

## 3. Waste Category Management: Core Features

- **Table View**: Lists category name, description, measurement unit, active points rate, and status.
- **Search & Filters**: Substring search matching category names and descriptions with status tabs (`All`, `Active`, `Inactive`).
- **Non-Destructive Editing & Unit Lock**: Protects categories used in historical collections from measurement unit alterations.
- **Immutable Rate History**: Dedicated rate revision modal archiving previous rates in `category_rate_history` with effective dates and council justification.

---

## 4. School Management: Core Features

- **School Registry**: Official municipal registration of primary and secondary schools in Balangoda.
- **Status Management**: Activation and deactivation of participating institutions.
- **Council Coverage KPI**: Dynamic calculation of program coverage (`active / total * 100`).

---

## 5. Security & Multi-Tenant School Scoping

1. **Role-Based Access Control (RBAC)**:
   - `ADMIN` & `GARBAGE_SUPERVISOR`: Council-wide management privileges. Can configure badges, revise thresholds, view all schools, and bestow awards.
   - `TEACHER`: Restricted to their assigned school (`school_id`).
2. **Teacher School Isolation**:
   - The Go Fiber backend automatically extracts `SchoolID` from the authenticated JWT claims.
   - Teachers querying eligibility or awards are scoped exclusively to their school (`school_id`).
   - If a teacher attempts to bestow a badge to a student outside their school, the backend rejects the request with `403 Forbidden: teachers can only manage awards for their assigned school`.

---

## 6. Points Policy Isolation Architecture

The council has not finalized whether badge thresholds will evaluate **lifetime earned points** or **net available points**. The subsystem isolates this business rule behind `PointsLedgerProvider`:

```
+------------------------------------+
|         badgeService               |
+------------------------------------+
                 |
                 v
+------------------------------------+
|     PointsLedgerProvider           |
| (interface: GetStudentPoints)      |
+------------------------------------+
        /                    \
       v                      v
+-------------------+   +--------------------+
| sqlPointsProvider |   | memoryPointsProvider|
| (PostgreSQL query |   | (Zero-setup dev    |
|  or baseline)     |   |  & unit testing)   |
+-------------------+   +--------------------+
```

---

## 7. Database Architecture & Migrations

Created across migrations:
- `000001_create_schools_table.up.sql`
- `000004_create_waste_categories_tables.up.sql`
- `000005_create_badge_management_tables.up.sql`

```sql
-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_reg_no VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    grade_class VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'graduated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badge definitions table
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

-- Threshold revision audit history
CREATE TABLE IF NOT EXISTS badge_threshold_history (
    id SERIAL PRIMARY KEY,
    badge_id INT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    threshold_value NUMERIC(10, 2) NOT NULL CHECK (threshold_value > 0),
    eligibility_metric VARCHAR(30) NOT NULL DEFAULT 'lifetime_earned',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    reason TEXT NOT NULL,
    changed_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student badge awards ledger
CREATE TABLE IF NOT EXISTS student_badge_awards (
    id SERIAL PRIMARY KEY,
    award_ref VARCHAR(50) NOT NULL UNIQUE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    badge_id INT NOT NULL REFERENCES badge_definitions(id) ON DELETE RESTRICT,
    threshold_at_award NUMERIC(10, 2) NOT NULL,
    qualifying_points NUMERIC(10, 2) NOT NULL,
    awarded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    awarded_by VARCHAR(150) NOT NULL,
    physical_badge_issued BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_badge UNIQUE (student_id, badge_id)
);

-- Award audit logs
CREATE TABLE IF NOT EXISTS badge_award_audit_logs (
    id SERIAL PRIMARY KEY,
    award_id INT NOT NULL REFERENCES student_badge_awards(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. REST API Endpoint Reference

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>`.

### School Endpoints:
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/schools` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Paginated, filtered list of registered schools |
| `GET` | `/schools/stats` | `ADMIN`, `GARBAGE_SUPERVISOR` | Municipal school statistics & coverage rate |
| `GET` | `/schools/:id` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | School profile by ID |
| `POST` | `/schools` | `ADMIN`, `GARBAGE_SUPERVISOR` | Register new educational institution |
| `PUT` | `/schools/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Update school details |
| `PATCH` | `/schools/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active/inactive status |

### Waste Category Endpoints:
| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Paginated, sorted category catalog |
| `GET` | `/categories/active` | `TEACHER`, `GARBAGE_SUPERVISOR`, `ADMIN` | Active categories for collection dropdowns |
| `GET` | `/categories/stats` | `ADMIN`, `GARBAGE_SUPERVISOR` | Category metrics & average rates |
| `GET` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Single category details |
| `GET` | `/categories/:id/rate-history` | `ADMIN`, `GARBAGE_SUPERVISOR` | Full rate change timeline |
| `POST` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Register new category |
| `PUT` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Update metadata (unit locked if used) |
| `PATCH` | `/categories/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active/inactive status |
| `PATCH` | `/categories/:id/rate` | `ADMIN`, `GARBAGE_SUPERVISOR` | Revise point rate with audit reason |

### Badge, Eligibility & Award Endpoints:
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
| `GET` | `/badges/eligibility` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Student eligibility roster (school-scoped for teachers) |
| `GET` | `/badges/awards` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Award ledger (school-scoped for teachers) |
| `GET` | `/badges/awards/:id` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Award inspection certificate |
| `POST` | `/badges/awards` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Bestow badge to eligible student (school-isolated) |
| `GET` | `/badges/awards/export/csv` | `ADMIN`, `GARBAGE_SUPERVISOR`, `TEACHER` | Download official award ledger as CSV |

---

## 9. Verification & Test Results

### 1. Go Backend Test Suites:
```bash
go test -v ./internal/modules/schoolrewards
```
- School Management: 11 test scenarios — **PASS**
- Waste Category Management: 7 test scenarios — **PASS**
- Badge Management: 6 test suites with 15 assertions — **PASS**
  - `TestBadgeService_CreateBadge`: Valid creation, positive threshold check, duplicate rejection.
  - `TestBadgeService_ThresholdRevision_AndHistory`: Threshold updates, audit preservation, reason tracking.
  - `TestBadgeService_EligibilityEvaluation`: Lifetime vs available metric, progress calculation.
  - `TestBadgeService_CreateAward_AndRestrictions`: Bestowal, threshold freezing, duplicate prevention (`UNIQUE`).
  - `TestBadgeService_SchoolIsolation`: Cross-school rejection (`403 Forbidden`) for teachers.
  - `TestBadgeService_ExportAwardsCSV`: Valid RFC 4180 CSV export.
- **Overall Result**: `ok github.com/BalangodaUC/uspb_backend/internal/modules/schoolrewards 5.488s` (0 failures).

### 2. Next.js Frontend Production Build:
```bash
npm run build
```
- Next.js Compiler: Compiled in 917ms.
- TypeScript Validation: Clean with 0 type errors.
- Pre-rendered Routes: `/schools`, `/categories`, and `/badges` pre-rendered as static content.
- Local Dev Environment: Live on `http://localhost:3000/badges` and `http://localhost:8081`.
