import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/jwtAuth';

/**
 * POST /api/admin/incidents/:id/restore
 * Restore (overturn) a false report flag
 * Requires super_admin role
 */
export async function restoreFalseReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const incidentId = parseInt(id, 10);
    const institutionId = req.institutionId;
    const adminId = req.adminId;
    const adminEmail = req.email;
    const role = req.role;

    if (isNaN(incidentId)) {
      return res.status(400).json({
        error: 'Invalid incident ID',
      });
    }

    // Super admin only
    if (role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions. Super Admin role required.',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check incident exists and is flagged
      const checkQuery = `
        SELECT id, flagged_as_false, status, reporter_fingerprint, school_id, tenant_id
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

      if (!incident.flagged_as_false) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Incident is not flagged as false',
        });
      }

      // Restore incident - remove false flag
      const updateQuery = `
        UPDATE incidents
        SET
          flagged_as_false = false,
          false_report_reason = NULL,
          false_report_notes = NULL,
          false_report_marked_by = NULL,
          false_report_marked_at = NULL,
          false_report_confirmed = false,
          false_report_confirmed_by = NULL,
          false_report_confirmed_at = NULL,
          status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
        WHERE id = $1
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [incidentId]);

      // Get admin name
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

      const eventDescription = reason
        ? `False report flag removed. Reason: ${reason}`
        : 'False report flag removed';

      await client.query(eventQuery, [
        incidentId,
        'restored',
        eventDescription,
        JSON.stringify({ restored_by: adminName, reason }),
        adminName,
        role,
        adminEmail,
        'admin',
      ]);

      // Update reporter reputation (improve score)
      if (incident.reporter_fingerprint) {
        const fp = incident.reporter_fingerprint;

        const repQuery = `
          UPDATE reporter_reputation
          SET
            false_reports = GREATEST(0, false_reports - 1),
            verified_reports = verified_reports + 1,
            reputation_score = LEAST(1.00, reputation_score + 0.20),
            updated_at = NOW()
          WHERE reporter_fingerprint = $1 AND institution_id = $2
        `;

        await client.query(repQuery, [fp, institutionId]);
      }

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Incident restored successfully',
        incident: updateResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error restoring incident:', error);
    res.status(500).json({
      error: 'Failed to restore incident',
    });
  }
}
