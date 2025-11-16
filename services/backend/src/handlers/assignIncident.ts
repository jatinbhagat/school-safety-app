import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * POST /incidents/:id/assign
 * Assigns an incident to a staff member
 */
export async function assignIncident(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const incidentId = parseInt(id, 10);

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid incident ID',
      });
    }

    // Get current incident
    const incident = await pool.query(
      'SELECT * FROM incidents WHERE id = $1',
      [incidentId]
    );

    if (incident.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    // Update incident with assignment info
    const aiMeta = incident.rows[0].ai_meta || {};
    aiMeta.assigned_to = 'Staff Member'; // In production, use req.user or authentication
    aiMeta.assigned_at = new Date().toISOString();

    const result = await pool.query(
      `UPDATE incidents
       SET status = 'in_progress',
           ai_meta = $1
       WHERE id = $2
       RETURNING id, category as type, description, status, created_at, ai_meta`,
      [JSON.stringify(aiMeta), incidentId]
    );

    res.status(200).json({
      ...result.rows[0],
      assigned_to: aiMeta.assigned_to,
      assigned_at: aiMeta.assigned_at,
    });
  } catch (error) {
    console.error('Error assigning incident:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to assign incident',
    });
  }
}
