-- Migration: Add school_id to incidents table for multi-school support
-- Description: Enables tracking incidents per school for scalable multi-school deployments

-- Add school_id column (nullable for backward compatibility)
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- Create index for efficient school-based queries
CREATE INDEX IF NOT EXISTS idx_incidents_school_id ON incidents(school_id);

-- Create composite index for common query pattern (school + created_at)
CREATE INDEX IF NOT EXISTS idx_incidents_school_created ON incidents(school_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN incidents.school_id IS 'Reference to school (nullable for single-school or legacy data)';

-- Note: In a full multi-tenant system, you might want to:
-- 1. Create a schools table and add a foreign key constraint
-- 2. Make school_id NOT NULL after backfilling existing data
-- 3. Add row-level security policies for tenant isolation
--
-- Example future migration:
-- CREATE TABLE schools (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   code TEXT UNIQUE NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
--
-- ALTER TABLE incidents
-- ADD CONSTRAINT fk_incidents_school
-- FOREIGN KEY (school_id) REFERENCES schools(id);
