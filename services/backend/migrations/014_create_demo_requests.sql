-- Migration: Create demo_requests table
-- Description: Corporate/NGO demo booking requests

CREATE TABLE IF NOT EXISTS demo_requests (
    id SERIAL PRIMARY KEY,

    -- Organization Info
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    industry TEXT,
    organization_size TEXT,

    -- Contact Info
    contact_name TEXT NOT NULL,
    contact_title TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,

    -- Scheduling Preferences
    preferred_date DATE,
    preferred_time TEXT,
    message TEXT,

    -- Status Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'declined')),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Complete form data
    demo_data JSONB DEFAULT '{}',

    -- Internal notes from sales team
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_demo_status ON demo_requests(status);
CREATE INDEX idx_demo_created ON demo_requests(created_at DESC);
CREATE INDEX idx_demo_email ON demo_requests(email);

-- Comments
COMMENT ON TABLE demo_requests IS 'Demo booking requests from corporates and NGOs (manually managed)';
COMMENT ON COLUMN demo_requests.status IS 'Manually updated by sales team as they progress through pipeline';
