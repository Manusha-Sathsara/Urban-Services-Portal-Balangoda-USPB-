# Database Entity-Relationship Diagrams

## 1. Authentication, Schools, Sessions & Audit Schema (Implemented)

```mermaid
erDiagram
    schools ||--o{ users : "assigned teachers"
    users ||--o{ auth_sessions : "has active/revoked"
    users ||--o{ audit_logs : "performs actions"

    schools {
        serial id PK
        varchar name
        varchar code UK
        text address
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        serial id PK
        varchar name
        varchar username UK
        varchar password_hash
        user_role role
        int school_id "Nullable; required for TEACHER"
        boolean is_active
        boolean must_change_password
        int failed_login_attempts
        timestamptz locked_until
        timestamptz created_at
        timestamptz updated_at
    }

    auth_sessions {
        uuid id PK
        int user_id FK
        text refresh_token_hash
        timestamptz expires_at
        timestamptz revoked_at
        text user_agent
        text ip_address
        timestamptz created_at
    }

    audit_logs {
        bigserial id PK
        int actor_user_id FK
        varchar action
        varchar target_type
        varchar target_id
        text ip_address
        jsonb metadata
        timestamptz created_at
    }
```

## 2. School Waste Rewards Schema (Implemented)

```mermaid
erDiagram
    schools ||--o{ students : "enrolls"
    students ||--o{ waste_collections : "earns points"
    waste_collections ||--|{ waste_collection_items : "contains"
    garbage_categories ||--o{ category_rate_history : "tracks rates"
    students ||--o{ reward_payouts : "redeems 1000 pts (Rs. 1000)"
    students ||--o{ point_transactions : "authoritative ledger"
    badge_definitions ||--o{ badge_threshold_history : "tracks thresholds"
    students ||--o{ student_badge_awards : "receives"
    badge_definitions ||--o{ student_badge_awards : "awarded"
```
