import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /incidents
 * Returns all incidents from the database
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
