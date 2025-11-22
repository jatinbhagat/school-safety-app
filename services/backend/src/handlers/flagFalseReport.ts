import { Request, Response } from 'express';
import { pool } from '../db';
import { reporterNotificationService } from '../services/reporterNotifications';

/**
 * POST /api/admin/incidents/:id/flag-false
 * Flag an incident as potentially false
 * Requires admin or super_admin role
 */
export async function flagFalseReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const incidentId = parseInt(id, 10);
    const institutionId = req.admin?.institutionId;
    const adminId = req.admin?.adminId;
    const adminEmail = req.admin?.email;
    const role = req.admin?.role;

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Invalid incident ID',
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'Reason is required',
      });
    }

    // Check permissions (admin or super_admin only)
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions. Admin or Super Admin role required.',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check incident exists and belongs to this institution
      const checkQuery = `
        SELECT id, flagged_as_false, school_id, tenant_id
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

      if (incident.flagged_as_false) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Incident is already flagged as false',
        });
      }

      // Flag as false
      const updateQuery = `
        UPDATE incidents
        SET
          flagged_as_false = true,
          false_report_reason = $1,
          false_report_notes = $2,
          false_report_marked_by = $3,
          false_report_marked_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        reason,
        notes || '',
        adminId,
        incidentId,
      ]);

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

      const eventDescription = `Flagged as potentially false report. Reason: ${reason}`;

      await client.query(eventQuery, [
        incidentId,
        'flagged_as_false',
        eventDescription,
        JSON.stringify({ reason, notes, flagged_by: adminName }),
        adminName,
        role,
        adminEmail,
        'admin',
      ]);

      await client.query('COMMIT');

      // Send notification to reporter if contact info provided
      const baseUrl = process.env.FRONTEND_URL || 'https://safelynotify.com';
      const trackingToken = updateResult.rows[0].reporter_notification_token;
      const disputeUrl = trackingToken ? `${baseUrl}/dispute/${trackingToken}` : baseUrl;
      const disputeDeadline = new Date();
      disputeDeadline.setDate(disputeDeadline.getDate() + 7);

      reporterNotificationService
        .sendNotification(incidentId, 'flagged_as_false', {
          flag_reason: reason,
          dispute_url: disputeUrl,
          dispute_deadline: disputeDeadline.toLocaleDateString(),
        })
        .catch((error) => console.error('Failed to send false report notification:', error));

      res.status(200).json({
        message: 'Incident flagged as false report',
        incident: updateResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error flagging false report:', error);
    res.status(500).json({
      error: 'Failed to flag as false report',
    });
  }
}
