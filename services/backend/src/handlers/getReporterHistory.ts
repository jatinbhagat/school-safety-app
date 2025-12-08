import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /api/admin/reporter-history/:fingerprint
 * Get anonymized reporter history by fingerprint
 * Requires admin or super_admin role
 */
export async function getReporterHistory(req: Request, res: Response) {
  try {
    const { fingerprint } = req.params;
    const institutionId = req.admin?.institutionId;
    const role = req.admin?.role;

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

    // Get reputation data
    const repQuery = `
      SELECT
        total_reports,
        false_reports,
        verified_reports,
        reputation_score,
        is_blocked,
        blocked_reason,
        blocked_at,
        first_report_at,
        last_report_at
      FROM reporter_reputation
      WHERE reporter_fingerprint = $1 AND institution_id = $2
    `;

    const repResult = await pool.query(repQuery, [fingerprint, institutionId]);

    // Get incident history (without PII)
    const incidentsQuery = `
      SELECT
        id,
        category,
        description,
        status,
        created_at,
        flagged_as_false,
        false_report_reason,
        false_report_confirmed,
        ai_meta->>'severity' as severity
      FROM incidents
      WHERE reporter_fingerprint = $1 AND (school_id = $2 OR tenant_id = $2)
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const incidentsResult = await pool.query(incidentsQuery, [fingerprint, institutionId]);

    // Check if blocked
    const blockedQuery = `
      SELECT id, reason, blocked_at, blocked_by
      FROM blocked_reporters
      WHERE fingerprint = $1 AND institution_id = $2 AND is_active = true
    `;

    const blockedResult = await pool.query(blockedQuery, [fingerprint, institutionId]);

    res.status(200).json({
      reputation: repResult.rows[0] || null,
      incidents: incidentsResult.rows,
      isBlocked: blockedResult.rows.length > 0,
      blockInfo: blockedResult.rows[0] || null,
      stats: {
        totalReports: incidentsResult.rows.length,
        flaggedCount: incidentsResult.rows.filter((i) => i.flagged_as_false).length,
        confirmedFalseCount: incidentsResult.rows.filter((i) => i.false_report_confirmed).length,
        byCategory: incidentsResult.rows.reduce((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Error fetching reporter history:', error);
    res.status(500).json({
      error: 'Failed to fetch reporter history',
    });
  }
}
