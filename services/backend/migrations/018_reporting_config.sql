-- Migration: Create tenant reporting configuration system
-- Description: Adds configurable, tenant-aware incident reporting with dynamic fields and PII controls

-- ============================================
-- 1. REPORTING FIELDS CATALOG
-- ============================================
-- Shared templates for re-usable field definitions

CREATE TABLE IF NOT EXISTS reporting_fields_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'file', 'phone', 'email')),
    options JSONB DEFAULT NULL, -- For select/multiselect: { values: ["option1", "option2"] }
    required_by_default BOOLEAN DEFAULT false,
    pii_flag BOOLEAN DEFAULT false, -- Indicates field contains PII
    help_text TEXT DEFAULT NULL,
    placeholder TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for catalog
CREATE INDEX IF NOT EXISTS idx_reporting_fields_catalog_type ON reporting_fields_catalog(type);
CREATE INDEX IF NOT EXISTS idx_reporting_fields_catalog_pii ON reporting_fields_catalog(pii_flag);

-- Comments
COMMENT ON TABLE reporting_fields_catalog IS 'Shared catalog of field templates for tenant reporting configurations';
COMMENT ON COLUMN reporting_fields_catalog.name IS 'Unique identifier/key for the field (e.g., "reporter_type", "contact_email")';
COMMENT ON COLUMN reporting_fields_catalog.type IS 'Field type: text, textarea, select, multiselect, boolean, date, file, phone, email';
COMMENT ON COLUMN reporting_fields_catalog.options IS 'JSONB containing options for select/multiselect fields';
COMMENT ON COLUMN reporting_fields_catalog.pii_flag IS 'True if field may contain personally identifiable information';

-- ============================================
-- 2. TENANT REPORTING CONFIG
-- ============================================
-- Per-tenant configuration for categories and dynamic fields

CREATE TABLE IF NOT EXISTS tenant_reporting_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- References institution/school
    config JSONB NOT NULL, -- Full config: { categories: [...], settings: {...} }
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure one config per tenant
    UNIQUE(tenant_id)
);

-- Create indexes for tenant config
CREATE INDEX IF NOT EXISTS idx_tenant_reporting_config_tenant ON tenant_reporting_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reporting_config_updated ON tenant_reporting_config(updated_at DESC);

-- Comments
COMMENT ON TABLE tenant_reporting_config IS 'Per-tenant incident reporting configuration (categories, fields, PII settings)';
COMMENT ON COLUMN tenant_reporting_config.tenant_id IS 'UUID reference to institution/school (tenant)';
COMMENT ON COLUMN tenant_reporting_config.config IS 'JSONB config: categories with fields, ordering, PII enablement, etc.';

-- ============================================
-- 3. UPDATE INCIDENTS TABLE
-- ============================================
-- Add columns for dynamic fields and PII tracking

ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS dynamic_fields JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pii BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT NULL;

-- Create GIN index for dynamic_fields JSONB queries
CREATE INDEX IF NOT EXISTS idx_incidents_dynamic_fields ON incidents USING GIN (dynamic_fields);
CREATE INDEX IF NOT EXISTS idx_incidents_has_pii ON incidents(has_pii);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_id ON incidents(tenant_id);

-- Comments
COMMENT ON COLUMN incidents.dynamic_fields IS 'JSONB storing dynamic field values submitted based on tenant config';
COMMENT ON COLUMN incidents.has_pii IS 'True if incident contains PII fields (encrypted)';
COMMENT ON COLUMN incidents.tenant_id IS 'UUID reference to tenant/institution for this incident';

-- ============================================
-- 4. INSERT DEFAULT FIELD CATALOG TEMPLATES
-- ============================================

