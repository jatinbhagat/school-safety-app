# Configurable Incident Reporting - Testing Checklist

## Overview

This document provides step-by-step instructions for testing the new tenant-configurable incident reporting system locally.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- PostgreSQL client (psql) or GUI tool (optional)

## Setup Instructions

### 1. Database Migration

Run the new migration to create reporting config tables:

```bash
cd services/backend

# Connect to your local PostgreSQL database
psql -h localhost -U postgres -d school_safety

# Run the migration manually
\i migrations/018_reporting_config.sql

# Or if using a migration runner:
# npm run migrate
```

**Expected Result:**
- Tables created: `reporting_fields_catalog`, `tenant_reporting_config`, `report_audit_logs`
- Columns added to `incidents`: `dynamic_fields`, `has_pii`, `tenant_id`
- 12 default field templates inserted
- Demo tenant config inserted with 9 categories

**Verify:**
```sql
SELECT COUNT(*) FROM reporting_fields_catalog;  -- Should return 12
SELECT COUNT(*) FROM tenant_reporting_config;    -- Should return 1 (demo tenant)
SELECT config FROM tenant_reporting_config LIMIT 1; -- Should show JSON config
```

### 2. Backend Setup

```bash
cd services/backend

# Install dependencies (if needed)
npm install

# Set up environment variables
cp .env.local.example .env.local  # If not exists

# Add PII encryption key (development only)
echo "PII_ENCRYPTION_KEY=dev-test-key-for-local-development-only" >> .env.local

# Start backend
npm run dev
```

**Expected Result:**
- Server starts on port 3001
- No compilation errors
- Logs show: "School Safety Backend running on port 3001"

**Verify:**
```bash
# Health check
curl http://localhost:3001/health

# Get demo tenant config
curl http://localhost:3001/api/tenant/demo/reporting-config

# Get fields catalog
curl http://localhost:3001/api/reporting/fields/catalog
```

### 3. Frontend Setup (Optional - for Admin UI)

```bash
cd services/pwa

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Result:**
- PWA starts on port 3000
- Navigate to `http://localhost:3000/admin/reporting-config`
- Admin config editor loads

## Testing Scenarios

### Test 1: Basic Report Submission (No Dynamic Fields)

**Purpose:** Verify backward compatibility with existing incidents

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bullying",
    "description": "Legacy report without dynamic fields",
    "class_section": "10-A"
  }'
```

**Expected:**
- Status: 201 Created
- Response includes `id`, `created_at`, `has_pii: false`
- Database: `dynamic_fields` column is NULL
- Backward compatible

### Test 2: Report with Dynamic Fields (No PII)

**Purpose:** Validate dynamic fields validation and storage

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "bullying",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "This is a bullying incident with dynamic fields",
      "location": "Playground",
      "class_section": "10-B",
      "witness_present": true
    }
  }'
```

**Expected:**
- Status: 201 Created
- Response: `has_pii: false`, `fields_processed: 5`
- Database: `dynamic_fields` JSONB populated, `has_pii` = false
- Audit log created with field keys

**Verify:**
```sql
SELECT id, category, dynamic_fields, has_pii FROM incidents ORDER BY id DESC LIMIT 1;
SELECT field_keys, has_pii_fields FROM report_audit_logs ORDER BY created_at DESC LIMIT 1;
```

### Test 3: Report with PII Enabled (College Ragging Example)

**Purpose:** Test PII field enablement and encryption

**Step 1:** Enable PII for harassment category via Admin UI or API:

```bash
# First, get current config
curl http://localhost:3001/api/tenant/demo/reporting-config > config.json

# Edit config.json: For "harassment" category, set contact_email enabled to true:
# "fields": [
#   ...
#   {"field_key": "contact_email", "required": false, "enabled": true, "order": 5, "pii": true}
# ]

# Update config
curl -X POST http://localhost:3001/api/tenant/demo/reporting-config \
  -H "Content-Type: application/json" \
  -d @config.json
```

**Step 2:** Submit report with PII:

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "harassment",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "Harassment incident requiring follow-up",
      "location": "Library",
      "contact_email": "student@college.edu"
    }
  }'
