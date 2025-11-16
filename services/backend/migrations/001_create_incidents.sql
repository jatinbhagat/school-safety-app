-- Migration: Create incidents table
-- Description: Initial table for storing student safety incident reports

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT,
    class_section TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'open' NOT NULL,
    ai_meta JSONB,

    -- Indexes for common queries
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Create indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_category ON incidents(category);

-- Comments for documentation
COMMENT ON TABLE incidents IS 'Stores anonymous student safety incident reports';
COMMENT ON COLUMN incidents.id IS 'Unique identifier for each incident';
COMMENT ON COLUMN incidents.category IS 'Type/category of the incident (required)';
COMMENT ON COLUMN incidents.description IS 'Detailed description of the incident';
COMMENT ON COLUMN incidents.class_section IS 'Optional class/section information';
COMMENT ON COLUMN incidents.attachments IS 'JSON array of attachment metadata (S3 keys, etc.)';
COMMENT ON COLUMN incidents.created_at IS 'Timestamp when the report was submitted';
COMMENT ON COLUMN incidents.status IS 'Current status of the incident';
COMMENT ON COLUMN incidents.ai_meta IS 'AI triage metadata including severity, tags, and analysis';