INSERT INTO reporting_fields_catalog (name, type, options, required_by_default, pii_flag, help_text, placeholder)
VALUES
    -- Reporter type dropdown
    ('reporter_type', 'select',
     '{"values": ["Student", "Teacher", "Ex-Student", "Ex-Teacher", "Ex-School Staff", "School Staff", "Prefer not to disclose"]}'::jsonb,
     false, false, 'Select your relationship to the institution', 'Select reporter type'),

    -- Class/section info
    ('class_section', 'text', NULL, false, false, 'Optional: Your class or section', 'e.g., 10-A, Grade 5, CS-101'),

    -- Description
    ('description', 'textarea', NULL, true, false, 'Provide detailed description of the incident', 'Describe what happened...'),

    -- Attachments
    ('attachments', 'file', '{"accept": ["image/*", "video/*", "application/pdf"], "maxFiles": 5}'::jsonb, false, false, 'Upload supporting evidence (optional)', NULL),

    -- Contact phone (PII)
    ('contact_phone', 'phone', NULL, false, true, 'Optional: Provide contact phone number', '+1 (555) 123-4567'),

    -- Contact email (PII)
    ('contact_email', 'email', NULL, false, true, 'Optional: Provide contact email address', 'your.email@example.com'),

    -- Additional fields for various incident types
    ('location', 'text', NULL, false, false, 'Where did this happen?', 'e.g., Classroom 3B, Playground, Bus #12'),

    ('incident_date', 'date', NULL, false, false, 'When did this occur?', NULL),

    ('witness_present', 'boolean', NULL, false, false, 'Were there witnesses?', NULL),

    ('hostel_block', 'text', NULL, false, false, 'Hostel/Dorm block (if applicable)', 'e.g., Block A, North Wing'),

    ('department', 'text', NULL, false, false, 'Department (for corporate/college)', 'e.g., HR, Engineering, Finance'),

    ('urgency_level', 'select',
     '{"values": ["Low", "Medium", "High", "Emergency"]}'::jsonb,
     false, false, 'How urgent is this incident?', NULL);

-- ============================================
-- 5. INSERT DEFAULT TENANT CONFIG (DEMO SCHOOL)
-- ============================================

-- Create a demo tenant UUID (deterministic for demo purposes)
DO $$
DECLARE
    demo_tenant_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    INSERT INTO tenant_reporting_config (tenant_id, config)
    VALUES (
        demo_tenant_uuid,
        '{
            "categories": [
                {
                    "id": "bullying",
                    "name": "Bullying",
                    "description": "Report bullying incidents",
                    "order": 1,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "location", "required": false, "enabled": true, "order": 3},
                        {"field_key": "incident_date", "required": false, "enabled": true, "order": 4},
                        {"field_key": "class_section", "required": false, "enabled": true, "order": 5},
                        {"field_key": "witness_present", "required": false, "enabled": true, "order": 6},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 7}
                    ]
                },
                {
                    "id": "harassment",
                    "name": "Harassment",
                    "description": "Report harassment or discrimination",
                    "order": 2,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "location", "required": false, "enabled": true, "order": 3},
                        {"field_key": "incident_date", "required": false, "enabled": true, "order": 4},
                        {"field_key": "contact_email", "required": false, "enabled": false, "order": 5, "pii": true},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 6}
                    ]
                },
                {
                    "id": "cyberbullying",
                    "name": "Cyberbullying",
                    "description": "Report online harassment or bullying",
                    "order": 3,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "incident_date", "required": false, "enabled": true, "order": 3},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 4}
                    ]
                },
                {
                    "id": "physical",
                    "name": "Physical Incident",
                    "description": "Report physical altercations or injuries",
                    "order": 4,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "location", "required": true, "enabled": true, "order": 3},
                        {"field_key": "incident_date", "required": true, "enabled": true, "order": 4},
                        {"field_key": "urgency_level", "required": true, "enabled": true, "order": 5},
                        {"field_key": "witness_present", "required": false, "enabled": true, "order": 6},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 7}
                    ]
                },
                {
                    "id": "mental_stress",
                    "name": "Mental Stress",
                    "description": "Report mental health concerns or stress",
                    "order": 5,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "contact_phone", "required": false, "enabled": false, "order": 3, "pii": true},
                        {"field_key": "contact_email", "required": false, "enabled": false, "order": 4, "pii": true}
                    ]
                },
                {
                    "id": "academic_pressure",
                    "name": "Academic Pressure",
                    "description": "Report excessive academic pressure or stress",
                    "order": 6,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "class_section", "required": false, "enabled": true, "order": 3}
                    ]
                },
                {
                    "id": "depression",
                    "name": "Depression",
                    "description": "Report feelings of depression or severe sadness",
                    "order": 7,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "contact_phone", "required": false, "enabled": false, "order": 3, "pii": true}
                    ]
                },
                {
                    "id": "cheating",
                    "name": "Cheating",
                    "description": "Report academic dishonesty or cheating",
                    "order": 8,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "class_section", "required": false, "enabled": true, "order": 3},
                        {"field_key": "incident_date", "required": false, "enabled": true, "order": 4},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 5}
                    ]
                },
                {
                    "id": "general",
                    "name": "General",
                    "description": "Report other safety or welfare concerns",
                    "order": 9,
                    "fields": [
                        {"field_key": "reporter_type", "required": true, "enabled": true, "order": 1},
                        {"field_key": "description", "required": true, "enabled": true, "order": 2},
                        {"field_key": "location", "required": false, "enabled": true, "order": 3},
                        {"field_key": "attachments", "required": false, "enabled": true, "order": 4}
                    ]
                }
            ],
            "settings": {
                "allow_anonymous": true,
                "require_reporter_type": true,
                "max_attachments": 5,
                "pii_enabled_globally": false
            }
        }'::jsonb
    )
    ON CONFLICT (tenant_id) DO NOTHING;
