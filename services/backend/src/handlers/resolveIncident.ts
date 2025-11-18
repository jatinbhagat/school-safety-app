import { Request, Response } from 'express';
import { pool } from '../db';

interface ResolveIncidentBody {
  resolution_type: 'issue_resolved' | 'referred_to_admin' | 'ongoing_monitoring' | 'no_action_needed';
  resolution_notes: string;
  resolved_by_name: string;
  resolved_by_role?: string;
  resolved_by_email?: string;
}

/**
 * POST /staff/incidents/:id/resolve
 * Marks an incident as resolved with resolution details
 */
export async function resolveIncident(req: Request, res: Response) {
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
      resolution_type,
      resolution_notes,
      resolved_by_name,
      resolved_by_role,
      resolved_by_email,
    }: ResolveIncidentBody = req.body;

    // Validate required fields
    if (!resolution_type) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resolution_type is required',
      });
    }

    if (!resolution_notes || resolution_notes.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resolution_notes is required',
      });
    }

    if (!resolved_by_name || resolved_by_name.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resolved_by_name is required',
      });
    }

    await client.query('BEGIN');

    // Fetch current incident
    const incidentQuery = `
      SELECT id, status, ai_meta, created_at
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
    const resolvedAt = new Date().toISOString();

    // Calculate resolution time in minutes
    const createdAt = new Date(incident.created_at);
    const resolvedAtDate = new Date(resolvedAt);
    const resolutionTimeMinutes = Math.round(
      (resolvedAtDate.getTime() - createdAt.getTime()) / 60000
    );

    // Update incident with resolution info
    const updatedAiMeta = {
      ...(incident.ai_meta || {}),
      resolution_type,
      resolution_notes,
      resolved_by: resolved_by_name,
      resolved_by_role,
      resolved_by_email,
      resolved_at: resolvedAt,
      resolution_time_minutes: resolutionTimeMinutes,
    };

    const updateQuery = `
      UPDATE incidents
      SET
        status = 'resolved',
        ai_meta = $2
      WHERE id = $1
      RETURNING id, category, description, status, created_at, ai_meta
    `;

    const updateResult = await client.query(updateQuery, [
      incidentId,
      JSON.stringify(updatedAiMeta),
    ]);

    // Add resolution note to staff_notes
    const noteQuery = `
      INSERT INTO staff_notes (
        incident_id,
        note_text,
        note_type,
        author_name,
        author_role,
        author_email
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const noteText = `**Resolution:** ${resolution_type.replace(/_/g, ' ')}\n\n${resolution_notes}`;

    await client.query(noteQuery, [
      incidentId,
      noteText,
      'resolution',
      resolved_by_name,
      resolved_by_role,
      resolved_by_email,
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

    const eventDescription = `${resolved_by_name} marked incident as resolved`;
    const eventData = {
      resolution_type,
      resolution_time_minutes: resolutionTimeMinutes,
    };

    await client.query(eventQuery, [
      incidentId,
      'resolved',
      eventDescription,
      JSON.stringify(eventData),
      resolved_by_name,
      resolved_by_role,
      resolved_by_email,
      'staff',
    ]);

    // Update routing_logs with resolution time
    const routingUpdateQuery = `
      UPDATE routing_logs
      SET resolution_time_minutes = $2
      WHERE incident_id = $1
        AND resolution_time_minutes IS NULL
    `;

    await client.query(routingUpdateQuery, [incidentId, resolutionTimeMinutes]);

    await client.query('COMMIT');

    res.status(200).json({
      incident: updateResult.rows[0],
      resolution: {
        type: resolution_type,
        notes: resolution_notes,
        resolved_by: resolved_by_name,
        resolved_at: resolvedAt,
        resolution_time_minutes: resolutionTimeMinutes,
      },
      message: 'Incident resolved successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resolving incident:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve incident',
    });
  } finally {
    client.release();
  }
}
