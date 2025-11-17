-- Migration 005: Create routing tables
-- Creates tables for storing routing rules and routing decision logs

-- =====================================================
-- Table: routing_rules
-- Stores configurable routing rules for incident triage
-- =====================================================
CREATE TABLE IF NOT EXISTS routing_rules (
  id SERIAL PRIMARY KEY,
  rule_id VARCHAR(50) UNIQUE NOT NULL,           -- Unique identifier (e.g., 'rule_001')
  name VARCHAR(255) NOT NULL,                     -- Human-readable name
  description TEXT,                               -- Detailed description
  priority INTEGER NOT NULL DEFAULT 0,            -- Higher number = higher priority
  is_active BOOLEAN DEFAULT true,                 -- Enable/disable rule

  -- Condition configuration (stored as JSONB for flexibility)
  condition_config JSONB NOT NULL,                -- Rule conditions (keywords, severity ranges, etc.)

  -- Routing configuration
  target_role VARCHAR(100) NOT NULL,              -- Role to route to (e.g., 'security', 'counselor')
  routing_priority VARCHAR(20) NOT NULL           -- 'low', 'medium', 'high', 'critical'
    CHECK (routing_priority IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3,2) DEFAULT 0.80            -- Rule confidence (0.00 to 1.00)
    CHECK (confidence >= 0 AND confidence <= 1),
  estimated_response_time VARCHAR(50),            -- Expected response time (e.g., '< 1 hour')

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),                        -- User/system that created the rule
  updated_by VARCHAR(100)                         -- User/system that last updated the rule
);

-- Index for active rules ordered by priority
CREATE INDEX idx_routing_rules_active_priority ON routing_rules(is_active, priority DESC) WHERE is_active = true;

-- Index for lookups by rule_id
CREATE INDEX idx_routing_rules_rule_id ON routing_rules(rule_id);

COMMENT ON TABLE routing_rules IS 'Configurable routing rules for incident triage';
COMMENT ON COLUMN routing_rules.condition_config IS 'JSONB configuration for rule conditions (keywords, severity thresholds, etc.)';
COMMENT ON COLUMN routing_rules.target_role IS 'Staff role to route incident to';
COMMENT ON COLUMN routing_rules.confidence IS 'Confidence score for this rule (0.00 to 1.00)';


