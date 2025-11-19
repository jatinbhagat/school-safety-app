# Configurable Incident Reporting System

## Overview

The Configurable Incident Reporting System enables tenant-aware (school/college/corporate) dynamic incident reporting with:

- **Dynamic form fields** per category (no code changes required)
- **PII controls** with encryption at rest
- **Tenant-specific configurations** for categories and fields
- **Field catalog** for reusable templates
- **Backward compatibility** with existing incidents
- **Privacy-first design** with anonymity by default

## Architecture

### Database Tables

1. **`reporting_fields_catalog`** - Shared field templates
   - Field types: text, textarea, select, multiselect, boolean, date, file, phone, email
   - PII flag for sensitive fields
   - Validation rules and help text

2. **`tenant_reporting_config`** - Per-tenant configuration
   - Categories with ordered fields
   - Field enablement and requirements
   - PII enablement per field per tenant

3. **`incidents`** (updated)
   - `dynamic_fields` (JSONB) - Dynamic field values
   - `has_pii` (BOOLEAN) - PII presence flag
   - `tenant_id` (UUID) - Tenant reference
   - GIN index for efficient JSONB queries

4. **`report_audit_logs`** - PII-safe audit trail
   - Field keys (not values) for privacy
   - IP and user agent hashes
   - PII presence flags

### API Endpoints

#### Public Endpoints

```http
# Get tenant reporting configuration (public for kiosk)
GET /api/tenant/:tenantId/reporting-config

# Get field catalog (public for config editor)
GET /api/reporting/fields/catalog

# Submit incident report (anonymous)
POST /report
```

#### Admin Endpoints (Authenticated)

```http
# Update tenant reporting configuration
POST /api/tenant/:tenantId/reporting-config

# Add custom field to catalog
POST /api/reporting/fields/catalog
```

### Security & Privacy

#### Anonymity by Default

- No login required for incident reports
- No device fingerprinting by default
- IP addresses hashed (SHA-256) in audit logs

#### PII Controls

1. **Opt-in PII Collection**
   - PII fields disabled by default
   - Admin must explicitly enable per field
   - Warning modal when enabling PII

2. **Encryption at Rest**
   - AES-256-GCM encryption for all PII values
   - Unique IV per encryption
   - Authentication tags for integrity
   - KMS-managed keys in production

3. **Audit Trail**
   - Field keys logged (not values)
   - PII presence flags only
   - Hashed IP/user agent for abuse prevention

#### Validation & Sanitization

- Server-side validation authoritative
- Type checking (email, phone, date, etc.)
- Option validation for select fields
- XSS prevention via sanitization
- Unknown field rejection

## Configuration Schema

### Tenant Config Structure

```json
{
  "categories": [
    {
      "id": "bullying",
      "name": "Bullying",
      "description": "Report bullying incidents",
      "order": 1,
      "fields": [
        {
          "field_key": "reporter_type",
          "required": true,
          "enabled": true,
          "order": 1
        },
        {
          "field_key": "contact_email",
          "required": false,
          "enabled": true,
          "order": 2,
          "pii": true,
          "help_text": "Optional: Provide email for follow-up"
        }
      ]
    }
  ],
  "settings": {
    "allow_anonymous": true,
    "require_reporter_type": true,
    "max_attachments": 5,
    "pii_enabled_globally": false
  }
}
```

### Field Definition Schema

```json
{
  "name": "contact_email",
  "type": "email",
  "options": null,
  "required_by_default": false,
  "pii_flag": true,
  "help_text": "Provide your email for follow-up",
  "placeholder": "your.email@example.com"
}
```

## Usage Examples

### Example 1: School Default Config

**Use Case:** K-12 school with focus on bullying and mental health

**Categories:**
- Bullying (location, class, witnesses)
- Harassment
- Cyberbullying
- Physical Incident (urgency required)
- Mental Stress (optional contact PII disabled by default)
- Academic Pressure
- General

**PII Fields:** Disabled by default; admin can enable contact fields

**Sample Config:** `tools/demo/reporting_config_samples/school_config.json`

### Example 2: College with Ragging Category

**Use Case:** College in India requiring ragging reports

**Categories:**
- Ragging (hostel block, contact email enabled)
- Harassment (department field)
- Academic Pressure
- Cheating
- General

