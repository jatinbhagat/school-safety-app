import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/track/:token
 * Get sanitized incident data for anonymous tracking
 * Public endpoint - no authentication required
 */
export async function getTrackingData(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).json({
        error: 'Invalid tracking token',
      });
    }

    // Get incident data
    const incidentQuery = `
      SELECT
        i.id,
        i.category,
        i.description,
        i.status,
        i.created_at,
        i.updated_at,
        i.flagged_as_false,
        i.false_report_reason,
        i.false_report_confirmed,
        i.reporter_notification_token
      FROM incidents i
      WHERE i.reporter_notification_token = $1
    `;

    const incidentResult = await pool.query(incidentQuery, [token]);

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Report not found',
        message: 'This tracking link is invalid or expired',
      });
    }

    const incident = incidentResult.rows[0];

    // Get timeline events (sanitized - no PII)
    const timelineQuery = `
      SELECT
        event_type,
        event_description,
        actor_role,
        created_at
      FROM incident_events
      WHERE incident_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const timelineResult = await pool.query(timelineQuery, [incident.id]);

    // Get dispute info if flagged
    let disputes = [];
    if (incident.flagged_as_false) {
      const disputesQuery = `
        SELECT
          id,
          status,
          created_at,
          resolved_at
        FROM false_report_disputes
        WHERE incident_id = $1
        ORDER BY created_at DESC
      `;

      const disputesResult = await pool.query(disputesQuery, [incident.id]);
      disputes = disputesResult.rows;
    }

    // Sanitize data (remove any PII, internal info)
    const sanitizedIncident = {
      id: incident.id,
      category: incident.category,
      description: incident.description,
      status: incident.status,
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      flagged_as_false: incident.flagged_as_false,
      false_report_reason: incident.false_report_reason,
      false_report_confirmed: incident.false_report_confirmed,
    };

    const sanitizedTimeline = timelineResult.rows.map((event) => ({
      type: event.event_type,
      description: event.event_description,
      role: event.actor_role,
      timestamp: event.created_at,
    }));

    res.status(200).json({
      incident: sanitizedIncident,
      timeline: sanitizedTimeline,
      disputes,
      canDispute: incident.flagged_as_false && !incident.false_report_confirmed,
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({
      error: 'Failed to fetch report data',
    });
  }
}
