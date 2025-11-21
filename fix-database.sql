-- Database Fix Script
-- This script fixes the location column constraint and cleans test data

-- Step 1: Make the old location column nullable (if not already done)
ALTER TABLE institutions
ALTER COLUMN location DROP NOT NULL;

-- Step 2: Show all institutions (to verify what exists)
SELECT id, institution_name, url_slug, email, country, state, city, location, location_legacy
FROM institutions
ORDER BY id;

-- Step 3: Delete test institutions (keep only demo data)
-- Review the output from Step 2 first, then uncomment and run these lines:

-- DELETE FROM users WHERE institution_id IN (
--   SELECT id FROM institutions WHERE url_slug != 'demo'
-- );

-- DELETE FROM institutions WHERE url_slug != 'demo';

-- Step 4: Verify cleanup (should only show demo institution)
-- SELECT id, institution_name, url_slug FROM institutions;
