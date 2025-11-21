-- Migration 018: Add institution support to routing rules
-- Allows each institution to have their own customizable routing rules

-- =====================================================
-- Add institution_id column to routing_rules
-- =====================================================
ALTER TABLE routing_rules ADD COLUMN institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE;

-- Create index for institution-specific queries
CREATE INDEX idx_routing_rules_institution_id ON routing_rules(institution_id, is_active, priority DESC);

-- Update existing rules to be templates (NULL institution_id = template)
COMMENT ON COLUMN routing_rules.institution_id IS 'Institution ID for custom rules. NULL = system template';

-- =====================================================
-- Add system_default flag to identify template rules
-- =====================================================
ALTER TABLE routing_rules ADD COLUMN is_system_default BOOLEAN DEFAULT false;

-- Mark existing rules as system defaults
UPDATE routing_rules SET is_system_default = true WHERE institution_id IS NULL;

COMMENT ON COLUMN routing_rules.is_system_default IS 'True for system template rules that cannot be deleted';

-- =====================================================
-- Function to copy default rules for new institutions
-- =====================================================
CREATE OR REPLACE FUNCTION copy_default_routing_rules_for_institution(inst_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  rules_copied INTEGER := 0;
BEGIN
  -- Copy all system default rules for this institution
  INSERT INTO routing_rules (
    rule_id,
    name,
    description,
    priority,
    is_active,
    condition_config,
    target_role,
    routing_priority,
    confidence,
    estimated_response_time,
    institution_id,
    is_system_default,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    rule_id || '_inst_' || inst_id,  -- Make rule_id unique per institution
    name,
    description,
    priority,
    is_active,
    condition_config,
    target_role,
    routing_priority,
    confidence,
    estimated_response_time,
    inst_id,                          -- Set institution_id
    false,                            -- Not a system default
    'system',
    NOW(),
    NOW()
  FROM routing_rules
  WHERE is_system_default = true
  AND NOT EXISTS (
    SELECT 1 FROM routing_rules r2
    WHERE r2.institution_id = inst_id
    AND r2.rule_id LIKE routing_rules.rule_id || '_inst_%'
  );

  GET DIAGNOSTICS rules_copied = ROW_COUNT;
  RETURN rules_copied;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION copy_default_routing_rules_for_institution IS 'Copies system default routing rules for a new institution';

-- =====================================================
-- Copy default rules for existing institutions
-- =====================================================
DO $$
DECLARE
  inst RECORD;
  copied INTEGER;
BEGIN
  FOR inst IN SELECT id FROM institutions LOOP
    SELECT copy_default_routing_rules_for_institution(inst.id) INTO copied;
    RAISE NOTICE 'Copied % routing rules for institution %', copied, inst.id;
  END LOOP;
END $$;
