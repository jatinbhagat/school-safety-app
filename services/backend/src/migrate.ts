#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Runs all SQL migrations in order
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('');
  console.error('Please create services/backend/.env.local with:');
  console.error('DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety');
  console.error('');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5000,
});

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ ERROR: Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    console.log(`📁 Found ${files.length} migration file(s)\n`);

    // Get already executed migrations
    const { rows: executed } = await pool.query(
      'SELECT filename FROM migrations ORDER BY filename'
    );
    const executedSet = new Set(executed.map(r => r.filename));

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Run each migration
    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        skippedCount++;
        continue;
      }

      console.log(`🔄 Running ${file}...`);

      try {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Run migration in a transaction
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');

        console.log(`✅ Success: ${file}\n`);
        successCount++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ ERROR in ${file}:`);
        console.error(error);
        console.error('');
        errorCount++;

        // Continue with other migrations
        continue;
      }
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped:    ${skippedCount}`);
    console.log(`   ❌ Errors:     ${errorCount}`);
    console.log('═'.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please fix errors and run again.');
      process.exit(1);
    } else {
      console.log('\n🎉 All migrations completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    console.error('\nTroubleshooting:');
    console.error('1. Is PostgreSQL running?');
    console.error('   Docker: docker compose up -d postgres');
    console.error('   System: sudo systemctl start postgresql');
    console.error('');
    console.error('2. Is DATABASE_URL correct in .env.local?');
    console.error('   Current: ' + (DATABASE_URL || 'NOT SET'));
    console.error('');
    console.error('3. Can you connect manually?');
    console.error('   psql "' + DATABASE_URL + '"');
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
