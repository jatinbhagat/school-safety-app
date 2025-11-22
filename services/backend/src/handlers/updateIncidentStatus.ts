import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/jwtAuth';

/**
 * PUT /api/admin/incidents/:id/status
 * Update incident status with event logging
 * Requires JWT authentication
 */
export async function updateIncidentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const incidentId = parseInt(id, 10);
    const institutionId = req.institutionId;
    const adminId = req.adminId;
    const adminEmail = req.email;

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Invalid incident ID',
      });
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check incident exists and belongs to this institution
      const checkQuery = `
        SELECT id, status, school_id, tenant_id
        FROM incidents
        WHERE id = $1 AND (school_id = $2 OR tenant_id = $2)
      `;

      const checkResult = await client.query(checkQuery, [incidentId, institutionId]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Incident not found',
        });
      }

      const incident = checkResult.rows[0];
      const oldStatus = incident.status;

      // Update status
      const updateQuery = `
        UPDATE incidents
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [status, incidentId]);

      // Get admin name for event logging
      const adminQuery = `SELECT name FROM institution_admins WHERE id = $1`;
      const adminResult = await client.query(adminQuery, [adminId]);
      const adminName = adminResult.rows[0]?.name || adminEmail;

      // Log event
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const eventDescription = notes
        ? `Status changed from ${oldStatus} to ${status}: ${notes}`
        : `Status changed from ${oldStatus} to ${status}`;

      await client.query(eventQuery, [
        incidentId,
        'status_changed',
        eventDescription,
        JSON.stringify({ old_status: oldStatus, new_status: status, notes }),
        adminName,
        req.role || 'admin',
        adminEmail,
        'admin',
      ]);

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Status updated successfully',
        incident: updateResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({
      error: 'Failed to update status',
    });
  }
}
