# Manusha Integration Contract: School Waste Collection & Points Calculation
## Urban Services Portal Balangoda (USPB) — School Waste Rewards Subsystem

---

## 1. Overview for Manusha

As part of the **School Waste Rewards Management** subsystem for Balangoda Urban Council, this document outlines the authoritative integration contract between the **Waste Category Management module** (Praneepa) and the **School Waste Collection Logging module** (Manusha).

---

## 2. Guiding Architectural Principles

1. **Backend-Authoritative Pricing**:
   - The frontend application must **never** calculate or submit `points_earned` in the collection payload.
   - The backend service alone retrieves the category's active point rate at the exact instant the transaction is committed.
2. **Rate History Preservation**:
   - Council coordinators frequently adjust point rates (e.g. rising from 10.0 to 12.0 pts/kg due to council subsidy increases).
   - A point rate change **only** affects future collections.
   - Previously recorded collections are frozen at the exact rate in effect when they were logged; they are **never recalculated**.
3. **Role-Based Visibility**:
   - School teachers and principals can **only** see and submit collections for **active** categories. Inactive or discontinued categories are filtered out automatically.

---

## 3. Dedicated API Endpoints for Collection Module

### 3.1. Fetch Active Categories (For Teachers & Dropdowns)

Use this endpoint in the School Waste Collection form to populate the recyclable category dropdown:

- **Method**: `GET`
- **Route**: `/api/v1/categories/active`
- **Required Authorization**: Bearer JWT (`TEACHER`, `GARBAGE_SUPERVISOR`, `ADMIN`)

#### Sample Response (`200 OK`):
```json
{
  "success": true,
  "message": "Active categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Plastic & PET Bottles",
      "description": "Clean beverage PET bottles, household plastic containers, and HDPE flacons.",
      "measurement_unit": "kg",
      "current_points_per_unit": 12.0,
      "status": "active",
      "created_at": "2026-10-26T08:04:45Z",
      "updated_at": "2026-11-25T08:26:28Z"
    },
    {
      "id": 2,
      "name": "Paper & Cardboard",
      "description": "Clean dry newspapers, textbooks, office stationery, and corrugated cardboard boxes.",
      "measurement_unit": "kg",
      "current_points_per_unit": 5.0,
      "status": "active",
      "created_at": "2026-10-26T08:04:45Z",
      "updated_at": "2026-10-26T08:04:45Z"
    },
    {
      "id": 3,
      "name": "Metal & Aluminium Cans",
      "description": "Empty food tins, soft drink aluminium cans, and clean discarded household metals.",
      "measurement_unit": "kg",
      "current_points_per_unit": 15.0,
      "status": "active",
      "created_at": "2026-10-26T08:04:45Z",
      "updated_at": "2026-10-26T08:04:45Z"
    },
    {
      "id": 4,
      "name": "Glass Bottles",
      "description": "Clear and amber glass bottles, intact jars, and unbroken beverage glass.",
      "measurement_unit": "kg",
      "current_points_per_unit": 3.0,
      "status": "active",
      "created_at": "2026-10-26T08:04:45Z",
      "updated_at": "2026-10-26T08:04:45Z"
    },
    {
      "id": 5,
      "name": "Electronic Waste (E-Waste)",
      "description": "Spent domestic batteries, printed circuit boards, keyboards, chargers, and small peripherals.",
      "measurement_unit": "kg",
      "current_points_per_unit": 25.0,
      "status": "active",
      "created_at": "2026-10-26T08:04:45Z",
      "updated_at": "2026-10-26T08:04:45Z"
    }
  ]
}
```

---

## 4. Collection Recording Contract (Recommended Workflow for Manusha)

When a teacher submits a waste collection entry from their school:

### 4.1. Payload Sent by Frontend:
```json
{
  "school_id": 1,
  "category_id": 1,
  "quantity": 14.5
}
```
*(Notice: no points value is passed from the browser!)*

### 4.2. Backend Processing Sequence (Go Backend):
```go
// In Manusha's collection service:
func (s *collectionService) RecordCollection(req *RecordCollectionRequest, teacherEmail string) (*CollectionRecord, error) {
    // 1. Verify category exists and is currently active
    cat, err := s.categoryRepo.GetByID(req.CategoryID)
    if err != nil || cat == nil {
        return nil, errors.New("invalid waste category")
    }
    if cat.Status != CategoryStatusActive {
        return nil, errors.New("cannot log collections for an inactive waste category")
    }

    // 2. Authoritative points calculation using current active rate
    appliedRate := cat.CurrentPointsPerUnit
    pointsEarned := req.Quantity * appliedRate

    // 3. Persist the collection transaction locking in both points AND applied rate
    record := &CollectionRecord{
        SchoolID:     req.SchoolID,
        CategoryID:   cat.ID,
        CategoryName: cat.Name,
        Quantity:     req.Quantity,
        Unit:         cat.MeasurementUnit,
        AppliedRate:  appliedRate, // Preserves audit rate
        PointsEarned: pointsEarned,
        RecordedBy:   teacherEmail,
        RecordedAt:   time.Now(),
    }

    return s.collectionRepo.Insert(record)
}
```

---

## 5. Summary Table of Permissions

| Role | `GET /categories/active` | `GET /categories` | `POST /categories` | `PATCH /categories/:id/rate` | `PATCH /categories/:id/status` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **TEACHER** | ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **GARBAGE_SUPERVISOR** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **ADMIN** | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

---

## 6. Contact & Support

- **Module Lead**: Praneepa Tharushini (School Waste Rewards Management)
- **Frameworks**: Next.js 16 + Go Fiber v2 + PostgreSQL
- **Backend Branch**: `feat/praneepa-school-rewards`
