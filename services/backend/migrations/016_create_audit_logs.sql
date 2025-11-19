-- Migration: Create audit_logs table
-- Description: Security and compliance audit trail

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
    admin_id INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,

    -- Action Details
    action TEXT NOT NULL, -- e.g., 'login', 'update_settings', 'upload_logo', 'invite_staff'
    entity_type TEXT, -- e.g., 'institution', 'admin', 'incident', 'settings'
    entity_id INTEGER,

    -- Change Tracking
    old_values JSONB,
    new_values JSONB,

    -- Request Context
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all admin actions (security and compliance)';
COMMENT ON COLUMN audit_logs.action IS 'The action performed (e.g., login, update_settings, upload_logo)';
COMMENT ON COLUMN audit_logs.old_values IS 'State before the action (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'State after the action (JSON)';
