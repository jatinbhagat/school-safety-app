-- Migration: Link institutions to tenant reporting configs
-- Description: Adds tenant_id to institutions and creates tenant configs for existing institutions

-- Add tenant_id column to institutions
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT NULL;

-- Create index on tenant_id
CREATE INDEX IF NOT EXISTS idx_institutions_tenant_id ON institutions(tenant_id);

-- Add foreign key constraint (optional, can be removed if causing issues)
-- ALTER TABLE institutions
-- ADD CONSTRAINT fk_institutions_tenant_id
-- FOREIGN KEY (tenant_id) REFERENCES tenant_reporting_config(tenant_id);

-- Update existing institutions to have a tenant_id
-- For now, we'll generate new UUIDs for each institution
DO $$
DECLARE
    inst_record RECORD;
    new_tenant_id UUID;
BEGIN
    FOR inst_record IN SELECT id FROM institutions WHERE tenant_id IS NULL LOOP
        -- Generate a new UUID for this institution's tenant
        new_tenant_id := gen_random_uuid();

        -- Update the institution
        UPDATE institutions SET tenant_id = new_tenant_id WHERE id = inst_record.id;

        -- Create a tenant config based on the demo config
        INSERT INTO tenant_reporting_config (tenant_id, config)
        SELECT
            new_tenant_id,
            config
        FROM tenant_reporting_config
        WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
        ON CONFLICT (tenant_id) DO NOTHING;
    END LOOP;
END $$;

-- Comments
COMMENT ON COLUMN institutions.tenant_id IS 'UUID linking to tenant_reporting_config for this institution';

-- Migration complete