END $$;

-- ============================================
-- 6. CREATE AUDIT TABLE FOR REPORTING CONFIG
-- ============================================

CREATE TABLE IF NOT EXISTS report_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
    tenant_id UUID,
    action TEXT NOT NULL, -- 'report_submitted', 'pii_field_stored', 'config_updated', etc.
    field_keys TEXT[], -- Array of field keys processed (not values)
    has_pii_fields BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT NULL, -- Additional audit metadata
    ip_hash TEXT DEFAULT NULL, -- Optional hashed IP for abuse prevention
    user_agent_hash TEXT DEFAULT NULL, -- Optional hashed user agent
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_incident ON report_audit_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_tenant ON report_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_action ON report_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_report_audit_logs_created ON report_audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE report_audit_logs IS 'Audit trail for incident reports and config changes (PII-safe)';
COMMENT ON COLUMN report_audit_logs.field_keys IS 'Array of field keys submitted (not values, for privacy)';
COMMENT ON COLUMN report_audit_logs.has_pii_fields IS 'True if submission included PII fields';
COMMENT ON COLUMN report_audit_logs.ip_hash IS 'SHA256 hash of IP address (not raw IP, for privacy)';

-- ============================================
-- 7. CREATE FUNCTION FOR UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_tenant_reporting_config_updated_at
    BEFORE UPDATE ON tenant_reporting_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reporting_fields_catalog_updated_at
    BEFORE UPDATE ON reporting_fields_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS (if using RLS)
-- ============================================
-- Note: Adjust based on your RLS policy requirements

-- Grant read access to catalog for all authenticated users
-- GRANT SELECT ON reporting_fields_catalog TO authenticated_role;

-- Grant tenant admins access to their config
-- GRANT SELECT, UPDATE ON tenant_reporting_config TO tenant_admin_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✓ Created reporting_fields_catalog with 12 default field templates
-- ✓ Created tenant_reporting_config for per-tenant customization
-- ✓ Updated incidents table with dynamic_fields, has_pii, tenant_id
-- ✓ Created report_audit_logs for PII-safe audit trail
-- ✓ Inserted demo tenant config with 9 categories (Bullying, Harassment, etc.)
-- ✓ Added GIN index on incidents.dynamic_fields for efficient JSONB queries
-- ✓ Created triggers for automatic updated_at timestamps
