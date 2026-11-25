# Urban Services Portal Balangoda (USPB)
## School Waste Rewards Management — Subsystem Architecture & Functional Guide

---

## 1. Executive Summary: What is this Version About?

This version on branch `feat/praneepa-school-rewards` implements the first two core modules of the **School Waste Rewards Management** system for **Balangoda Urban Council (BUC)** in Sri Lanka:

1. **School Management Module**: Onboards participating schools, records codes and locations, tracks operational status (active/inactive), and provides council-wide coverage metrics.
2. **Waste Category Management Module**: Defines authorized recyclable categories (e.g., Plastic & PET, Paper & Cardboard, Metal Cans, Glass, E-Waste), standard measurement units (`kg`), baseline points rates, and maintains an **immutable, auditable rate history**.

Both modules strictly adhere to the monorepo architecture:
- Frontend: `uspb_frontend` (Next.js 16, TypeScript, Tailwind CSS, Lucide icons, Balangoda maroon branding `#800000`).
- Backend: `uspb_backend` (Go, Fiber v2, SQLx, PostgreSQL with seamless in-memory fallback for local development).

---

## 2. Waste Category Management: Core Features

```
+---------------------------------------------------------------------------------------------------------+
|                  Balangoda Urban Council - Waste Category Management                                    |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  [ Stat Cards - Global Municipal Metrics ]                                                              |
|  * Total Categories: 6                      * Active Categories: 5                                      |
|  * Inactive Categories: 1                   * Average Points Rate: 10.0 pts/kg                          |
|                                                                                                         |
|  [ Action Bar ]                                                                                         |
|  [ Search by name or description... (X) ]  [ Status: All / Active / Inactive ]   [ Refresh (R) ]         |
|  [ + Register New Category Button ]                                                                     |
|                                                                                                         |
|  [ Waste Categories Table with Column Sorting ]                                                         |
|  -----------------------------------------------------------------------------------------------------  |
|  Waste Category ^       | Unit      | Points Rate ^   | Status ^   | Actions                            |
|  -----------------------------------------------------------------------------------------------------  |
|  Plastic & PET Bottles  | per kg    | 12.0 pts / kg   | [ACTIVE]   | [Eye] [Edit] [Rate] [Hist] [Pause] |
|  Paper & Cardboard      | per kg    | 5.0 pts / kg    | [ACTIVE]   | [Eye] [Edit] [Rate] [Hist] [Pause] |
|  Metal & Aluminium Cans | per kg    | 15.0 pts / kg   | [ACTIVE]   | [Eye] [Edit] [Rate] [Hist] [Pause] |
|  Glass Bottles          | per kg    | 3.0 pts / kg    | [ACTIVE]   | [Eye] [Edit] [Rate] [Hist] [Pause] |
|  Electronic Waste       | per kg    | 25.0 pts / kg   | [ACTIVE]   | [Eye] [Edit] [Rate] [Hist] [Pause] |
|  Coconut Shells/Biomass | per kg    | 2.0 pts / kg    | [INACTIVE] | [Eye] [Edit] [Rate] [Hist] [Play]  |
+---------------------------------------------------------------------------------------------------------+
```

### 1. Category Listing, Filtering & Sorting
- **Table view**: Lists category name, detailed description, measurement unit, active points rate, and status.
- **Search bar**: Case-insensitive substring search matching category names and descriptions.
- **Status tabs**: Quick filters for `All`, `Active`, and `Inactive`.
- **Column sorting**: Sort ascending and descending on category name, unit, points rate, and status.
- **Pagination**: 10 items per page with clear range indication.

### 2. Category Registration (Add Category)
- **Form fields**: Category name (required, unique), description, measurement unit (default `kg`), initial points per unit (required, > 0), and initial status.
- **Validation**: Checked both in React/TypeScript and enforced on the Go Fiber backend.
- **Initial Rate History**: Automatically generates the initial baseline rate record in `category_rate_history` with the officer's credentials.

