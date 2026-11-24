CREATE TYPE env_cert_status AS ENUM (
    'PENDING',
    'UNDER_INSPECTION',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);

CREATE TABLE env_cert_businesses (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    registration_no VARCHAR(100) UNIQUE,
    owner_name VARCHAR(255) NOT NULL,
    owner_nic VARCHAR(20) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    address TEXT NOT NULL,
    ward_no VARCHAR(50),
    business_category VARCHAR(100) NOT NULL,
    status env_cert_status NOT NULL DEFAULT 'PENDING',
    issued_date DATE,
    expiry_date DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_env_cert_businesses_status ON env_cert_businesses(status);
CREATE INDEX idx_env_cert_businesses_owner_nic ON env_cert_businesses(owner_nic);