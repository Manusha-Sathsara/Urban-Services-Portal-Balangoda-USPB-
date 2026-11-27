-- 1. Create garbage_categories table
CREATE TABLE IF NOT EXISTS garbage_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    measurement_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    current_points_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (current_points_per_unit >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_garbage_categories_status ON garbage_categories(status);
CREATE INDEX IF NOT EXISTS idx_garbage_categories_name ON garbage_categories(LOWER(name));

-- 2. Create category_rate_history table
CREATE TABLE IF NOT EXISTS category_rate_history (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES garbage_categories(id) ON DELETE RESTRICT,
    points_per_unit NUMERIC(10, 2) NOT NULL CHECK (points_per_unit >= 0),
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE NULL,
    reason TEXT NOT NULL DEFAULT '',
    changed_by VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rate_history_category_id ON category_rate_history(category_id);
CREATE INDEX IF NOT EXISTS idx_rate_history_effective ON category_rate_history(category_id, effective_from);

-- 3. Seed baseline municipal waste categories
INSERT INTO garbage_categories (id, name, description, measurement_unit, current_points_per_unit, status, created_at, updated_at)
VALUES 
    (1, 'Plastic & PET Bottles', 'Clean beverage PET bottles, household plastic containers, and HDPE flacons.', 'kg', 10.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (2, 'Paper & Cardboard', 'Clean dry newspapers, textbooks, office stationery, and corrugated cardboard boxes.', 'kg', 5.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (3, 'Metal & Aluminium Cans', 'Empty food tins, soft drink aluminium cans, and clean discarded household metals.', 'kg', 15.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (4, 'Glass Bottles', 'Clear and amber glass bottles, intact jars, and unbroken beverage glass.', 'kg', 3.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (5, 'Electronic Waste (E-Waste)', 'Spent domestic batteries, printed circuit boards, keyboards, chargers, and small peripherals.', 'kg', 25.00, 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    (6, 'Coconut Shells & Biomass', 'Clean sorted dry coconut shells for council bio-char and industrial fuel recovery.', 'kg', 2.00, 'inactive', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days')
ON CONFLICT (name) DO NOTHING;

SELECT setval('garbage_categories_id_seq', (SELECT MAX(id) FROM garbage_categories));

-- 4. Seed initial rate histories for each category
INSERT INTO category_rate_history (category_id, points_per_unit, effective_from, effective_to, reason, changed_by, created_at)
VALUES
    (1, 10.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days'),
    (2, 5.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days'),
    (3, 15.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days'),
    (4, 3.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days'),
    (5, 25.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days'),
    (6, 2.00, NOW() - INTERVAL '30 days', NULL, 'Initial council baseline rate', 'admin@balangoda.gov.lk', NOW() - INTERVAL '30 days');
