import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /staff/stats
 * Returns dashboard statistics for staff view
 * Query params:
 *   - role: Filter by assigned role (optional)
 *   - email: Filter by staff email (optional)
 */
export async function getStaffStats(req: Request, res: Response) {
  try {
    const { role, email } = req.query;

    // Build WHERE clause based on filters
    let myQueueFilter = '';
    const queryParams: any[] = [];

    if (role && typeof role === 'string') {
      queryParams.push(role);
      myQueueFilter = `AND (ai_meta->>'assigned_to')::text = $${queryParams.length}`;
    } else if (email && typeof email === 'string') {
      queryParams.push(email);
      myQueueFilter = `AND (ai_meta->>'assigned_by')::text = $${queryParams.length}`;
    }

    // Get total incidents
    const totalQuery = 'SELECT COUNT(*) as count FROM incidents';
    const totalResult = await pool.query(totalQuery);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Get pending incidents (open status, not assigned)
    const pendingQuery = `
      SELECT COUNT(*) as count
      FROM incidents
      WHERE status = 'open'
    `;
    const pendingResult = await pool.query(pendingQuery);
    const pending = parseInt(pendingResult.rows[0].count, 10);

    // Get my queue (incidents assigned to this staff member)
    const myQueueQuery = `
      SELECT COUNT(*) as count
      FROM incidents
      WHERE status = 'in_progress'
      ${myQueueFilter}
    `;
    const myQueueResult = queryParams.length > 0
      ? await pool.query(myQueueQuery, queryParams)
      : await pool.query(myQueueQuery);
    const myQueue = parseInt(myQueueResult.rows[0].count, 10);

    // Get resolved today
    const resolvedTodayQuery = `
      SELECT COUNT(*) as count
      FROM incidents
      WHERE status = 'resolved'
        AND DATE(created_at) = CURRENT_DATE
    `;
    const resolvedTodayResult = await pool.query(resolvedTodayQuery);
    const resolvedToday = parseInt(resolvedTodayResult.rows[0].count, 10);

    // Get high priority count
    const highPriorityQuery = `
      SELECT COUNT(*) as count
      FROM incidents
      WHERE (ai_meta->>'severity')::text IN ('high', 'critical')
        AND status IN ('open', 'in_progress')
    `;
    const highPriorityResult = await pool.query(highPriorityQuery);
    const highPriority = parseInt(highPriorityResult.rows[0].count, 10);

    res.status(200).json({
      total,
      pending,
      myQueue,
      resolvedToday,
      highPriority,
      filters: {
        role: role || null,
        email: email || null,
      },
    });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics',
    });
  }
}
