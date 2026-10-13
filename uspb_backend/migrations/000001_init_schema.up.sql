CREATE TYPE user_role AS ENUM (
    'ADMIN', 
    'FEE_OFFICER', 
    'ENV_OFFICER', 
    'GARBAGE_SUPERVISOR', 
    'TEACHER'
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    school_id INT NULL, -- Left null unless the user is a Teacher restricted to a specific school
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
