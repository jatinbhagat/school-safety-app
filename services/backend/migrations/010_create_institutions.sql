-- Migration: Create institutions table
-- Description: Core table for storing all institution data from onboarding

CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,

    -- Basic Information
    institution_name TEXT NOT NULL,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('school', 'college', 'university', 'corporate', 'ngo')),
    location TEXT NOT NULL,

    -- Contact Details
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,

    -- URL & Branding
    url_slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#3B82F6',

    -- Access & Status
    access_type TEXT DEFAULT 'free' CHECK (access_type IN ('free', 'trial', 'paid', 'demo_required')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Free Access Tracking (first 100 - manually approved)
    free_access_granted BOOLEAN DEFAULT FALSE,
    free_access_number INTEGER, -- Manually assigned: 1-100 for first 100 institutions

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    onboarded_at TIMESTAMPTZ,

    -- Metadata
    onboarding_data JSONB DEFAULT '{}', -- Stores complete onboarding form data
    settings JSONB DEFAULT '{}' -- Institution-specific settings
);

-- Indexes for performance
CREATE INDEX idx_institutions_url_slug ON institutions(url_slug);
CREATE INDEX idx_institutions_email ON institutions(email);
CREATE INDEX idx_institutions_type ON institutions(institution_type);
CREATE INDEX idx_institutions_active ON institutions(is_active);
CREATE INDEX idx_institutions_created ON institutions(created_at DESC);

-- Comments
COMMENT ON TABLE institutions IS 'Stores all institution data from SafelyNotify.com onboarding';
COMMENT ON COLUMN institutions.url_slug IS 'Unique URL slug (immutable after onboarding)';
COMMENT ON COLUMN institutions.free_access_number IS 'Manually assigned number 1-100 for first 100 free institutions';
COMMENT ON COLUMN institutions.access_type IS 'Type of access: free (first 100), trial, paid, demo_required';
