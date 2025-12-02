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
      `SELECT i.id, i.institution_name, i.institution_type, i.location,
              i.contact_name, i.email, i.phone, i.url_slug, i.logo_url,
              i.brand_color, i.access_type, i.onboarding_completed, i.is_active,
              i.tenant_id, i.created_at, i.updated_at,
              f.alerts_enabled, f.reports_enabled,
              f.notifications_enabled, f.analytics_enabled
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
              i.logo_url, i.brand_color, i.is_active, i.tenant_id,
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

/**
 * POST /api/institutions/:id/admins
 * Add a new admin to the institution
 */
export async function addAdmin(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can add other admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can add new administrators' });
    }

    const { name, email, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'role'],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles,
      });
    }

    // Check if email already exists for this institution
    const existingAdmin = await pool.query(
      `SELECT id FROM institution_admins
       WHERE institution_id = $1 AND email = $2 AND is_active = true`,
      [institutionId, email]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ error: 'An admin with this email already exists' });
    }

    // Insert new admin (without password - they'll need to set it via email verification)
    const result = await pool.query(
      `INSERT INTO institution_admins (
        institution_id, name, email, phone, role, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, phone, role, email_verified, created_at`,
      [institutionId, name, email, phone || null, role, false]
    );

    const newAdmin = result.rows[0];

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'add_admin', 'institution_admin', $3, $4)`,
      [institutionId, req.admin.adminId, newAdmin.id, JSON.stringify({ name, email, role })]
    );

    // TODO: Send verification email to the new admin

    res.json({
      success: true,
      admin: newAdmin,
      message: 'Admin added successfully. A verification email has been sent.',
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ error: 'Failed to add admin' });
  }
}

/**
 * Helper function to generate URL slug from institution name
 */
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit to 50 characters
}

/**
 * POST /api/institutions/:id/generate-slug
 * Auto-generate missing URL slug for institution
 */
export async function generateSlug(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current institution details
    const institutionResult = await pool.query(
      'SELECT id, institution_name, url_slug FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (institutionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institution = institutionResult.rows[0];

    // Check if slug already exists
    if (institution.url_slug && institution.url_slug.trim()) {
      return res.status(409).json({ 
        error: 'URL slug already exists',
        currentSlug: institution.url_slug
      });
    }

    // Generate base slug from institution name
    let baseSlug = generateSlugFromName(institution.institution_name);
    if (!baseSlug) {
      baseSlug = 'institution'; // Fallback if name generates empty slug
    }

    // Check for conflicts and find available slug
    let finalSlug = baseSlug;
    let counter = 1;
    
    while (true) {
      const conflictResult = await pool.query(
        'SELECT id FROM institutions WHERE url_slug = $1 AND id != $2',
        [finalSlug, institutionId]
      );

      if (conflictResult.rows.length === 0) {
        // No conflict, we can use this slug
        break;
      }

      // Try with counter suffix
      finalSlug = `${baseSlug}-${counter}`;
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 1000) {
        throw new Error('Could not find available slug after 1000 attempts');
      }
    }

    // Update institution with generated slug
    await pool.query(
      'UPDATE institutions SET url_slug = $1, updated_at = NOW() WHERE id = $2',
      [finalSlug, institutionId]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'generate_slug', 'institution', $3, $4)`,
      [institutionId, req.admin.adminId, institutionId, JSON.stringify({ url_slug: finalSlug })]
    );

    console.log(`Generated URL slug for institution ${institutionId}: ${finalSlug}`);

    res.json({
      success: true,
      slug: finalSlug,
      message: 'URL slug generated successfully'
    });

  } catch (error) {
    console.error('Generate slug error:', error);
    res.status(500).json({ error: 'Failed to generate URL slug' });
  }
}
