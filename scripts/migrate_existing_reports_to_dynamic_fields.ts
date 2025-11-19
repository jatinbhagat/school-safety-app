/**
 * Migration Script: Migrate Existing Reports to Dynamic Fields
 *
 * This script migrates legacy incident reports (with description, class_section, etc.)
 * to the new dynamic_fields JSONB structure.
 *
 * Usage:
 *   npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --dry-run
 *   npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --execute
 *
 * Safety:
 *   - Idempotent (safe to run multiple times)
 *   - Dry-run mode by default
 *   - No data loss (preserves original columns)
 *   - Skips incidents that already have dynamic_fields
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'school_safety',
});

interface LegacyIncident {
  id: number;
  category: string;
  description: string | null;
  class_section: string | null;
  attachments: any | null;
  dynamic_fields: any | null;
  tenant_id: string | null;
  created_at: Date;
}

/**
 * Map legacy fields to dynamic_fields structure
 */
function mapLegacyToDynamicFields(incident: LegacyIncident): Record<string, any> {
  const dynamicFields: Record<string, any> = {};

  // Map description
  if (incident.description && incident.description.trim() !== '') {
    dynamicFields.description = incident.description.trim();
  }

  // Map class_section
  if (incident.class_section && incident.class_section.trim() !== '') {
    dynamicFields.class_section = incident.class_section.trim();
  }

  // Map attachments (keep as-is in dynamic_fields for compatibility)
  if (incident.attachments) {
    dynamicFields.attachments = incident.attachments;
  }

  return dynamicFields;
}

/**
 * Main migration function
 */
async function migrate(dryRun: boolean = true) {
  console.log('========================================');
  console.log('Incident Reports Dynamic Fields Migration');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'EXECUTE (will update database)'}`);
  console.log('');

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful\n');

    // Fetch incidents without dynamic_fields
    const query = `
      SELECT id, category, description, class_section, attachments, dynamic_fields, tenant_id, created_at
      FROM incidents
      WHERE dynamic_fields IS NULL
      ORDER BY id ASC
    `;

    const result = await pool.query<LegacyIncident>(query);
    const incidents = result.rows;

    console.log(`Found ${incidents.length} incidents to migrate\n`);

    if (incidents.length === 0) {
      console.log('✓ No incidents to migrate. All incidents already have dynamic_fields or are empty.');
      return;
    }

    // Display sample
    console.log('Sample incident to migrate:');
    console.log('─────────────────────────────');
    const sample = incidents[0];
    console.log(`ID: ${sample.id}`);
    console.log(`Category: ${sample.category}`);
    console.log(`Description: ${sample.description ? sample.description.substring(0, 100) + '...' : 'null'}`);
    console.log(`Class Section: ${sample.class_section || 'null'}`);
    console.log(`Attachments: ${sample.attachments ? 'Yes' : 'No'}`);
    console.log(`Tenant ID: ${sample.tenant_id || 'null'}`);

    const sampleDynamicFields = mapLegacyToDynamicFields(sample);
    console.log('\nWill be mapped to dynamic_fields:');
    console.log(JSON.stringify(sampleDynamicFields, null, 2));
    console.log('');

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be made');
      console.log(`\nTo execute migration, run:`);
      console.log(`  npx ts-node scripts/migrate_existing_reports_to_dynamic_fields.ts --execute\n`);
      return;
    }

    // Execute migration
    console.log('Starting migration...\n');

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const incident of incidents) {
      try {
        const dynamicFields = mapLegacyToDynamicFields(incident);

        // Skip if no fields to migrate
        if (Object.keys(dynamicFields).length === 0) {
          skipped++;
          continue;
        }

        // Update incident with dynamic_fields
        await pool.query(
          `UPDATE incidents
           SET dynamic_fields = $1,
               tenant_id = COALESCE(tenant_id, $2),
               has_pii = false
           WHERE id = $3 AND dynamic_fields IS NULL`,
          [
            JSON.stringify(dynamicFields),
            '00000000-0000-0000-0000-000000000001', // Default demo tenant
            incident.id,
          ]
        );

        migrated++;

        if (migrated % 100 === 0) {
          console.log(`Progress: ${migrated} / ${incidents.length} incidents migrated`);
        }
      } catch (error) {
        console.error(`Error migrating incident ${incident.id}:`, error);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('Migration Summary');
    console.log('========================================');
    console.log(`Total incidents: ${incidents.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (empty): ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('========================================\n');

    if (errors === 0) {
      console.log('✓ Migration completed successfully!');
    } else {
      console.error(`⚠️  Migration completed with ${errors} errors. Review logs above.`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

// Run migration
migrate(dryRun)
  .then(() => {
    console.log('\nMigration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
