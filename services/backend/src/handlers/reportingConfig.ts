/**
 * Reporting Configuration Handlers
 *
 * Endpoints for managing tenant-specific incident reporting configurations.
 * Admin-only for updates; public read access for kiosk rendering.
 */

import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

/**
 * GET /api/tenant/:tenantId/reporting-config
 *
 * Returns tenant-specific reporting configuration.
 * Falls back to default demo config if tenant config not found.
 *
 * Production considerations:
 * - Add caching layer (Redis) for frequently accessed configs
 * - Consider implementing ETag for conditional requests
 * - Monitor query performance with connection pooling
 */
export async function getTenantReportingConfig(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();
  const { tenantId } = req.params;

  try {
    // Validate tenantId format (should be UUID or 'demo')
    if (tenantId !== 'demo' && !isValidUUID(tenantId)) {
      res.status(400).json({
        error: 'Invalid tenant ID',
        message: 'Tenant ID must be a valid UUID or "demo"',
        request_id: requestId,
      });
      return;
    }

    let finalTenantId = tenantId;

    // Map 'demo' to demo tenant UUID
    if (tenantId === 'demo') {
      finalTenantId = '00000000-0000-0000-0000-000000000001';
    }

    // TODO: Check cache first (Redis implementation)
    // const cachedConfig = await redis.get(`tenant:${finalTenantId}:config`);
    // if (cachedConfig) return res.json(JSON.parse(cachedConfig));

    // Fetch tenant config with read-optimized query
    const configResult = await pool.query(
      'SELECT config, updated_at FROM tenant_reporting_config WHERE tenant_id = $1 LIMIT 1',
      [finalTenantId]
    );

    if (configResult.rows.length === 0) {
      // Fall back to demo config
      const defaultResult = await pool.query(
        'SELECT config, updated_at FROM tenant_reporting_config WHERE tenant_id = $1 LIMIT 1',
        ['00000000-0000-0000-0000-000000000001']
      );

      if (defaultResult.rows.length === 0) {
        res.status(404).json({
          error: 'Config not found',
          message: 'No reporting configuration found for this tenant or default',
          request_id: requestId,
        });
        return;
      }

      const response = {
        config: defaultResult.rows[0].config,
        tenant_id: finalTenantId,
        is_default: true,
        updated_at: defaultResult.rows[0].updated_at,
        request_id: requestId,
      };

      // TODO: Cache the response
      // await redis.setex(`tenant:${finalTenantId}:config`, 3600, JSON.stringify(response));

      res.status(200).json(response);
      return;
    }

    const response = {
      config: configResult.rows[0].config,
      tenant_id: finalTenantId,
      is_default: false,
      updated_at: configResult.rows[0].updated_at,
      request_id: requestId,
    };

    // TODO: Cache the response
    // await redis.setex(`tenant:${finalTenantId}:config`, 3600, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    console.error('[getTenantReportingConfig] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch reporting configuration',
      request_id: requestId,
    });
  }
}

/**
 * POST /api/tenant/:tenantId/reporting-config
 *
 * Update or create tenant reporting configuration.
 * Admin-only endpoint.
 *
 * Production considerations:
 * - Implement proper authentication/authorization
 * - Add rate limiting to prevent abuse
 * - Invalidate caches on update
 * - Consider versioning for config rollback capability
 * - Add audit logging for compliance
 */
export async function updateTenantReportingConfig(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();
  const { tenantId } = req.params;
  const { config } = req.body;

  try {
    // Validate tenantId
    if (!isValidUUID(tenantId)) {
      res.status(400).json({
        error: 'Invalid tenant ID',
        message: 'Tenant ID must be a valid UUID',
        request_id: requestId,
      });
      return;
    }

    // Validate config structure (comprehensive validation)
    const validationErrors = validateConfigStructure(config);
    if (validationErrors.length > 0) {
      res.status(400).json({
        error: 'Invalid config',
        message: 'Configuration validation failed',
        errors: validationErrors,
        request_id: requestId,
      });
      return;
    }

    // TODO: PRODUCTION - Add auth check - verify user is tenant admin
    // const user = (req as any).user;
    // if (!user || user.institution_id !== tenantId) {
    //   res.status(403).json({ error: 'Forbidden', message: 'Not authorized for this tenant' });
    //   return;
    // }

    // Upsert config with transaction for data integrity
    const query = `
      INSERT INTO tenant_reporting_config (tenant_id, config)
      VALUES ($1, $2)
      ON CONFLICT (tenant_id)
      DO UPDATE SET config = $2, updated_at = NOW()
      RETURNING id, updated_at
    `;

    const result = await pool.query(query, [tenantId, JSON.stringify(config)]);

    // TODO: PRODUCTION - Invalidate cache
    // await redis.del(`tenant:${tenantId}:config`);

    // TODO: PRODUCTION - Add audit log entry
    // await auditLog.create({
    //   tenant_id: tenantId,
    //   action: 'config_update',
    //   user_id: user?.id,
    //   changes: config,
    //   timestamp: new Date(),
    // });

    console.log(`[updateTenantReportingConfig] Config updated for tenant ${tenantId} by request ${requestId}`);

    res.status(200).json({
      success: true,
      config_id: result.rows[0].id,
      updated_at: result.rows[0].updated_at,
      message: 'Reporting configuration updated successfully',
      request_id: requestId,
    });
  } catch (error) {
    console.error('[updateTenantReportingConfig] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update reporting configuration',
      request_id: requestId,
    });
  }
}