**PII Fields:** Contact email enabled for ragging category

**Sample Config:** `tools/demo/reporting_config_samples/college_config.json`

**Admin Steps:**
1. Navigate to Admin > Reporting Config
2. Add category "Ragging"
3. Add fields: reporter_type, description, hostel_block, contact_email
4. Enable contact_email with PII warning
5. Save and preview kiosk form

### Example 3: Corporate Workplace Reporting

**Use Case:** Corporate ethics and safety hotline

**Categories:**
- Workplace Harassment (department, contact optional)
- Safety Concern (urgency required)
- Ethics Violation
- Mental Health Support
- General Report

**PII Fields:** Contact enabled for mental health and harassment

**Sample Config:** `tools/demo/reporting_config_samples/corporate_config.json`

## Enabling PII Fields

### Admin Workflow

1. Navigate to Admin Dashboard > Reporting Configuration
2. Select category
3. Add PII field (e.g., contact_email)
4. Toggle "Enable" switch
5. **Warning modal appears:**
   ```
   ⚠️ Enabling PII Collection

   Enabling this field will collect personally identifiable information.
   Ensure you have:
   - Parental/employee consent (if required by law)
   - Compliance with GDPR, COPPA, local privacy laws
   - Data retention and deletion policies in place

   PII will be encrypted at rest using AES-256-GCM.
   ```
6. Confirm and save
7. Preview kiosk form to verify

### Compliance Checklist

Before enabling PII:
- [ ] Review local privacy laws (GDPR, COPPA, etc.)
- [ ] Obtain necessary consents
- [ ] Document data retention policy
- [ ] Configure KMS encryption keys (production)
- [ ] Train staff on PII handling
- [ ] Set up data deletion procedures

## Import/Export Configuration

### Export Config (for backup or migration)

```bash
curl http://localhost:3001/api/tenant/TENANT_ID/reporting-config \
  -H "Authorization: Bearer TOKEN" \
  > config_backup.json
```

### Import Config

```bash
curl -X POST http://localhost:3001/api/tenant/TENANT_ID/reporting-config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d @config_backup.json
```

### Bulk Import for Onboarding

```bash
# Import school config for new tenant
curl -X POST http://localhost:3001/api/tenant/NEW_TENANT_ID/reporting-config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d @tools/demo/reporting_config_samples/school_config.json
```

## Testing & Validation

### Test Scenarios

1. **Required field validation**
   ```bash
   curl -X POST http://localhost:3001/report \
     -H "Content-Type: application/json" \
     -d '{
       "category": "bullying",
       "tenant_id": "demo",
       "dynamic_fields": {
         "description": "Test incident"
       }
     }'
   # Expected: 400 error (reporter_type required)
   ```

2. **PII disabled validation**
   ```bash
   curl -X POST http://localhost:3001/report \
     -H "Content-Type: application/json" \
     -d '{
       "category": "mental_stress",
       "tenant_id": "demo",
       "dynamic_fields": {
         "reporter_type": "Student",
         "description": "Feeling stressed",
         "contact_email": "test@example.com"
       }
     }'
   # Expected: 400 error (PII field not enabled)
   ```

3. **Valid submission with PII**
   ```bash
   # First, enable contact_email for harassment category via admin UI
   # Then submit:
   curl -X POST http://localhost:3001/report \
     -H "Content-Type: application/json" \
     -d '{
       "category": "harassment",
       "tenant_id": "demo",
       "dynamic_fields": {
         "reporter_type": "Student",
         "description": "Incident description",
         "contact_email": "student@school.edu"
       }
     }'
   # Expected: 201 success, has_pii: true
   ```

### Unit Tests

Run validation tests:
```bash
cd services/backend
npm test -- reportingValidation.test.ts
```

## Caching & Performance

### Caching Strategy

1. **Tenant Config Cache**
   - In-memory cache with 60s TTL
   - Invalidate on config update
   - Redis in production (optional)

2. **Field Catalog Cache**
   - Long TTL (5 minutes) - rarely changes
   - Shared across tenants

### Performance Optimizations

- GIN index on `incidents.dynamic_fields` for JSONB queries
- Indexes on `tenant_id`, `has_pii`, `created_at`
- Prepared statements for validation queries

### Example Queries

