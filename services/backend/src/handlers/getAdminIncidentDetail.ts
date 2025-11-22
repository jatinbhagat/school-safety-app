import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/jwtAuth';

/**
 * GET /api/admin/incidents/:id
 * Returns comprehensive incident details with tenant isolation
 * Requires JWT authentication
 */
export async function getAdminIncidentDetail(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const incidentId = parseInt(id, 10);
    const institutionId = req.institutionId;

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Invalid incident ID',
      });
    }

    // Fetch incident with tenant isolation
    const incidentQuery = `
      SELECT
        i.id,
        i.category,
        i.description,
        i.class_section,
        i.status,
        i.created_at,
        i.updated_at,
        i.ai_meta,
        i.attachments,
        i.dynamic_fields,
        i.has_pii,
        i.tenant_id,
        i.school_id,
        i.flagged_as_false,
        i.false_report_reason,
        i.false_report_notes,
        i.false_report_marked_at,
        i.false_report_confirmed,
        i.reporter_fingerprint,
        i.reporter_notification_preference,
        fm.name as flagged_by_name,
        fc.name as confirmed_by_name
      FROM incidents i
      LEFT JOIN institution_admins fm ON i.false_report_marked_by = fm.id
      LEFT JOIN institution_admins fc ON i.false_report_confirmed_by = fc.id
      WHERE i.id = $1 AND (i.school_id = $2 OR i.tenant_id = $2)
    `;

    const incidentResult = await pool.query(incidentQuery, [incidentId, institutionId]);

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Incident not found',
      });
    }

    const incident = incidentResult.rows[0];

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
      ORDER BY created_at DESC
    `;

    const eventsResult = await pool.query(eventsQuery, [incidentId]);

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
      ORDER BY created_at DESC
    `;

    const notesResult = await pool.query(notesQuery, [incidentId]);

    // Fetch routing recommendation
    const routingQuery = `
      SELECT
        recommended_role,
        confidence,
        priority,
        reasoning,
        routing_method,
        matched_rule_id,
        created_at
      FROM routing_logs
      WHERE incident_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const routingResult = await pool.query(routingQuery, [incidentId]);

    // Fetch false report disputes if any
    let disputes = [];
    if (incident.flagged_as_false) {
      const disputesQuery = `
        SELECT
          id,
          dispute_reason,
          submitted_by,
          evidence_attachments,
          status,
          review_notes,
          created_at,
          resolved_at,
          ra.name as reviewed_by_name
        FROM false_report_disputes frd
        LEFT JOIN institution_admins ra ON frd.reviewed_by = ra.id
        WHERE incident_id = $1
        ORDER BY created_at DESC
      `;

      const disputesResult = await pool.query(disputesQuery, [incidentId]);
      disputes = disputesResult.rows;
    }

    // Get reporter reputation if fingerprint exists
    let reporterReputation = null;
    if (incident.reporter_fingerprint) {
      const repQuery = `
        SELECT
          total_reports,
          false_reports,
          verified_reports,
          reputation_score,
          is_blocked,
          first_report_at,
          last_report_at
        FROM reporter_reputation
        WHERE reporter_fingerprint = $1 AND institution_id = $2
      `;

      const repResult = await pool.query(repQuery, [
        incident.reporter_fingerprint,
        institutionId,
      ]);

      if (repResult.rows.length > 0) {
        reporterReputation = repResult.rows[0];
      }
    }

    res.status(200).json({
      incident,
      timeline: eventsResult.rows,
      notes: notesResult.rows,
      aiRecommendation: routingResult.rows[0] || null,
      disputes,
      reporterReputation,
    });
  } catch (error) {
    console.error('Error fetching incident detail:', error);
    res.status(500).json({
      error: 'Failed to fetch incident details',
    });
  }
}
