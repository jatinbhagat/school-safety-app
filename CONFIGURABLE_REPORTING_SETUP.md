# Setup: Configurable Incident Reporting

## Prerequisites

Before using the configurable incident reporting system, you must run the database migration to create the required tables.

## Database Migration

### Step 1: Run Migration 018

The configurable reporting system requires three new database tables:
- `reporting_fields_catalog` - Field template definitions
- `tenant_reporting_config` - Per-tenant configuration
- `report_audit_logs` - PII-safe audit trail

**Run the migration:**

```bash
# Using psql (PostgreSQL command line)
psql -h localhost -U postgres -d school_safety -f services/backend/migrations/018_reporting_config.sql

# Or using your preferred PostgreSQL client
# Import and execute: services/backend/migrations/018_reporting_config.sql
```

### Step 2: Verify Migration

Check that the tables were created successfully:

```sql
-- Connect to your database
psql -h localhost -U postgres -d school_safety

-- Verify tables exist
\dt reporting_fields_catalog
\dt tenant_reporting_config
\dt report_audit_logs

-- Check field catalog has default fields (should return 12)
SELECT COUNT(*) FROM reporting_fields_catalog;

-- Check demo tenant config exists (should return 1)
SELECT COUNT(*) FROM tenant_reporting_config;

-- View demo tenant config
SELECT config FROM tenant_reporting_config WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
```

### Step 3: Set PII Encryption Key

Add the PII encryption key to your environment:

```bash
# For local development
echo "PII_ENCRYPTION_KEY=dev-test-key-for-local-development-only" >> services/backend/.env.local

# For production, use a secure key from KMS/Secrets Manager
```

## Error: "Database migration required"

If you see this error when submitting a report:

```json
{
  "error": "Validation failed",
  "message": "Dynamic fields validation failed",
  "errors": [{
    "field": "_system",
    "message": "Internal validation error: Database migration required: Run migration 018_reporting_config.sql to create reporting configuration tables",
    "code": "SYSTEM_ERROR"
  }]
}
```

**Solution:** You need to run the migration (Step 1 above).

## Quick Test

After running the migration, test the system:

```bash
# Test 1: Get demo tenant config
curl http://localhost:3001/api/tenant/demo/reporting-config

# Test 2: Get fields catalog
curl http://localhost:3001/api/reporting/fields/catalog

# Test 3: Submit a report with dynamic fields
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "demo",
    "category": "bullying",
    "dynamic_fields": {
      "reporter_type": "Student",
      "description": "Test report with dynamic fields"
    }
  }'

# Expected response (201 Created):
# {
#   "id": 1,
#   "created_at": "2024-...",
#   "request_id": "...",
#   "has_pii": false,
#   "fields_processed": 2
# }
```

## Troubleshooting

### Cannot connect to database

Check your database connection settings in `.env.local`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=school_safety
```

### Permission denied when running migration

Ensure your PostgreSQL user has CREATE TABLE permissions:

```sql
-- Grant permissions to your user
GRANT CREATE ON DATABASE school_safety TO postgres;
```

### Migration already run

The migration is idempotent (uses `CREATE TABLE IF NOT EXISTS`), so it's safe to run multiple times.

## Next Steps

Once the migration is complete:

1. Review the testing guide: `CONFIGURABLE_REPORTING_TESTING.md`
2. Explore the admin UI: `http://localhost:3000/admin/reporting-config`
3. Test the dynamic kiosk form
4. Import sample configs for your tenant type (school/college/corporate)

## Docker Setup

If using Docker for local development:

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migration inside container
docker exec -i postgres_container psql -U postgres -d school_safety < services/backend/migrations/018_reporting_config.sql
```

## Production Deployment

For production:

1. Run migration during deployment pipeline
2. Use KMS-managed encryption key (not hardcoded)
3. Set up proper database user permissions (principle of least privilege)
4. Enable RLS (Row Level Security) policies for tenant isolation
5. Configure backup and disaster recovery

See `AZURE_DEPLOYMENT_GUIDE.md` for Azure-specific deployment instructions.
