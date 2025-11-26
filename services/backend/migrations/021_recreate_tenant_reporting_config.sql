-- Migration: Recreate tenant_reporting_config table with institution-specific configurations
-- Description: Restores missing tenant_reporting_config table dropped by refactor migration

-- ============================================
-- 1. CREATE TENANT REPORTING CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_reporting_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure one config per tenant
    UNIQUE(tenant_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_reporting_config_tenant ON tenant_reporting_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reporting_config_updated ON tenant_reporting_config(updated_at DESC);

-- Comments
COMMENT ON TABLE tenant_reporting_config IS 'Per-tenant incident reporting configuration (categories, fields, PII settings)';
COMMENT ON COLUMN tenant_reporting_config.tenant_id IS 'UUID reference to institution/school (tenant)';
COMMENT ON COLUMN tenant_reporting_config.config IS 'JSONB config: categories with fields, ordering, PII enablement, etc.';

-- ============================================
-- 2. CREATE UPDATE TRIGGER
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_reporting_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_tenant_reporting_config_updated_at ON tenant_reporting_config;
CREATE TRIGGER update_tenant_reporting_config_updated_at
    BEFORE UPDATE ON tenant_reporting_config
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_reporting_config_updated_at();

-- ============================================
-- 3. INSERT DEMO TENANT CONFIGURATION (SCHOOL TEMPLATE)
-- ============================================

INSERT INTO tenant_reporting_config (tenant_id, config) VALUES 
('00000000-0000-0000-0000-000000000001', '{
  "categories": [
    {
      "id": "bullying",
      "name": "Bullying",
      "description": "Incidents involving bullying behavior",
      "order": 1,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "harassment",
      "name": "Harassment",
      "description": "Incidents involving harassment",
      "order": 2,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "cyber-safety",
      "name": "Cyber Safety & Online Issues",
      "description": "Online safety concerns and cyberbullying",
      "order": 3,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "discrimination",
      "name": "Discrimination",
      "description": "Incidents involving discrimination",
      "order": 4,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "mental-emotional",
      "name": "Mental & Emotional Issues",
      "description": "Mental health and emotional concerns",
      "order": 5,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "staff-misconduct",
      "name": "Teacher/Staff Misconduct",
      "description": "Inappropriate behavior by staff members",
      "order": 6,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    },
    {
      "id": "general-concern",
      "name": "General Concern",
      "description": "Any other safety or behavioral concern",
      "order": 7,
      "fields": [
        {
          "field_key": "description",
          "required": true,
          "enabled": true,
          "order": 1
        }
      ]
    }
  ],
  "settings": {
    "allow_anonymous": true,
    "require_reporter_type": false,
    "max_attachments": 5,
    "pii_enabled_globally": false
  }
}')
ON CONFLICT (tenant_id) DO UPDATE SET 
    config = EXCLUDED.config,
    updated_at = NOW();

-- ============================================
-- 4. POPULATE EXISTING INSTITUTIONS WITH TENANT CONFIGS
-- ============================================

-- Create configurations for existing institutions based on their type
DO $$
DECLARE
    inst_record RECORD;
    type_key TEXT;
    config_json JSONB;
BEGIN
    -- Loop through all institutions that have tenant_id
    FOR inst_record IN 
        SELECT i.id, i.tenant_id, it.type_key 
        FROM institutions i
        LEFT JOIN institution_types it ON i.type_id = it.id
        WHERE i.tenant_id IS NOT NULL
    LOOP
        -- Determine configuration based on institution type
        type_key := COALESCE(inst_record.type_key, 'school'); -- Default to school if no type
        
        CASE type_key
            WHEN 'school' THEN
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concern", "name": "General Concern", "description": "Any other safety or behavioral concern", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            WHEN 'college', 'university' THEN
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "sexual-safety", "name": "Sexual Safety", "description": "Sexual harassment and safety concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "drugs", "name": "Drugs", "description": "Drug-related incidents and concerns", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 8, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concerns", "name": "General Concerns", "description": "Any other safety or behavioral concern", "order": 9, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            WHEN 'corporate' THEN
                config_json := '{
                  "categories": [
                    {"id": "workplace-harassment", "name": "Workplace Harassment", "description": "General workplace harassment incidents", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "sexual-harassment", "name": "Sexual Harassment", "description": "Sexual harassment and misconduct", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Workplace discrimination incidents", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety and cybersecurity concerns", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-health-burnout", "name": "Mental Health, Burnout & Wellbeing", "description": "Mental health and workplace wellbeing concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "leadership-misconduct", "name": "Manager/Leadership Misconduct", "description": "Inappropriate behavior by management", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "fraud-corruption", "name": "Fraud, Corruption & Ethical Violations", "description": "Financial misconduct and ethical violations", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "infrastructure", "name": "Infrastructure", "description": "Infrastructure and facility-related issues", "order": 8, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-issues", "name": "General Issues", "description": "Any other workplace concern", "order": 9, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            ELSE
                -- Default to school configuration for unknown types
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concern", "name": "General Concern", "description": "Any other safety or behavioral concern", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
        END CASE;
        
        -- Insert or update the configuration for this tenant
        INSERT INTO tenant_reporting_config (tenant_id, config)
        VALUES (inst_record.tenant_id, config_json)
        ON CONFLICT (tenant_id) DO UPDATE SET 
            config = EXCLUDED.config,
            updated_at = NOW();
        
        RAISE NOTICE 'Created tenant config for institution % (type: %)', inst_record.id, type_key;
    END LOOP;
END $$;

-- ============================================
-- 5. HANDLE INSTITUTIONS WITHOUT TENANT_ID
-- ============================================

-- Generate tenant_id for institutions that don't have one and create configs
DO $$
DECLARE
    inst_record RECORD;
    new_tenant_id UUID;
    type_key TEXT;
    config_json JSONB;
BEGIN
    FOR inst_record IN 
        SELECT i.id, i.institution_name, it.type_key 
        FROM institutions i
        LEFT JOIN institution_types it ON i.type_id = it.id
        WHERE i.tenant_id IS NULL
    LOOP
        -- Generate new tenant UUID
        new_tenant_id := gen_random_uuid();
        
        -- Update institution with new tenant_id
        UPDATE institutions 
        SET tenant_id = new_tenant_id 
        WHERE id = inst_record.id;
        
        -- Determine configuration based on institution type
        type_key := COALESCE(inst_record.type_key, 'school');
        
        -- Use same logic as above for config generation
        CASE type_key
            WHEN 'school' THEN
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concern", "name": "General Concern", "description": "Any other safety or behavioral concern", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            WHEN 'college', 'university' THEN
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "sexual-safety", "name": "Sexual Safety", "description": "Sexual harassment and safety concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "drugs", "name": "Drugs", "description": "Drug-related incidents and concerns", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 8, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concerns", "name": "General Concerns", "description": "Any other safety or behavioral concern", "order": 9, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            WHEN 'corporate' THEN
                config_json := '{
                  "categories": [
                    {"id": "workplace-harassment", "name": "Workplace Harassment", "description": "General workplace harassment incidents", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "sexual-harassment", "name": "Sexual Harassment", "description": "Sexual harassment and misconduct", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Workplace discrimination incidents", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety and cybersecurity concerns", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-health-burnout", "name": "Mental Health, Burnout & Wellbeing", "description": "Mental health and workplace wellbeing concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "leadership-misconduct", "name": "Manager/Leadership Misconduct", "description": "Inappropriate behavior by management", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "fraud-corruption", "name": "Fraud, Corruption & Ethical Violations", "description": "Financial misconduct and ethical violations", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "infrastructure", "name": "Infrastructure", "description": "Infrastructure and facility-related issues", "order": 8, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-issues", "name": "General Issues", "description": "Any other workplace concern", "order": 9, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
            ELSE
                config_json := '{
                  "categories": [
                    {"id": "bullying", "name": "Bullying", "description": "Incidents involving bullying behavior", "order": 1, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "harassment", "name": "Harassment", "description": "Incidents involving harassment", "order": 2, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "cyber-safety", "name": "Cyber Safety & Online Issues", "description": "Online safety concerns and cyberbullying", "order": 3, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "discrimination", "name": "Discrimination", "description": "Incidents involving discrimination", "order": 4, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "mental-emotional", "name": "Mental & Emotional Issues", "description": "Mental health and emotional concerns", "order": 5, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "staff-misconduct", "name": "Teacher/Staff Misconduct", "description": "Inappropriate behavior by staff members", "order": 6, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]},
                    {"id": "general-concern", "name": "General Concern", "description": "Any other safety or behavioral concern", "order": 7, "fields": [{"field_key": "description", "required": true, "enabled": true, "order": 1}]}
                  ],
                  "settings": {"allow_anonymous": true, "require_reporter_type": false, "max_attachments": 5, "pii_enabled_globally": false}
                }';
        END CASE;
        
        -- Insert the configuration for this new tenant
        INSERT INTO tenant_reporting_config (tenant_id, config)
        VALUES (new_tenant_id, config_json);
        
        RAISE NOTICE 'Created tenant % for institution % (%) with type %', new_tenant_id, inst_record.id, inst_record.institution_name, type_key;
    END LOOP;
END $$;

-- ============================================
-- 6. VERIFICATION AND SUMMARY
-- ============================================

-- Display summary of what was created
DO $$
DECLARE
    total_configs INTEGER;
    demo_exists BOOLEAN;
BEGIN
    -- Count total configurations
    SELECT COUNT(*) INTO total_configs FROM tenant_reporting_config;
    
    -- Check if demo config exists
    SELECT EXISTS(
        SELECT 1 FROM tenant_reporting_config 
        WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    ) INTO demo_exists;
    
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📊 Created % tenant reporting configurations', total_configs;
    RAISE NOTICE '🎯 Demo tenant config exists: %', demo_exists;
    RAISE NOTICE '🏢 All institutions now have tenant_id and reporting configurations';
END $$;

-- Verification: Show all tenant configurations by institution type
SELECT 
    i.institution_name,
    it.type_key as institution_type,
    i.tenant_id,
    jsonb_array_length(trc.config->'categories') as categories_count,
    trc.created_at
FROM institutions i
LEFT JOIN institution_types it ON i.type_id = it.id
LEFT JOIN tenant_reporting_config trc ON i.tenant_id = trc.tenant_id
ORDER BY it.type_key, i.institution_name;