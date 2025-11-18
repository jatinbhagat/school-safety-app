import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /staff/incidents/:id
 * Returns detailed incident information including notes and timeline
 */
export async function getIncidentDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const incidentId = parseInt(id, 10);

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid incident ID',
      });
    }

    // Fetch incident details
    const incidentQuery = `
      SELECT
        id,
        category as type,
        description,
        class_section as location,
        status,
        created_at,
        ai_meta,
        attachments,
        COALESCE((ai_meta->>'severity')::text, 'medium') as priority,
        (ai_meta->>'assigned_to')::text as assigned_to,
        (ai_meta->>'assigned_at')::text as assigned_at,
        (ai_meta->>'assigned_by')::text as assigned_by,
        (ai_meta->>'confidence')::text as ai_confidence,
        (ai_meta->>'recommended_role')::text as recommended_role,
        (ai_meta->>'reasoning')::text as ai_reasoning,
        'Anonymous' as reporter_name
      FROM incidents
      WHERE id = $1
    `;

    const incidentResult = await pool.query(incidentQuery, [incidentId]);

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    const incident = incidentResult.rows[0];

    // Fetch staff notes
    const notesQuery = `
      SELECT
        id,
        note_text,
        note_type,
        author_name,
        author_role,
        author_email,
        is_internal,
        created_at,
        updated_at
      FROM staff_notes
      WHERE incident_id = $1
      ORDER BY created_at ASC
    `;

    const notesResult = await pool.query(notesQuery, [incidentId]);

    // Fetch timeline events
    const eventsQuery = `
      SELECT
        id,
        event_type,
        event_description,
        event_data,
        actor_name,
        actor_role,
        actor_email,
        actor_type,
        created_at
      FROM incident_events
      WHERE incident_id = $1
      ORDER BY created_at ASC
    `;

    const eventsResult = await pool.query(eventsQuery, [incidentId]);

    // Fetch routing recommendation if available
    const routingQuery = `
      SELECT
        recommended_role,
        confidence,
        priority,
        reasoning,
        routing_method,
        matched_rule_id
      FROM routing_logs
      WHERE incident_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const routingResult = await pool.query(routingQuery, [incidentId]);

    res.status(200).json({
      incident,
      notes: notesResult.rows,
      timeline: eventsResult.rows,
      aiRecommendation: routingResult.rows.length > 0 ? routingResult.rows[0] : null,
    });
  } catch (error) {
    console.error('Error fetching incident detail:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch incident details',
    });
  }
}
