import { Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../middleware/jwtAuth';

/**
 * POST /api/admin/block-reporter
 * Block a reporter by fingerprint
 * Requires admin or super_admin role
 */
export async function blockReporter(req: AuthRequest, res: Response) {
  try {
    const { fingerprint, reason } = req.body;
    const institutionId = req.institutionId;
    const adminId = req.adminId;
    const adminEmail = req.email;
    const role = req.role;

    if (!fingerprint) {
      return res.status(400).json({
        error: 'Fingerprint is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        error: 'Reason is required',
      });
    }

    // Check permissions
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if already blocked
      const checkQuery = `
        SELECT id FROM blocked_reporters
        WHERE fingerprint = $1 AND institution_id = $2 AND is_active = true
      `;

      const checkResult = await client.query(checkQuery, [fingerprint, institutionId]);

      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Reporter is already blocked',
        });
      }

      // Block reporter
      const blockQuery = `
        INSERT INTO blocked_reporters (
          fingerprint,
          institution_id,
          blocked_by,
          reason,
          is_active
        )
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `;

      const blockResult = await client.query(blockQuery, [
        fingerprint,
        institutionId,
        adminId,
        reason,
      ]);

      // Update reputation
      const repQuery = `
        UPDATE reporter_reputation
        SET
          is_blocked = true,
          blocked_reason = $1,
          blocked_at = NOW(),
          blocked_by = $2,
          updated_at = NOW()
        WHERE reporter_fingerprint = $3 AND institution_id = $4
      `;

      await client.query(repQuery, [reason, adminId, fingerprint, institutionId]);

      // Get admin name for logging
      const adminQuery = `SELECT name FROM institution_admins WHERE id = $1`;
      const adminResult = await client.query(adminQuery, [adminId]);
      const adminName = adminResult.rows[0]?.name || adminEmail;

      // Log audit event
      const auditQuery = `
        INSERT INTO audit_logs (
          admin_id,
          institution_id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await client.query(auditQuery, [
        adminId,
        institutionId,
        'block_reporter',
        'reporter',
        fingerprint,
        JSON.stringify({ reason, blocked_by: adminName }),
        req.ip || 'unknown',
      ]);

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Reporter blocked successfully',
        block: blockResult.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error blocking reporter:', error);
    res.status(500).json({
      error: 'Failed to block reporter',
    });
  }
}

/**
 * POST /api/admin/unblock-reporter
 * Unblock a reporter
 * Requires admin or super_admin role
 */
export async function unblockReporter(req: AuthRequest, res: Response) {
  try {
    const { fingerprint } = req.body;
    const institutionId = req.institutionId;
    const adminId = req.adminId;
    const adminEmail = req.email;
    const role = req.role;

    if (!fingerprint) {
      return res.status(400).json({
        error: 'Fingerprint is required',
      });
    }

    // Check permissions
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Unblock
      const unblockQuery = `
        UPDATE blocked_reporters
        SET is_active = false, unblocked_at = NOW(), unblocked_by = $1
        WHERE fingerprint = $2 AND institution_id = $3 AND is_active = true
        RETURNING *
      `;

      const unblockResult = await client.query(unblockQuery, [adminId, fingerprint, institutionId]);

      if (unblockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'No active block found for this reporter',
        });
      }

      // Update reputation
      const repQuery = `
        UPDATE reporter_reputation
        SET
          is_blocked = false,
          blocked_reason = NULL,
          blocked_at = NULL,
          blocked_by = NULL,
          updated_at = NOW()
        WHERE reporter_fingerprint = $1 AND institution_id = $2
      `;

      await client.query(repQuery, [fingerprint, institutionId]);

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Reporter unblocked successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error unblocking reporter:', error);
    res.status(500).json({
      error: 'Failed to unblock reporter',
    });
  }
}
