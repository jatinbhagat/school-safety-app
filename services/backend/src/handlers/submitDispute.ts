import { Request, Response } from 'express';
import { pool } from '../db';
import { adminPushNotificationService } from '../services/adminPushNotifications';

/**
 * POST /api/dispute/:token
 * Submit a dispute for a false report flag
 * Public endpoint - uses tracking token for authentication
 */
export async function submitDispute(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { dispute_reason, contact_info, additional_evidence } = req.body;

    // Validate token
    if (!token || token.length !== 64) {
      return res.status(400).json({
        error: 'Invalid tracking token',
      });
    }

    // Validate reason
    if (!dispute_reason || typeof dispute_reason !== 'string' || dispute_reason.trim() === '') {
      return res.status(400).json({
        error: 'Dispute reason is required',
      });
    }

    if (dispute_reason.length > 2000) {
      return res.status(400).json({
        error: 'Dispute reason must be less than 2000 characters',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get incident by tracking token
      const incidentQuery = `
        SELECT
          i.id,
          i.flagged_as_false,
          i.false_report_confirmed,
          i.false_report_marked_at,
          i.school_id,
          i.tenant_id
        FROM incidents i
        WHERE i.reporter_notification_token = $1
      `;

      const incidentResult = await client.query(incidentQuery, [token]);

      if (incidentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Report not found',
          message: 'This tracking link is invalid or expired',
        });
      }

      const incident = incidentResult.rows[0];

      // Check if incident is flagged as false
      if (!incident.flagged_as_false) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Cannot dispute',
          message: 'This report has not been flagged as false',
        });
      }

      // Check if already confirmed (cannot dispute after confirmation)
      if (incident.false_report_confirmed) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Cannot dispute',
          message: 'This report has already been confirmed as false. Disputes are only allowed before confirmation.',
        });
      }

      // Check if dispute window has expired (7 days)
      const flaggedDate = new Date(incident.false_report_marked_at);
      const currentDate = new Date();
      const daysSinceFlagged = Math.floor((currentDate.getTime() - flaggedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceFlagged > 7) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Dispute window expired',
          message: 'Disputes must be submitted within 7 days of the report being flagged.',
        });
      }

      // Check if a dispute already exists for this incident
      const existingDisputeQuery = `
        SELECT id, status FROM false_report_disputes
        WHERE incident_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const existingDisputeResult = await client.query(existingDisputeQuery, [incident.id]);

      if (existingDisputeResult.rows.length > 0) {
        const existingDispute = existingDisputeResult.rows[0];

        // Allow new dispute only if previous one was rejected
        if (existingDispute.status !== 'rejected') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'Dispute already exists',
            message: 'A dispute has already been submitted for this report and is under review.',
          });
        }
      }

      // Create dispute
      const createDisputeQuery = `
        INSERT INTO false_report_disputes (
          incident_id,
          dispute_reason,
          contact_info,
          additional_evidence,
          status
        )
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id, created_at
      `;

      const disputeResult = await client.query(createDisputeQuery, [
        incident.id,
        dispute_reason.trim(),
        contact_info?.trim() || null,
        additional_evidence?.trim() || null,
      ]);

      const dispute = disputeResult.rows[0];

      // Log event
      const eventQuery = `
        INSERT INTO incident_events (
          incident_id,
          event_type,
          event_description,
          event_data,
          actor_name,
          actor_role,
          actor_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await client.query(eventQuery, [
        incident.id,
        'dispute_submitted',
        'Reporter submitted a dispute for false report flag',
        JSON.stringify({ dispute_id: dispute.id }),
        'Reporter',
        'reporter',
        'reporter',
      ]);

      await client.query('COMMIT');

      // Send push notification to super admins (async, don't wait)
      const institutionId = incident.tenant_id || incident.school_id;
      adminPushNotificationService.notifyDisputeSubmitted(incident.id, dispute.id, institutionId).catch(err => {
        console.error('Failed to send dispute notification:', err);
      });

      res.status(201).json({
        message: 'Dispute submitted successfully',
        dispute: {
          id: dispute.id,
          created_at: dispute.created_at,
          status: 'pending',
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error submitting dispute:', error);
    res.status(500).json({
      error: 'Failed to submit dispute',
      message: 'An error occurred while processing your dispute. Please try again later.',
    });
  }
}
