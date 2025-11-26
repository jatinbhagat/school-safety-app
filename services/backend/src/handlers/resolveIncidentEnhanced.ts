import { Request, Response } from 'express';
import { pool } from '../db';

interface EnhancedResolveIncidentBody {
  resolution_type: 'issue_resolved' | 'referred_to_admin' | 'ongoing_monitoring' | 'no_action_needed' | 'escalated_external';
  incident_validity: 'confirmed_incident' | 'false_report' | 'unconfirmed' | 'duplicate';
  resolution_summary: string;
  actions_taken: string[];
  follow_up_required: boolean;
  follow_up_date?: string;
  lessons_learned?: string;
}

/**
 * POST /api/admin/incidents/:id/resolve
 * Enhanced incident resolution with mandatory validity classification and detailed tracking
 */
export async function resolveIncidentEnhanced(req: Request, res: Response) {
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
      incident_validity,
      resolution_summary,
      actions_taken,
      follow_up_required,
      follow_up_date,
      lessons_learned,
    }: EnhancedResolveIncidentBody = req.body;

    // Get user info from JWT token (stored in req.admin by jwtAuth middleware)
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userEmail = req.admin.email || 'unknown@system';
    const userName = req.admin.name || 'System User'; 
    const userRole = req.admin.role || 'admin';

    // Validate required fields
    if (!resolution_type) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resolution_type is required',
      });
    }

    if (!incident_validity) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'incident_validity is required - must specify if this was a confirmed incident, false report, or unconfirmed',
      });
    }

    if (!resolution_summary || resolution_summary.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'resolution_summary is required',
      });
    }

    if (!actions_taken || !Array.isArray(actions_taken) || actions_taken.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'actions_taken is required and must be a non-empty array',
      });
    }

    // Validate follow-up date if required
    if (follow_up_required && !follow_up_date) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'follow_up_date is required when follow_up_required is true',
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

    // Update incident with comprehensive resolution info
    const updatedAiMeta = {
      ...(incident.ai_meta || {}),
      resolution_type,
      incident_validity,
      resolution_summary,
      actions_taken: JSON.stringify(actions_taken),
      follow_up_required,
      follow_up_date: follow_up_date || null,
      lessons_learned: lessons_learned || null,
      resolved_by: userName,
      resolved_by_role: userRole,
      resolved_by_email: userEmail,
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

    // Add comprehensive resolution note to staff_notes
    const resolutionNoteText = `**INCIDENT RESOLVED**

**Resolution Type:** ${resolution_type.replace(/_/g, ' ')}
**Incident Validity:** ${incident_validity.replace(/_/g, ' ')}

**Summary:** ${resolution_summary}

**Actions Taken:**
${actions_taken.map(action => `• ${action}`).join('\n')}

**Follow-up Required:** ${follow_up_required ? 'Yes' : 'No'}
${follow_up_required && follow_up_date ? `**Follow-up Date:** ${follow_up_date}` : ''}

${lessons_learned ? `**Lessons Learned:** ${lessons_learned}` : ''}

**Resolution Time:** ${resolutionTimeMinutes} minutes
**Resolved By:** ${userName} (${userRole})`;

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

    await client.query(noteQuery, [
      incidentId,
      resolutionNoteText,
      'resolution',
      userName,
      userRole,
      userEmail,
    ]);

    // Create comprehensive timeline event
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

    const eventDescription = `${userName} resolved incident (${incident_validity.replace(/_/g, ' ')})`;
    const eventData = {
      resolution_type,
      incident_validity,
      resolution_time_minutes: resolutionTimeMinutes,
      actions_taken,
      follow_up_required,
      follow_up_date: follow_up_date || null,
    };

    await client.query(eventQuery, [
      incidentId,
      'resolved',
      eventDescription,
      JSON.stringify(eventData),
      userName,
      userRole,
      userEmail,
      'admin',
    ]);

    // Update routing_logs with resolution data
    const routingUpdateQuery = `
      UPDATE routing_logs
      SET 
        resolution_time_minutes = $2,
        resolution_type = $3,
        incident_validity = $4
      WHERE incident_id = $1
        AND resolution_time_minutes IS NULL
    `;

    await client.query(routingUpdateQuery, [
      incidentId, 
      resolutionTimeMinutes,
      resolution_type,
      incident_validity
    ]);

    // Create follow-up task if required
    if (follow_up_required && follow_up_date) {
      // This could be expanded to create actual follow-up tasks/reminders
      const followUpEventData = {
        follow_up_date,
        created_by: userName,
        incident_id: incidentId
      };

      await client.query(eventQuery, [
        incidentId,
        'note_added',
        `Follow-up scheduled for ${follow_up_date}`,
        JSON.stringify(followUpEventData),
        userName,
        userRole,
        userEmail,
        'admin',
      ]);
    }

    await client.query('COMMIT');

    res.status(200).json({
      incident: updateResult.rows[0],
      resolution: {
        resolution_type,
        incident_validity,
        resolution_summary,
        actions_taken,
        follow_up_required,
        follow_up_date: follow_up_date || null,
        lessons_learned: lessons_learned || null,
        resolved_by: userName,
        resolved_by_role: userRole,
        resolved_at: resolvedAt,
        resolution_time_minutes: resolutionTimeMinutes,
      },
      message: 'Incident resolved successfully with comprehensive tracking',
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