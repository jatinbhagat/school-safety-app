-- Migration 006: Create AI audit logs table
-- Tracks all AI API calls for audit, compliance, and cost analysis

-- =====================================================
-- Table: ai_audit_logs
-- Stores audit trail of all AI API interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL,                   -- Foreign key to incidents table

  -- AI model and request details
  model VARCHAR(100) NOT NULL,                    -- AI model used (e.g., 'gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet')
  prompt_hash VARCHAR(64) NOT NULL,               -- SHA-256 hash of the prompt (for privacy)

  -- AI response
  output_json JSONB NOT NULL,                     -- The AI's structured response

  -- Performance metrics
  token_count INTEGER,                            -- Number of tokens used (for cost tracking)
  latency_ms INTEGER,                             -- Response time in milliseconds

  -- Error tracking
  error TEXT,                                     -- Error message if AI call failed

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key to incidents table
ALTER TABLE ai_audit_logs
  ADD CONSTRAINT fk_ai_audit_logs_incident
  FOREIGN KEY (incident_id)
  REFERENCES incidents(id)
  ON DELETE CASCADE;

-- Index for incident lookups (most common query pattern)
CREATE INDEX idx_ai_audit_logs_incident_id ON ai_audit_logs(incident_id);

-- Index for model analytics and cost tracking
CREATE INDEX idx_ai_audit_logs_model_created ON ai_audit_logs(model, created_at DESC);

-- Index for error analysis
CREATE INDEX idx_ai_audit_logs_errors ON ai_audit_logs(created_at DESC) WHERE error IS NOT NULL;

-- Index for prompt hash lookups (detect duplicate prompts)
CREATE INDEX idx_ai_audit_logs_prompt_hash ON ai_audit_logs(prompt_hash);

COMMENT ON TABLE ai_audit_logs IS 'Audit trail of all AI API interactions for compliance, cost tracking, and debugging';
COMMENT ON COLUMN ai_audit_logs.prompt_hash IS 'SHA-256 hash of prompt for privacy (actual prompts not stored)';
COMMENT ON COLUMN ai_audit_logs.output_json IS 'Structured AI response (ai_category, urgency_score, risk_level, etc.)';
COMMENT ON COLUMN ai_audit_logs.token_count IS 'Token usage for cost analysis and budget tracking';
COMMENT ON COLUMN ai_audit_logs.latency_ms IS 'API response time for performance monitoring';