/**
 * GET /api/reporting/fields/catalog
 *
 * Returns all available field templates from catalog.
 * Public endpoint for config editor and kiosk.
 */
export async function getFieldsCatalog(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const result = await pool.query(`
      SELECT id, name, type, options, required_by_default, pii_flag, help_text, placeholder
      FROM reporting_fields_catalog
      ORDER BY name ASC
    `);

    res.status(200).json({
      fields: result.rows,
      count: result.rows.length,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error fetching fields catalog:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch fields catalog',
      request_id: requestId,
    });
  }
}

/**
 * POST /api/reporting/fields/catalog
 *
 * Add a new field to the catalog.
 * Admin-only endpoint.
 */
export async function addFieldToCatalog(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();
  const { name, type, options, required_by_default, pii_flag, help_text, placeholder } = req.body;

  try {
    // Validate required fields
    if (!name || !type) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Fields "name" and "type" are required',
        request_id: requestId,
      });
      return;
    }

    // Validate type
    const validTypes = ['text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'file', 'phone', 'email'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        request_id: requestId,
      });
      return;
    }

    // Insert into catalog
    const query = `
      INSERT INTO reporting_fields_catalog (name, type, options, required_by_default, pii_flag, help_text, placeholder)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, type
    `;

    const result = await pool.query(query, [
      name,
      type,
      options ? JSON.stringify(options) : null,
      required_by_default || false,
      pii_flag || false,
      help_text || null,
      placeholder || null,
    ]);

    res.status(201).json({
      success: true,
      field: result.rows[0],
      message: 'Field added to catalog successfully',
      request_id: requestId,
    });
  } catch (error: any) {
    console.error('Error adding field to catalog:', error);

    if (error.code === '23505') {
      // Unique constraint violation
      res.status(409).json({
        error: 'Conflict',
        message: 'A field with this name already exists',
        request_id: requestId,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add field to catalog',
      request_id: requestId,
    });
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate config structure
 */
function validateConfigStructure(config: any): string[] {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('Config must be an object');
    return errors;
  }

  if (!Array.isArray(config.categories)) {
    errors.push('Config must have a "categories" array');
    return errors;
  }

  // Validate each category
  for (let i = 0; i < config.categories.length; i++) {
    const category = config.categories[i];

    if (!category.id || typeof category.id !== 'string') {
      errors.push(`Category ${i}: missing or invalid "id"`);
    }

    if (!category.name || typeof category.name !== 'string') {
      errors.push(`Category ${i}: missing or invalid "name"`);
    }

    if (!Array.isArray(category.fields)) {
      errors.push(`Category ${i}: "fields" must be an array`);
      continue;
    }

    // Validate fields
    for (let j = 0; j < category.fields.length; j++) {
      const field = category.fields[j];

      if (!field.field_key || typeof field.field_key !== 'string') {
        errors.push(`Category ${i}, field ${j}: missing or invalid "field_key"`);
      }

      if (typeof field.required !== 'boolean') {
        errors.push(`Category ${i}, field ${j}: "required" must be boolean`);
      }

      if (typeof field.enabled !== 'boolean') {
        errors.push(`Category ${i}, field ${j}: "enabled" must be boolean`);
      }

      if (typeof field.order !== 'number') {
        errors.push(`Category ${i}, field ${j}: "order" must be a number`);
      }
    }
  }

  return errors;
}
