import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /incidents
 * Returns all incidents from the database (legacy endpoint with global access)
 */
export async function getIncidents(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        category as type,
        description,
        class_section as location,
        status,
        created_at,
        ai_meta,
        school_id,
        COALESCE((ai_meta->>'severity')::text, 'medium') as priority,
        (ai_meta->>'assigned_to')::text as assigned_to,
        (ai_meta->>'assigned_at')::text as assigned_at,
        'Anonymous' as reporter_name
      FROM incidents
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch incidents',
    });
  }
}

/**
 * GET /api/admin/incidents
 * Returns incidents for the authenticated admin's institution only
 * Uses JWT authentication for proper tenant isolation
 */
export async function getAdminIncidents(req: Request, res: Response) {
  try {
    // Verify admin authentication
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = req.admin.institutionId;

    if (!institutionId) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin not associated with any institution' 
      });
    }

    // Query incidents only for the admin's institution
    const result = await pool.query(`
      SELECT
        i.id,
        i.category as type,
        i.description,
        i.class_section as location,
        i.status,
        i.created_at,
        i.created_at as updated_at,
        i.ai_meta,
        i.school_id,
        COALESCE((i.ai_meta->>'severity')::text, 'medium') as priority,
        (i.ai_meta->>'assigned_to')::text as assigned_to,
        (i.ai_meta->>'assigned_at')::text as assigned_at,
        'Anonymous' as reporter_name,
        inst.institution_name,
        inst.url_slug
      FROM incidents i
      INNER JOIN institutions inst ON i.school_id = inst.id
      WHERE i.school_id = $1
      ORDER BY i.created_at DESC
    `, [institutionId]);

    // Log the access for audit purposes
    console.log(`[Audit] Admin ${req.admin.adminId} (${req.admin.email}) accessed ${result.rows.length} incidents for institution ${institutionId}`);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching admin incidents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch incidents',
    });
  }
}
