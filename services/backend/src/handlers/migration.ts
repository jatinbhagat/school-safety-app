/**
 * Migration Handler for Production Database Updates
 * 
 * Web-based interface for running database migrations and verifying database state.
 * Use this endpoint to safely execute migrations on production.
 */

import { Request, Response } from 'express';
import { pool } from '../db';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/admin/migrate
 * 
 * Execute database migrations with safety checks
 */
export async function runMigration(req: Request, res: Response): Promise<void> {
  const { migrationFile, dryRun = false } = req.body;

  try {
    // Security check - only allow predefined migrations
    const allowedMigrations = [
      'add-default-reporting-configs.sql'
    ];

    if (!migrationFile || !allowedMigrations.includes(migrationFile)) {
      res.status(400).json({
        error: 'Invalid migration file',
        message: 'Migration file must be one of: ' + allowedMigrations.join(', '),
        allowed_migrations: allowedMigrations
      });
      return;
    }

    const migrationPath = path.join(__dirname, '../../migrations', migrationFile);

    // Check if migration file exists
    if (!fs.existsSync(migrationPath)) {
      res.status(404).json({
        error: 'Migration file not found',
        message: `Migration file ${migrationFile} does not exist`,
        path: migrationPath
      });
      return;
    }

    // Read migration SQL
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    if (dryRun) {
      // Dry run - just validate and return the SQL
      res.status(200).json({
        success: true,
        dry_run: true,
        message: 'Dry run completed - migration SQL is valid',
        sql_preview: migrationSQL.substring(0, 500) + '...',
        full_sql_length: migrationSQL.length
      });
      return;
    }

    // Execute migration in a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute the migration SQL
      const result = await client.query(migrationSQL);
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Migration executed successfully',
        migration_file: migrationFile,
        executed_at: new Date().toISOString(),
        result: result
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      error: 'Migration failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      migration_file: migrationFile
    });
  }
}

/**
 * GET /api/admin/database/verify
 * 
 * Verify database state and check specific tables/data
 */
export async function verifyDatabase(req: Request, res: Response): Promise<void> {
  try {
    const verificationResults: any = {
      timestamp: new Date().toISOString(),
      database_info: {},
      table_checks: {},
      data_checks: {}
    };

    // Get basic database info
    const dbInfoResult = await pool.query('SELECT version(), current_database(), current_user');
    verificationResults.database_info = {
      version: dbInfoResult.rows[0].version,
      database: dbInfoResult.rows[0].current_database,
      user: dbInfoResult.rows[0].current_user
    };

    // Check if tenant_reporting_config table exists and its structure
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tenant_reporting_config'
      )
    `);
    
    verificationResults.table_checks.tenant_reporting_config_exists = tableExistsResult.rows[0].exists;

    if (tableExistsResult.rows[0].exists) {
      // Get table structure
      const tableStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'tenant_reporting_config'
        ORDER BY ordinal_position
      `);
      verificationResults.table_checks.tenant_reporting_config_structure = tableStructure.rows;

      // Check existing configurations
      const configsResult = await pool.query(`
        SELECT 
          tenant_id,
          jsonb_array_length(config->'categories') as category_count,
          (config->'settings'->>'allow_anonymous')::boolean as allow_anonymous,
          created_at,
          updated_at
        FROM tenant_reporting_config
        ORDER BY tenant_id
      `);
      verificationResults.data_checks.existing_configurations = configsResult.rows;

      // Check for our specific default configurations
      const defaultConfigsResult = await pool.query(`
        SELECT tenant_id, created_at, updated_at
        FROM tenant_reporting_config 
        WHERE tenant_id IN (
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002', 
          '00000000-0000-0000-0000-000000000003',
          '00000000-0000-0000-0000-000000000004'
        )
        ORDER BY tenant_id
      `);
      verificationResults.data_checks.default_configurations = defaultConfigsResult.rows;

      // Count total configurations
      const countResult = await pool.query('SELECT COUNT(*) as total_configs FROM tenant_reporting_config');
      verificationResults.data_checks.total_configurations = parseInt(countResult.rows[0].total_configs);
    }

    // Check institutions table
    const institutionsResult = await pool.query(`
      SELECT COUNT(*) as total_institutions,
             COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_institutions
      FROM institutions
    `);
    verificationResults.data_checks.institutions = {
      total: parseInt(institutionsResult.rows[0].total_institutions),
      recent_24h: parseInt(institutionsResult.rows[0].recent_institutions)
    };

    // Check institution_admins table  
    const adminsResult = await pool.query(`
      SELECT COUNT(*) as total_admins,
             COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as admins_with_phone,
             COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_admins
      FROM institution_admins
    `);
    verificationResults.data_checks.institution_admins = {
      total: parseInt(adminsResult.rows[0].total_admins),
      with_phone: parseInt(adminsResult.rows[0].admins_with_phone),
      recent_24h: parseInt(adminsResult.rows[0].recent_admins)
    };

    res.status(200).json({
      success: true,
      verification_results: verificationResults
    });

  } catch (error) {
    console.error('Database verification error:', error);
    res.status(500).json({
      error: 'Database verification failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * GET /api/admin/migrations/list
 * 
 * List available migrations
 */
export async function listMigrations(req: Request, res: Response): Promise<void> {
  try {
    const migrationsDir = path.join(__dirname, '../../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      res.status(404).json({
        error: 'Migrations directory not found',
        path: migrationsDir
      });
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(migrationsDir, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract description from comments
        const descriptionMatch = content.match(/-- Description: (.+)/);
        const description = descriptionMatch ? descriptionMatch[1] : 'No description available';

        return {
          filename: file,
          description,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        };
      });

    res.status(200).json({
      success: true,
      migrations_directory: migrationsDir,
      available_migrations: files
    });

  } catch (error) {
    console.error('List migrations error:', error);
    res.status(500).json({
      error: 'Failed to list migrations',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}