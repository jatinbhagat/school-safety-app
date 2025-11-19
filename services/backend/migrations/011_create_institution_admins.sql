-- Migration: Create institution_admins table
-- Description: Admin user accounts with authentication

CREATE TABLE IF NOT EXISTS institution_admins (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Admin Details
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),

    -- Authentication
    password_hash TEXT, -- Bcrypt hash
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires_at TIMESTAMPTZ,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint
    UNIQUE(institution_id, email)
);

-- Indexes
CREATE INDEX idx_admins_institution ON institution_admins(institution_id);
CREATE INDEX idx_admins_email ON institution_admins(email);
CREATE INDEX idx_admins_verification_token ON institution_admins(verification_token);
CREATE INDEX idx_admins_reset_token ON institution_admins(reset_token);
CREATE INDEX idx_admins_active ON institution_admins(is_active);

-- Comments
COMMENT ON TABLE institution_admins IS 'Admin users for each institution with authentication';
COMMENT ON COLUMN institution_admins.role IS 'super_admin can manage everything, admin can view/respond, staff has limited access';
COMMENT ON COLUMN institution_admins.password_hash IS 'Bcrypt hashed password (min 8 chars, 1 uppercase, 1 number required)';