### 3. Non-Destructive Category Editing
- **Metadata updates**: Allows updating name, description, and status.
- **Measurement Unit Lock**: If a category has already been recorded in waste collection history (`school_rewards`), changing its unit is blocked (`409 Conflict`) to prevent corrupting physical weight logs.

### 4. Rate History & Auditing (Critical Requirement)
- **Dedicated "Revise Rate" Modal**: When municipal supervisors change the point rate:
  1. The previous rate record in `category_rate_history` has its `effective_to` set to `NOW()`.
  2. A new rate record is inserted with `effective_from = NOW()`, `effective_to = NULL`, the new rate, revision reason, and operator identity.
  3. The category's `current_points_per_unit` is updated.
- **Chronological Audit Timeline Modal**: Clickable from table or details to inspect all past rates, who approved them, and why.
- **Past Collections Frozen**: Rate changes only apply to future collections. Past collections permanently preserve the exact rate applied when they were logged and are **never** recalculated.

### 5. Category Activation & Deactivation
- **Direct status toggling**: Single-click activation / deactivation with a confirmation safety modal.
- **Visibility rule**: Teachers can only view and select active categories (`GET /api/v1/categories/active`). Inactive categories are completely hidden from waste logging dropdowns.
- **Delete protection**: Permanent hard deletion is forbidden if collections exist; deactivation must be used instead.

---

## 3. Database Architecture & Migrations

Created in migration `000004_create_waste_categories_tables.up.sql`:

```sql
-- 1. Main categories table
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

-- 2. Audit rate history table
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

CREATE INDEX IF NOT EXISTS idx_cat_rate_history_cat_id ON category_rate_history(category_id);
```

---

## 4. REST API Endpoint Reference

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>`.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Filtered, sorted, paginated category list |
| `GET` | `/categories/active` | `TEACHER`, `GARBAGE_SUPERVISOR`, `ADMIN` | Active categories for collection dropdowns |
| `GET` | `/categories/stats` | `ADMIN`, `GARBAGE_SUPERVISOR` | KPI statistics across categories |
| `GET` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Single category details |
| `GET` | `/categories/:id/rate-history` | `ADMIN`, `GARBAGE_SUPERVISOR` | Full rate change history timeline |
| `POST` | `/categories` | `ADMIN`, `GARBAGE_SUPERVISOR` | Register new category with baseline rate |
| `PUT` | `/categories/:id` | `ADMIN`, `GARBAGE_SUPERVISOR` | Edit metadata (unit locked if used) |
| `PATCH` | `/categories/:id/status` | `ADMIN`, `GARBAGE_SUPERVISOR` | Toggle active / inactive status |
| `PATCH` | `/categories/:id/rate` | `ADMIN`, `GARBAGE_SUPERVISOR` | Revise point rate with audit reason |
| `DELETE` | `/categories/:id` | `ADMIN` | Hard delete (blocked if collections exist) |

---

## 5. Verification & Test Results

### 1. Backend Go Test Suite
```bash
go test -v ./internal/modules/schoolrewards
```
- `TestCategoryService_CreateCategory` — **PASS**
- `TestCategoryService_CreateCategory/duplicate_name_rejection` — **PASS**
- `TestCategoryService_CreateCategory/invalid_points_rate_rejection` — **PASS**
- `TestCategoryService_UpdateRate_AndHistoryPreservation` — **PASS**
- `TestCategoryService_StatusToggle` — **PASS**
- `TestCategoryService_UnitProtectionAndDeletionRules` — **PASS**
- `TestCategoryService_Stats` — **PASS**
- All 11 School Management tests — **PASS**
- **Result**: `ok github.com/BalangodaUC/uspb_backend/internal/modules/schoolrewards` (0 failures).

### 2. Frontend Production Build
```bash
npm run build
```
- Next.js Turbopack compiler — **Compiled in 1399ms**
- TypeScript typecheck — **Clean with 0 errors**
- Route `/categories` — **Prerendered as static content**
- Dev server running on `http://localhost:3000/categories` — **HTTP 200 OK**
