import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * POST /api/admin/incidents/:id/confirm-false
 * Confirm an incident as false report (final decision)
 * Requires super_admin role
 */
export async function confirmFalseReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { finalNotes } = req.body;
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
        SELECT id, flagged_as_false, false_report_confirmed, school_id, tenant_id
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
          error: 'Incident must be flagged before confirmation',
        });
      }

      if (incident.false_report_confirmed) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Incident already confirmed as false',
        });
      }

      // Confirm as false and close incident
      const updateQuery = `
        UPDATE incidents
        SET
          false_report_confirmed = true,
          false_report_confirmed_by = $1,
          false_report_confirmed_at = NOW(),
          status = 'closed',
          false_report_notes = COALESCE(false_report_notes, '') || E'\n\nFinal Decision: ' || $2
        WHERE id = $3
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        adminId,
        finalNotes || 'Confirmed as false report',
        incidentId,
      ]);

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

      await client.query(eventQuery, [
        incidentId,
        'confirmed_false',
        `Confirmed as false report and closed. ${finalNotes || ''}`,
        JSON.stringify({ confirmed_by: adminName, notes: finalNotes }),
        adminName,
        role,
        adminEmail,
        'admin',
      ]);

      // Update reporter reputation
      const fingerprint = await client.query(
        'SELECT reporter_fingerprint FROM incidents WHERE id = $1',
        [incidentId]
      );

      if (fingerprint.rows[0]?.reporter_fingerprint) {
        const fp = fingerprint.rows[0].reporter_fingerprint;

        // Update or insert reputation
        const repQuery = `
          INSERT INTO reporter_reputation (
            reporter_fingerprint,
            institution_id,
            total_reports,
            false_reports,
            reputation_score,
            last_report_at
          )
          VALUES ($1, $2, 1, 1, 0.50, NOW())
          ON CONFLICT (reporter_fingerprint, institution_id)
          DO UPDATE SET
            false_reports = reporter_reputation.false_reports + 1,
            reputation_score = GREATEST(0, reporter_reputation.reputation_score - 0.15),
            updated_at = NOW()
        `;

        await client.query(repQuery, [fp, institutionId]);
      }

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Incident confirmed as false report',
        incident: updateResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error confirming false report:', error);
    res.status(500).json({
      error: 'Failed to confirm false report',
    });
  }
}
