-- Migration: Create analytics.safety_scores table
-- Description: Stores monthly safety scores computed from incidents and analytics data

-- Create the safety_scores table in the analytics schema
CREATE TABLE IF NOT EXISTS analytics.safety_scores (
    id SERIAL PRIMARY KEY,
    school_id INTEGER,  -- Nullable for now, can reference schools table if added later
    month DATE NOT NULL,  -- First day of the month (YYYY-MM-01)
    score DECIMAL(5, 2) NOT NULL,  -- Overall safety score (0-100)
    components JSONB NOT NULL,  -- Breakdown of score components
    metadata JSONB,  -- Additional metadata (e.g., computation details, version)
    computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_school_month UNIQUE (school_id, month),
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- Create indexes for efficient querying
CREATE INDEX idx_safety_scores_school_month ON analytics.safety_scores (school_id, month DESC);
CREATE INDEX idx_safety_scores_month ON analytics.safety_scores (month DESC);
CREATE INDEX idx_safety_scores_computed_at ON analytics.safety_scores (computed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE analytics.safety_scores IS 'Monthly safety scores computed from incident and analytics data';
COMMENT ON COLUMN analytics.safety_scores.school_id IS 'Reference to school (nullable for single-school deployments)';
COMMENT ON COLUMN analytics.safety_scores.month IS 'First day of the month for this score (YYYY-MM-01 format)';
COMMENT ON COLUMN analytics.safety_scores.score IS 'Overall safety score from 0 (worst) to 100 (best)';
COMMENT ON COLUMN analytics.safety_scores.components IS 'JSON breakdown of score components (e.g., incident_rate, severity, resolution_time)';
COMMENT ON COLUMN analytics.safety_scores.metadata IS 'Additional metadata about score computation (algorithm version, parameters, etc.)';