```sql
-- Find incidents with specific dynamic field value
SELECT * FROM incidents
WHERE dynamic_fields @> '{"urgency_level": "High"}';

-- Find incidents with PII for data retention compliance
SELECT id, tenant_id, created_at FROM incidents
WHERE has_pii = true AND created_at < NOW() - INTERVAL '7 years';
```

## Migration & Backward Compatibility

### Existing Incidents

Incidents without `dynamic_fields` remain readable. When rendering incident details:
1. Check if `dynamic_fields` is NULL
2. If NULL, fall back to legacy columns: `description`, `class_section`, `attachments`
3. If present, render from `dynamic_fields`

### Migration Script

To migrate existing incidents to dynamic fields:

```bash
cd services/backend
npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --dry-run
# Review output, then:
npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --execute
```

**What it does:**
- Maps legacy `description`, `class_section` to dynamic_fields
- Preserves all existing data
- No data loss
- Idempotent (safe to run multiple times)

## Troubleshooting

### PII Decryption Fails

**Error:** `[DECRYPTION_FAILED]` appears in incident detail

**Causes:**
- Encryption key changed/rotated without migrating data
- Database corruption
- Invalid ciphertext format

**Solution:**
1. Check `PII_ENCRYPTION_KEY` environment variable
2. If key rotated, use old key to decrypt, then re-encrypt with new key
3. Contact DBA if corruption suspected

### Unknown Field Rejected

**Error:** `Unknown or disabled field: field_name`

**Causes:**
- Field not in catalog
- Field not enabled in tenant config
- Typo in field key

**Solution:**
1. Check field exists in catalog: `GET /api/reporting/fields/catalog`
2. Check field enabled in tenant config
3. Verify field_key spelling matches catalog exactly

### Config Validation Fails

**Error:** `Configuration validation failed`

**Causes:**
- Invalid JSON structure
- Missing required fields
- Invalid field types

**Solution:**
1. Validate JSON syntax
2. Compare against schema in this doc
3. Check error details in response

## Development Notes

### Adding a New Field Type

1. Add type to `reporting_fields_catalog.type` CHECK constraint:
   ```sql
   ALTER TABLE reporting_fields_catalog DROP CONSTRAINT reporting_fields_catalog_type_check;
   ALTER TABLE reporting_fields_catalog ADD CONSTRAINT reporting_fields_catalog_type_check
     CHECK (type IN ('text', 'textarea', 'select', ..., 'new_type'));
   ```

2. Add validation logic in `services/backend/src/utils/reportingValidation.ts`:
   ```typescript
   case 'new_type':
     // Add validation logic
     break;
   ```

3. Add UI renderer in kiosk form component

4. Update documentation

### Environment Variables

```bash
# PII Encryption (REQUIRED in production)
PII_ENCRYPTION_KEY=your-secret-key-here

# For production, use KMS:
# AWS_KMS_KEY_ID=arn:aws:kms:region:account:key/xxx
```

## Support & Resources

- **Sample Configs:** `tools/demo/reporting_config_samples/`
- **Migration Script:** `scripts/migrate_existing_reports_to_dynamic_fields.ts`
- **API Tests:** `services/backend/src/__tests__/reportingConfig.test.ts`
- **Validation Tests:** `services/backend/src/__tests__/reportingValidation.test.ts`

## FAQ

**Q: Can I add custom fields not in the catalog?**
A: Yes, use `POST /api/reporting/fields/catalog` to add custom fields. Requires admin auth.

**Q: Can students see PII in their reports?**
A: No. Reports are anonymous. Students cannot retrieve or view submitted data unless PII is explicitly shared with staff via contact fields.

**Q: Is PII encrypted in database backups?**
A: Yes, PII is encrypted at the application level before storage. Database backups contain encrypted values. Ensure encryption keys are backed up securely and separately.

**Q: Can I customize the reporter_type dropdown options?**
A: Yes. Update the `reporter_type` field in the catalog via API or directly in database, changing the `options` JSONB column.

**Q: How do I delete PII for GDPR compliance?**
A: Query incidents with `has_pii = true`, decrypt PII fields, redact specific values, or delete entire incident row. Maintain audit trail of deletions.

**Q: Can I use this for multi-language support?**
A: Category names and help text can be translated in config JSON. For full i18n, store translations in separate structure or use translation service.
