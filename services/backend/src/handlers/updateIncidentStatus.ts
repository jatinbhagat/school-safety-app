import { Request, Response } from 'express';
import { pool } from '../db';
import { reporterNotificationService } from '../services/reporterNotifications';

interface UpdateStatusBody {
  new_status?: string;
  status?: string; // Support both field names for backward compatibility
  reason?: string;
  notes?: string;
  assigned_to?: {
    name: string;
    email: string;
    role: string;
  };
}

/**
 * PUT /api/admin/incidents/:id/status
 * Updates incident status with proper validation, audit trail, and notifications
 * Supports both new_status (main branch format) and status (develop branch format)
 */
export async function updateIncidentStatus(req: Request, res: Response) {
  const client = await pool.connect();

  try {
    console.log('🔄 Status Update Request:', {
      incidentId: req.params.id,
      body: req.body,
      adminInfo: req.admin ? {
        email: req.admin.email,
        institutionId: req.admin.institutionId
      } : null,
    });

    const { id } = req.params;
    const incidentId = parseInt(id, 10);

    if (isNaN(incidentId)) {
      console.error('❌ Invalid incident ID:', id);
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid incident ID',
      });
    }

    const {
      new_status,
      status,
      reason,
      notes,
      assigned_to,
    }: UpdateStatusBody = req.body;

    // Support both field names - prefer new_status but fallback to status
    const targetStatus = new_status || status;

    // Get admin info from JWT token
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userEmail = req.admin.email;
    const userName = req.admin.name || req.admin.adminId || 'Admin User';
    const userRole = req.admin.role || 'admin';
    const adminId = req.admin.adminId;
    const institutionId = req.admin.institutionId;

    // Validate required fields
    console.log('📋 Validating request fields:', { 
      targetStatus, 
      reason: reason ? '[PROVIDED]' : '[MISSING]' 
    });
    
    if (!targetStatus) {
      console.error('❌ Missing status field');
      return res.status(400).json({
        error: 'Validation failed',
        message: 'status or new_status is required',
      });
    }

    // Valid status values (canonical)
    const validStatuses = ['open', 'assigned', 'resolved'];

    if (!validStatuses.includes(targetStatus)) {
      console.error('❌ Invalid status value:', { 
        provided: targetStatus, 
        validOptions: validStatuses
      });
      return res.status(400).json({
        error: 'Validation failed',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    console.log('✅ Status validation passed:', targetStatus);

    await client.query('BEGIN');

    // Check incident exists and belongs to this institution
    const checkQuery = `
      SELECT id, status, school_id, tenant_id, ai_meta, created_at
      FROM incidents
      WHERE id = $1 AND (school_id = $2 OR tenant_id = $2)
    `;

    const checkResult = await client.query(checkQuery, [incidentId, institutionId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.error('❌ Incident not found:', { incidentId, institutionId });
      return res.status(404).json({
        error: 'Not found',
        message: 'Incident not found',
      });
    }

    console.log('✅ Incident found, proceeding with update');

    const incident = checkResult.rows[0];
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
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      incidentId,
      targetStatus,
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

    // Get admin name for event logging
    let adminName = userName;
    if (adminId) {
      try {
        const adminQuery = `SELECT name FROM institution_admins WHERE id = $1`;
        const adminResult = await client.query(adminQuery, [adminId]);
        adminName = adminResult.rows[0]?.name || userName;
      } catch (error) {
        console.warn('Could not fetch admin name, using fallback:', error);
      }
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

    let eventDescription = notes
      ? `Status changed from ${oldStatus} to ${targetStatus}: ${notes}`
      : `Status changed from ${oldStatus} to ${targetStatus}`;
    
    if (reason) {
      eventDescription += ` (Reason: ${reason})`;
    }
    
    if (assigned_to) {
      eventDescription += ` and assigned to ${assigned_to.name} (${assigned_to.role})`;
    }

    const eventData = {
      old_status: oldStatus,
      new_status: targetStatus,
      reason: reason || null,
      notes: notes || null,
      assigned_to: assigned_to || null,
    };

    await client.query(eventQuery, [
      incidentId,
      'status_changed',
      eventDescription,
      JSON.stringify(eventData),
      adminName,
      userRole,
      userEmail,
      'admin',
    ]);

    // If assigning, also create assignment event
    if (assigned_to) {
      await client.query(eventQuery, [
        incidentId,
        'assigned',
        `${adminName} assigned incident to ${assigned_to.name} (${assigned_to.role})`,
        JSON.stringify({ assigned_to, reason }),
        adminName,
        userRole,
        userEmail,
        'admin',
      ]);
    }

    await client.query('COMMIT');

    // Send notification to reporter (async, don't wait)
    let notificationType: 'status_changed' | 'resolved' | 'assigned_to_staff' = 'status_changed';
    if (targetStatus === 'resolved') {
      notificationType = 'resolved';
    } else if (targetStatus === 'assigned') {
      notificationType = 'assigned_to_staff';
    }

    reporterNotificationService
      .sendNotification(incidentId, notificationType)
      .catch((error) => console.error('Failed to send status notification:', error));

    console.log('🎉 Status update successful:', { 
      incidentId, 
      oldStatus, 
      newStatus: targetStatus,
      updatedBy: adminName 
    });

    res.status(200).json({
      message: 'Status updated successfully',
      incident: updateResult.rows[0],
      statusChange: {
        old_status: oldStatus,
        new_status: targetStatus,
        reason: reason || null,
        updated_by: adminName,
        updated_at: updatedAt,
        assigned_to: assigned_to || null,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('💥 Error updating incident status:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      incidentId: req.params.id,
      adminEmail: req.admin?.email
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update incident status',
    });
  } finally {
    client.release();
  }
}
