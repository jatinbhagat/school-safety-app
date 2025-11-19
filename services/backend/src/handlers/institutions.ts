import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/institutions/:id
 * Get institution details
 */
export async function getInstitution(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT i.*, f.*
       FROM institutions i
       LEFT JOIN institution_features f ON f.institution_id = i.id
       WHERE i.id = $1`,
      [institutionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({ error: 'Failed to get institution' });
  }
}

/**
 * GET /api/institutions/by-slug/:slug
 * Get institution by URL slug (public endpoint for frontend routing)
 */
export async function getInstitutionBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT i.id, i.institution_name, i.institution_type, i.url_slug,
              i.logo_url, i.brand_color, i.is_active,
              f.alerts_enabled, f.reports_enabled,
              f.notifications_enabled, f.analytics_enabled
       FROM institutions i
       LEFT JOIN institution_features f ON f.institution_id = i.id
       WHERE i.url_slug = $1 AND i.is_active = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get institution by slug error:', error);
    res.status(500).json({ error: 'Failed to get institution' });
  }
}

/**
 * PATCH /api/institutions/:id
 * Update institution settings
 */
export async function updateInstitution(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { institutionName, brandColor } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (institutionName) {
      updates.push(`institution_name = $${paramCount++}`);
      values.push(institutionName);
    }

    if (brandColor) {
      updates.push(`brand_color = $${paramCount++}`);
      values.push(brandColor);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(institutionId);

    const query = `UPDATE institutions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'update_settings', 'institution', $3, $4)`,
      [institutionId, req.admin.adminId, institutionId, JSON.stringify(req.body)]
    );

    res.json({
      success: true,
      institution: result.rows[0],
    });
  } catch (error) {
    console.error('Update institution error:', error);
    res.status(500).json({ error: 'Failed to update institution' });
  }
}

/**
 * PATCH /api/institutions/:id/features
 * Update feature toggles
 */
export async function updateFeatures(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { alerts, reports, notifications, analytics } = req.body;

    await pool.query(
      `UPDATE institution_features
       SET alerts_enabled = COALESCE($1, alerts_enabled),
           reports_enabled = COALESCE($2, reports_enabled),
           notifications_enabled = COALESCE($3, notifications_enabled),
           analytics_enabled = COALESCE($4, analytics_enabled),
           updated_at = NOW()
       WHERE institution_id = $5`,
      [alerts, reports, notifications, analytics, institutionId]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, new_values)
       VALUES ($1, $2, 'update_features', 'institution_features', $3)`,
      [institutionId, req.admin.adminId, JSON.stringify(req.body)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update features error:', error);
    res.status(500).json({ error: 'Failed to update features' });
  }
}

/**
 * GET /api/institutions/:id/admins
 * Get all admins for institution
 */
export async function getAdmins(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, role, email_verified, last_login_at, created_at
       FROM institution_admins
       WHERE institution_id = $1 AND is_active = true
       ORDER BY created_at ASC`,
      [institutionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to get admins' });
  }
}
