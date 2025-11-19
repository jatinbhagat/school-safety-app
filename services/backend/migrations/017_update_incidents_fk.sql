-- Migration: Link incidents to institutions
-- Description: Add foreign key constraint from incidents to institutions

-- Step 1: Set all existing incidents' school_id to NULL
-- (They were created before institutions table existed)
UPDATE incidents SET school_id = NULL WHERE school_id IS NOT NULL;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_incidents_institution'
    ) THEN
        ALTER TABLE incidents
        ADD CONSTRAINT fk_incidents_institution
        FOREIGN KEY (school_id) REFERENCES institutions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create composite indexes for institution-based incident queries
CREATE INDEX IF NOT EXISTS idx_incidents_institution_status
ON incidents(school_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_institution_category
ON incidents(school_id, category, created_at DESC);

-- Update comment
COMMENT ON COLUMN incidents.school_id IS 'Reference to institution (foreign key to institutions table). NULL for legacy incidents created before multi-tenancy.';