-- =====================================================
-- Table: routing_logs
-- Stores all routing decisions for audit and ML training
-- =====================================================
CREATE TABLE IF NOT EXISTS routing_logs (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL,                   -- Foreign key to incidents table

  -- Routing recommendation
  recommended_role VARCHAR(100) NOT NULL,         -- Role recommended by routing engine
  confidence DECIMAL(4,3) NOT NULL                -- Confidence score (0.000 to 1.000)
    CHECK (confidence >= 0 AND confidence <= 1),
  priority VARCHAR(20) NOT NULL                   -- Recommended priority
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Routing method and reasoning
  routing_method VARCHAR(50) NOT NULL             -- 'rule_based', 'ml_based', 'hybrid'
    CHECK (routing_method IN ('rule_based', 'ml_based', 'hybrid', 'manual')),
  matched_rule_id VARCHAR(50),                    -- ID of matched rule (if rule-based)
  reasoning TEXT,                                 -- Explanation of routing decision

  -- Metadata from incident at time of routing
  incident_snapshot JSONB,                        -- Snapshot of incident data used for routing

  -- Actual assignment (if different from recommendation)
  actual_assigned_role VARCHAR(100),              -- Role actually assigned to (may differ from recommendation)
  assigned_at TIMESTAMPTZ,                        -- When assignment was made
  assigned_by VARCHAR(100),                       -- Who made the assignment

  -- Outcome tracking (for ML feedback loop)
  was_reassigned BOOLEAN DEFAULT false,           -- Whether incident was reassigned
  resolution_time_minutes INTEGER,                -- Time to resolve (for performance tracking)
  feedback_score INTEGER                          -- Optional feedback on routing quality (1-5)
    CHECK (feedback_score IS NULL OR (feedback_score >= 1 AND feedback_score <= 5)),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key to incidents table
ALTER TABLE routing_logs
  ADD CONSTRAINT fk_routing_logs_incident
  FOREIGN KEY (incident_id)
  REFERENCES incidents(id)
  ON DELETE CASCADE;

-- Index for incident lookups
CREATE INDEX idx_routing_logs_incident_id ON routing_logs(incident_id);

-- Index for analyzing routing performance
CREATE INDEX idx_routing_logs_method_created ON routing_logs(routing_method, created_at DESC);

-- Index for rule performance analysis
CREATE INDEX idx_routing_logs_rule_id ON routing_logs(matched_rule_id) WHERE matched_rule_id IS NOT NULL;

-- Index for reassignment analysis
CREATE INDEX idx_routing_logs_reassigned ON routing_logs(was_reassigned) WHERE was_reassigned = true;

COMMENT ON TABLE routing_logs IS 'Audit log of all routing decisions and outcomes';
COMMENT ON COLUMN routing_logs.incident_snapshot IS 'JSONB snapshot of incident data at time of routing';
COMMENT ON COLUMN routing_logs.was_reassigned IS 'True if incident was reassigned to different role';
COMMENT ON COLUMN routing_logs.feedback_score IS 'Optional feedback on routing quality (1-5 scale)';


-- =====================================================
-- Seed default routing rules
-- =====================================================
INSERT INTO routing_rules (rule_id, name, description, priority, target_role, routing_priority, confidence, estimated_response_time, condition_config, created_by)
VALUES
  -- Critical/Emergency Rules
  ('rule_001', 'Active Threat', 'Immediate security response for weapons, violence, or active threats', 100, 'security', 'critical', 0.95, '< 5 minutes',
   '{"keywords": ["weapon", "gun", "knife", "threat", "violence", "fight", "attack"]}', 'system'),

  ('rule_002', 'Medical Emergency', 'Immediate medical response for injuries or health emergencies', 95, 'nurse', 'critical', 0.95, '< 5 minutes',
   '{"keywords": ["injury", "hurt", "bleeding", "unconscious", "medical", "emergency", "ambulance", "nurse"]}', 'system'),

  ('rule_004', 'Mental Health Crisis', 'Critical counseling response for mental health emergencies', 85, 'counselor', 'critical', 0.92, '< 15 minutes',
   '{"keywords": ["suicide", "self-harm", "depression", "anxiety", "mental health", "crisis"]}', 'system'),

  -- High Priority Rules
  ('rule_003', 'Bullying Incident', 'Counseling response for bullying and harassment', 80, 'counselor', 'high', 0.90, '< 1 hour',
   '{"keywords": ["bully", "bullying", "harassment", "intimidation", "threatening"]}', 'system'),

  ('rule_005', 'Substance Abuse', 'Administrative response for drug/alcohol incidents', 75, 'administrator', 'high', 0.88, '< 30 minutes',
   '{"keywords": ["drug", "alcohol", "smoking", "vaping", "substance", "intoxicated"]}', 'system'),

  -- Medium Priority Rules
  ('rule_006', 'Behavioral Issue', 'Administrative response for disciplinary issues', 60, 'administrator', 'medium', 0.85, '< 2 hours',
   '{"keywords": ["disruptive", "behavior", "discipline", "misconduct", "defiant", "disrespect"]}', 'system'),

  ('rule_007', 'Facility/Maintenance Issue', 'Maintenance response for facility problems', 50, 'maintenance', 'medium', 0.80, '< 4 hours',
   '{"keywords": ["broken", "maintenance", "facility", "repair", "damage", "vandalism", "graffiti"]}', 'system'),

  ('rule_008', 'Academic Concern', 'Teacher response for academic issues', 40, 'teacher', 'medium', 0.75, '< 1 day',
   '{"keywords": ["academic", "cheating", "plagiarism", "grade", "homework", "test"]}', 'system'),

  -- Low Priority Rules
  ('rule_009', 'High Severity Incident', 'Administrative response for high-severity incidents', 30, 'administrator', 'high', 0.70, '< 1 hour',
   '{"severity_threshold": 7}', 'system'),

  ('rule_010', 'Default General Staff', 'Catch-all rule for general incidents', 10, 'staff', 'low', 0.60, '< 1 day',
   '{"default": true}', 'system');

COMMENT ON TABLE routing_rules IS 'Default routing rules seeded by system';
