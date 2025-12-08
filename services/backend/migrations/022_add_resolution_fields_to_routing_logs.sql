-- Migration 022: Add resolution tracking fields to routing_logs
-- Adds columns to track incident resolution outcomes for complete audit trail

-- =====================================================
-- Add resolution tracking columns to routing_logs
-- =====================================================

-- Add resolution_type column to track how incident was resolved
ALTER TABLE routing_logs 
ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50)
CHECK (resolution_type IS NULL OR resolution_type IN (
  'issue_resolved', 
  'referred_to_admin', 
  'ongoing_monitoring', 
  'no_action_needed', 
  'escalated_external'
));

-- Add incident_validity column to track whether incident was valid
ALTER TABLE routing_logs 
ADD COLUMN IF NOT EXISTS incident_validity VARCHAR(50)
CHECK (incident_validity IS NULL OR incident_validity IN (
  'confirmed_incident', 
  'false_report', 
  'unconfirmed', 
  'duplicate'
));

-- Create index for analyzing resolution patterns
CREATE INDEX IF NOT EXISTS idx_routing_logs_resolution_type 
ON routing_logs(resolution_type) 
WHERE resolution_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routing_logs_incident_validity 
ON routing_logs(incident_validity) 
WHERE incident_validity IS NOT NULL;

-- Create composite index for resolution analytics
CREATE INDEX IF NOT EXISTS idx_routing_logs_resolution_analytics 
ON routing_logs(recommended_role, resolution_type, incident_validity) 
WHERE resolution_type IS NOT NULL AND incident_validity IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN routing_logs.resolution_type IS 'How the incident was ultimately resolved';
COMMENT ON COLUMN routing_logs.incident_validity IS 'Whether the reported incident was determined to be valid';

-- Update table comment to reflect new purpose
COMMENT ON TABLE routing_logs IS 'Complete audit trail of routing decisions and resolution outcomes for analytics and ML training';