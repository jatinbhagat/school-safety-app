import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/admin/incidents/:id
 * Returns comprehensive incident information including notes, timeline, and resolution data
 * Updated for enhanced incident management workflow
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

    // Verify admin authentication
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch comprehensive incident details
    const incidentQuery = `
      SELECT
        i.id,
        i.category as type,
        -- Use description from dynamic_fields if main description is null/empty
        COALESCE(
          NULLIF(i.description, ''), 
          i.dynamic_fields->>'description'
        ) as description,
        i.class_section as location,
        i.status,
        i.created_at,
        i.ai_meta,
        i.attachments,
        i.dynamic_fields,
        i.school_id,
        i.tenant_id,
        
        -- AI Analysis
        COALESCE((i.ai_meta->>'severity')::text, 'medium') as priority,
        (i.ai_meta->>'risk_level')::text as risk_level,
        (i.ai_meta->>'confidence')::text as ai_confidence,
        (i.ai_meta->>'recommended_role')::text as recommended_role,
        (i.ai_meta->>'reasoning')::text as ai_reasoning,
        
        -- Assignment information
        (i.ai_meta->>'assigned_to')::text as assigned_to_email,
        (i.ai_meta->>'assigned_to_name')::text as assigned_to_name,
        (i.ai_meta->>'assigned_to_role')::text as assigned_to_role,
        (i.ai_meta->>'assigned_at')::text as assigned_at,
        (i.ai_meta->>'assigned_by')::text as assigned_by,
        
        -- Resolution information
        (i.ai_meta->>'resolution_type')::text as resolution_type,
        (i.ai_meta->>'incident_validity')::text as incident_validity,
        (i.ai_meta->>'resolution_summary')::text as resolution_summary,
        (i.ai_meta->>'actions_taken')::text as actions_taken,
        (i.ai_meta->>'follow_up_required')::text as follow_up_required,
        (i.ai_meta->>'follow_up_date')::text as follow_up_date,
        (i.ai_meta->>'lessons_learned')::text as lessons_learned,
        (i.ai_meta->>'resolved_by')::text as resolved_by,
        (i.ai_meta->>'resolved_by_role')::text as resolved_by_role,
        (i.ai_meta->>'resolved_at')::text as resolved_at,
        (i.ai_meta->>'resolution_time_minutes')::text as resolution_time_minutes,
        
        -- Institution information
        inst.institution_name,
        inst.url_slug,
        
        'Anonymous' as reporter_name
      FROM incidents i
      LEFT JOIN institutions inst ON i.school_id = inst.id
      WHERE i.id = $1 AND i.school_id = $2
    `;

    const incidentResult = await pool.query(incidentQuery, [incidentId, req.admin.institutionId]);

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

    // Map backend status to frontend status
    const statusMapping: { [key: string]: string } = {
      'pending': 'open',
      'assigned': 'in_progress', 
      'resolved': 'resolved'
    };
    
    const frontendStatus = statusMapping[incident.status] || incident.status;
    
    // Format the incident to match frontend expectations
    const formattedIncident = {
      id: incident.id,
      type: incident.type, // category is already aliased as type
      status: frontendStatus,
      description: incident.description,
      location: incident.location,
      created_at: incident.created_at,
      updated_at: incident.created_at, // fallback to created_at
      ai_meta: {
        severity: incident.priority,
        risk_level: incident.risk_level,
        category: incident.type,
        confidence: incident.ai_confidence ? parseFloat(incident.ai_confidence) : null,
        routing_reason: incident.ai_reasoning
      },
      assigned_to: incident.assigned_to_email ? {
        id: 1, // placeholder
        name: incident.assigned_to_name || 'Unknown',
        email: incident.assigned_to_email,
        role: incident.assigned_to_role || 'Staff'
      } : null,
      attachments: incident.attachments || [],
      notes: notesResult.rows,
      timeline: eventsResult.rows
    };

    res.status(200).json(formattedIncident);
  } catch (error) {
    console.error('Error fetching incident detail:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch incident details',
    });
  }
}