```

**Expected:**
- Status: 201 Created
- Response: `has_pii: true`
- Database: `dynamic_fields` contains encrypted contact_email
- `has_pii` = true
- Audit log shows `has_pii_fields: true`

**Verify Encryption:**
```sql
SELECT dynamic_fields->'contact_email' FROM incidents WHERE has_pii = true ORDER BY id DESC LIMIT 1;
-- Should show encrypted string (not plaintext email)
-- Format: "iv:authTag:encrypted" (hex strings separated by colons)
```

### Test 4: PII Field Rejected When Disabled

**Purpose:** Ensure PII protection - reject PII when not enabled

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "mental_stress",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "Feeling stressed",
      "contact_phone": "+1234567890"
    }
  }'
```

**Expected:**
- Status: 400 Bad Request
- Error message: "PII field \"contact_phone\" is not enabled for collection"
- Code: `PII_NOT_ENABLED`
- No incident created

### Test 5: Required Field Validation

**Purpose:** Validate required field enforcement

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "bullying",
    "dynamic_fields": {
      "location": "Playground"
    }
  }'
```

**Expected:**
- Status: 400 Bad Request
- Errors array includes:
  - `field: "reporter_type", code: "REQUIRED_FIELD_MISSING"`
  - `field: "description", code: "REQUIRED_FIELD_MISSING"`

### Test 6: Invalid Field Type Validation

**Purpose:** Test type validation (email, phone, select, etc.)

```bash
# Invalid email
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "harassment",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "Test",
      "contact_email": "not-a-valid-email"
    }
  }'
```

**Expected:**
- Status: 400 Bad Request
- Error: `field: "contact_email", code: "INVALID_EMAIL"`

```bash
# Invalid select option
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "bullying",
    "dynamic_fields": {
      "reporter_type": "InvalidType",
      "description": "Test"
    }
  }'
```

**Expected:**
- Status: 400 Bad Request
- Error: `field: "reporter_type", code: "INVALID_OPTION"`

### Test 7: Unknown Field Rejection (Security)

**Purpose:** Prevent injection of unexpected fields

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "bullying",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "Test",
      "malicious_field": "attempt to inject"
    }
  }'
```

**Expected:**
- Status: 400 Bad Request
- Error: `field: "malicious_field", code: "UNKNOWN_FIELD"`

### Test 8: Admin Config Editor (UI)

**Purpose:** Test admin configuration interface

1. Navigate to: `http://localhost:3000/admin/reporting-config`
2. Enter tenant ID: `demo`
3. Verify categories load
4. **Add new category:**
   - Click "Add" button
   - Name: "Ragging"
   - Add fields: reporter_type, description, hostel_block
   - Add PII field: contact_email (should show warning modal)
   - Confirm PII warning
   - Save configuration
5. **Preview:**
   - Click "Preview Kiosk Form"
   - Verify all categories and fields render correctly
6. **Export/Import:**
   - Export config JSON
   - Modify JSON (change category name)
   - Import modified JSON
   - Verify changes applied

### Test 9: Import Sample Configs

**Purpose:** Test bulk config import for different tenant types

```bash
# Import college config
curl -X POST http://localhost:3001/api/tenant/demo/reporting-config \
  -H "Content-Type: application/json" \
  -d @tools/demo/reporting_config_samples/college_config.json

# Verify ragging category exists
curl http://localhost:3001/api/tenant/demo/reporting-config | grep -i ragging

# Import corporate config
curl -X POST http://localhost:3001/api/tenant/demo/reporting-config \
  -H "Content-Type: application/json" \
  -d @tools/demo/reporting_config_samples/corporate_config.json

# Verify workplace harassment category
curl http://localhost:3001/api/tenant/demo/reporting-config | grep -i workplace
```

### Test 10: Migration Script (Existing Reports)

**Purpose:** Test migration of legacy reports to dynamic_fields

```bash
cd services/backend

# Dry run
npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --dry-run

# Review output, verify mapping

# Execute migration
npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --execute
```

**Expected:**
- Shows count of incidents to migrate
- Shows sample mapping
- Migrates legacy fields to `dynamic_fields` JSONB
- No data loss
- Idempotent (safe to run multiple times)

