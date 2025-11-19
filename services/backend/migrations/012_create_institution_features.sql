-- Migration: Create institution_features table
-- Description: Feature toggles for each institution

CREATE TABLE IF NOT EXISTS institution_features (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Feature Toggles
    alerts_enabled BOOLEAN DEFAULT TRUE,
    reports_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    analytics_enabled BOOLEAN DEFAULT FALSE,

    -- Configuration (for future feature-specific settings)
    feature_config JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(institution_id)
);

-- Indexes
CREATE INDEX idx_features_institution ON institution_features(institution_id);

-- Comments
COMMENT ON TABLE institution_features IS 'Feature toggles configured during onboarding';
COMMENT ON COLUMN institution_features.alerts_enabled IS 'Emergency safety alerts feature';
COMMENT ON COLUMN institution_features.reports_enabled IS 'Incident reporting kiosks feature';
COMMENT ON COLUMN institution_features.notifications_enabled IS 'Staff/parent notifications feature';
COMMENT ON COLUMN institution_features.analytics_enabled IS 'Analytics and reporting dashboard';
