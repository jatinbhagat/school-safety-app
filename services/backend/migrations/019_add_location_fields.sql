-- Migration: Add country, state, and city fields to institutions table
-- This migration adds structured location fields to replace the free-text location field

-- Add new location columns
ALTER TABLE institutions
ADD COLUMN country VARCHAR(2),
ADD COLUMN state VARCHAR(50),
ADD COLUMN city VARCHAR(100),
ADD COLUMN location_legacy TEXT;

-- Migrate existing location data to legacy field
UPDATE institutions
SET location_legacy = location
WHERE location IS NOT NULL AND location != '';

-- Make the old location column nullable (no longer required for new records)
ALTER TABLE institutions
ALTER COLUMN location DROP NOT NULL;

-- Add indexes for faster lookups
CREATE INDEX idx_institutions_country ON institutions(country);
CREATE INDEX idx_institutions_state ON institutions(state);
CREATE INDEX idx_institutions_city ON institutions(city);

-- Add comments
COMMENT ON COLUMN institutions.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, CA, GB, AU)';
COMMENT ON COLUMN institutions.state IS 'State, province, or region code/name';
COMMENT ON COLUMN institutions.city IS 'City or municipality name';
COMMENT ON COLUMN institutions.location_legacy IS 'Legacy free-text location field (kept for backward compatibility)';