**Verify:**
```sql
SELECT COUNT(*) FROM incidents WHERE dynamic_fields IS NOT NULL;
-- Should show migrated incidents

SELECT id, category, description, dynamic_fields FROM incidents LIMIT 5;
-- Verify description moved to dynamic_fields.description
```

### Test 11: Unit Tests

**Purpose:** Run automated validation tests

```bash
cd services/backend

# Install test dependencies
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test -- reportingValidation.test.ts
```

**Expected:**
- All tests pass
- Coverage includes:
  - Required field validation
  - PII enablement checks
  - Type validation (email, phone, select)
  - Unknown field rejection
  - Sanitization

### Test 12: Dynamic Kiosk UI (React Component)

**Purpose:** Test dynamic form rendering in kiosk

1. Navigate to kiosk page
2. Import `DynamicReportForm` component
3. Render with tenant_id="demo"
4. **Category selection:**
   - All categories from config displayed
   - Click category
5. **Form rendering:**
   - Fields render in correct order
   - Required fields marked with *
   - PII fields show orange badge "Optional PII"
   - Help text displays
   - Placeholders work
6. **Validation:**
   - Try submit with missing required fields → errors shown
   - Try invalid email → error shown
   - Fix errors → submission succeeds
7. **Success:**
   - Submission returns report ID
   - Form resets
   - Success message shown

## Acceptance Criteria Checklist

All scenarios from requirements:

- [ ] Admin can add a new category "Ragging" for a College tenant
- [ ] Admin can set fields: reporter_type, description, hostel_block, contact_email (PII enabled)
- [ ] Kiosk renders exactly the configured fields for that tenant
- [ ] Required fields are enforced (client and server)
- [ ] Submitting with PII when disabled → 400 error with helpful message
- [ ] Submitting with PII when enabled → stores encrypted PII and `has_pii=true`
- [ ] Preview in Admin shows exact kiosk form
- [ ] Unit tests pass
- [ ] Migration script works (dry-run and execute)
- [ ] Backward compatibility: old incidents still readable
- [ ] Export/import config works
- [ ] Security: unknown fields rejected
- [ ] Security: PII encrypted in database
- [ ] Audit logs created (field keys, not values)

## Troubleshooting

### Error: "PII_ENCRYPTION_KEY not set"

**Solution:** Add to `.env.local`:
```
PII_ENCRYPTION_KEY=dev-test-key-for-local-development-only
```

### Error: "Table does not exist"

**Solution:** Run migration 018:
```bash
psql -h localhost -U postgres -d school_safety -f services/backend/migrations/018_reporting_config.sql
```

### Error: "Config not found"

**Solution:** Verify demo tenant config inserted:
```sql
SELECT * FROM tenant_reporting_config WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
```

If missing, re-run migration or manually insert.

### TypeScript compilation errors

**Solution:** Check imports and types:
```bash
cd services/backend
npx tsc --noEmit
```

Fix any type errors shown.

## Performance Testing (Optional)

### Benchmark JSONB Queries

```sql
EXPLAIN ANALYZE SELECT * FROM incidents
WHERE dynamic_fields @> '{"urgency_level": "High"}';

-- Should use GIN index on dynamic_fields
```

### Load Testing

```bash
# Install artillery (if not installed)
npm install -g artillery

# Create load test config (artillery.yml):
# config:
#   target: 'http://localhost:3001'
# scenarios:
#   - name: Submit reports
#     requests:
#       - post:
#           url: '/report'
#           json:
#             tenant_id: 'demo'
#             category: 'bullying'
#             dynamic_fields:
#               reporter_type: 'Student'
#               description: 'Load test report'

# Run load test
artillery run artillery.yml
```

## Next Steps

After local testing passes:

1. Deploy to staging environment
2. Run acceptance tests with QA team
3. Test with real tenant configs (school, college, corporate)
4. Monitor PII encryption/decryption performance
5. Review audit logs for compliance
6. Document PII handling procedures for operators
7. Train support staff on config management

## Summary

This configurable reporting system enables:
- ✅ Tenant-specific categories and fields
- ✅ Privacy-first design with optional PII
- ✅ Encryption at rest for sensitive data
- ✅ Flexible validation and field types
- ✅ Backward compatibility
- ✅ Admin-friendly config management
- ✅ Compliance-ready audit trail

All testing scenarios should pass before merging to develop branch.
