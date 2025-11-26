import { Request, Response } from 'express';
import { pool } from '../db';

interface UpdateStatusBody {
  new_status: string;
  reason: string;
  notes?: string;
  assigned_to?: {
    name: string;
    email: string;
    role: string;
  };
}

/**
 * PUT /api/admin/incidents/:id/status
 * Updates incident status with proper validation and audit trail
 */
export async function updateIncidentStatus(req: Request, res: Response) {
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
      new_status,
      reason,
      notes,
      assigned_to,
    }: UpdateStatusBody = req.body;

    // Get user info from JWT token
    const userEmail = (req as any).user?.email || 'unknown@system';
    const userName = (req as any).user?.name || 'System User';
    const userRole = (req as any).user?.role || 'admin';

    // Validate required fields
    if (!new_status) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'new_status is required',
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'reason is required for status changes',
      });
    }

    // Valid statuses
    const validStatuses = [
      'pending',
      'assigned',
      'investigating',
      'awaiting_response',
      'resolved',
      'closed',
      'escalated'
    ];

    if (!validStatuses.includes(new_status)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await client.query('BEGIN');

    // Fetch current incident
    const incidentQuery = `
      SELECT id, status, ai_meta, created_at, school_id
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
    const oldStatus = incident.status;

    // Update incident with new status and assignment info
    const updatedAt = new Date().toISOString();
    let updatedAiMeta = { ...(incident.ai_meta || {}) };

    // If assigning to someone, update assignment info
    if (assigned_to) {
      updatedAiMeta = {
        ...updatedAiMeta,
        assigned_to: assigned_to.email,
        assigned_to_name: assigned_to.name,
        assigned_to_role: assigned_to.role,
        assigned_at: updatedAt,
        assigned_by: userName
      };
    }

    // Update the incident
    const updateQuery = `
      UPDATE incidents
      SET
        status = $2,
        ai_meta = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, category, description, status, created_at, ai_meta
    `;

    const updateResult = await client.query(updateQuery, [
      incidentId,
      new_status,
      JSON.stringify(updatedAiMeta),
    ]);

    // Add status change note if provided
    if (notes && notes.trim()) {
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
      `;

      await client.query(noteQuery, [
        incidentId,
        notes.trim(),
        'general',
        userName,
        userRole,
        userEmail,
      ]);
    }

    // Create timeline event for status change
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

    let eventDescription = `${userName} changed status from "${oldStatus}" to "${new_status}"`;
    if (assigned_to) {
      eventDescription += ` and assigned to ${assigned_to.name} (${assigned_to.role})`;
    }

    const eventData = {
      old_status: oldStatus,
      new_status,
      reason,
      assigned_to: assigned_to || null,
    };

    await client.query(eventQuery, [
      incidentId,
      'status_changed',
      eventDescription,
      JSON.stringify(eventData),
      userName,
      userRole,
      userEmail,
      'admin',
    ]);

    // If assigning, also create assignment event
    if (assigned_to) {
      await client.query(eventQuery, [
        incidentId,
        'assigned',
        `${userName} assigned incident to ${assigned_to.name} (${assigned_to.role})`,
        JSON.stringify({ assigned_to, reason }),
        userName,
        userRole,
        userEmail,
        'admin',
      ]);
    }

    await client.query('COMMIT');

    res.status(200).json({
      incident: updateResult.rows[0],
      statusChange: {
        old_status: oldStatus,
        new_status,
        reason,
        updated_by: userName,
        updated_at: updatedAt,
        assigned_to: assigned_to || null,
      },
      message: 'Incident status updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating incident status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update incident status',
    });
  } finally {
    client.release();
  }
}