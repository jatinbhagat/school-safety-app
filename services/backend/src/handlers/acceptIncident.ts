import { Request, Response } from 'express';
import { pool } from '../db';

interface AcceptIncidentBody {
  accepted_by_name: string;
  accepted_by_role?: string;
  accepted_by_email?: string;
}

/**
 * POST /staff/incidents/:id/accept
 * Staff member accepts an incident assignment
 */
export async function acceptIncident(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const incidentId = parseInt(id, 10);

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid incident ID',
      });
    }

    const {
      accepted_by_name,
      accepted_by_role,
      accepted_by_email,
    }: AcceptIncidentBody = req.body;

    // Validate required fields
    if (!accepted_by_name || accepted_by_name.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'accepted_by_name is required',
      });
    }

    await client.query('BEGIN');

    // Fetch current incident
    const incidentQuery = `
      SELECT id, status, ai_meta
      FROM incidents
      WHERE id = $1
    `;

    const incidentResult = await client.query(incidentQuery, [incidentId]);

    if (incidentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    const incident = incidentResult.rows[0];
    const acceptedAt = new Date().toISOString();

    // Update incident with acceptance info
    const updatedAiMeta = {
      ...(incident.ai_meta || {}),
      accepted_by: accepted_by_name,
      accepted_by_role,
      accepted_by_email,
      accepted_at: acceptedAt,
    };

    const updateQuery = `
      UPDATE incidents
      SET
        ai_meta = $2
      WHERE id = $1
      RETURNING id, category, description, status, created_at, ai_meta
    `;

    const updateResult = await client.query(updateQuery, [
      incidentId,
      JSON.stringify(updatedAiMeta),
    ]);

    // Create timeline event
    const eventQuery = `
      INSERT INTO incident_events (
        incident_id,
        event_type,
        event_description,
        event_data,
        actor_name,
        actor_role,
        actor_email,
        actor_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const eventDescription = `${accepted_by_name} accepted the incident assignment`;
    const eventData = {
      accepted_at: acceptedAt,
    };

    await client.query(eventQuery, [
      incidentId,
      'accepted',
      eventDescription,
      JSON.stringify(eventData),
      accepted_by_name,
      accepted_by_role,
      accepted_by_email,
      'staff',
    ]);

    await client.query('COMMIT');

    res.status(200).json({
      incident: updateResult.rows[0],
      message: 'Incident assignment accepted',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting incident:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to accept incident',
    });
  } finally {
    client.release();
  }
}
