-- Migration: Create staff_members table
-- Description: Track staff emails invited during onboarding

CREATE TABLE IF NOT EXISTS staff_members (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

    -- Metadata
    invite_token TEXT,
    invite_expires_at TIMESTAMPTZ,

    UNIQUE(institution_id, email)
);

-- Indexes
CREATE INDEX idx_staff_institution ON staff_members(institution_id);
CREATE INDEX idx_staff_status ON staff_members(status);
CREATE INDEX idx_staff_invite_token ON staff_members(invite_token);

-- Comments
COMMENT ON TABLE staff_members IS 'Staff members invited during onboarding (optional step)';
COMMENT ON COLUMN staff_members.status IS 'Tracks whether staff accepted the invitation';
