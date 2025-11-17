import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

/**
 * GET /micro-guides
 * Retrieve all micro-guides with optional filtering
 */
export async function getMicroGuides(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { enabled, tag } = req.query;

    let query = `
      SELECT
        id,
        title,
        body,
        tags,
        duration_seconds,
        enabled,
        created_at,
        updated_at
      FROM micro_guides
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by enabled status if provided
    if (enabled !== undefined) {
      const enabledBool = enabled === 'true' || enabled === '1';
      conditions.push(`enabled = $${paramIndex}`);
      values.push(enabledBool);
      paramIndex++;
    }

    // Filter by tag if provided
    if (tag && typeof tag === 'string') {
      conditions.push(`$${paramIndex} = ANY(tags)`);
      values.push(tag);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    res.status(200).json({
      guides: result.rows,
      count: result.rows.length,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error retrieving micro-guides:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve micro-guides',
      request_id: requestId,
    });
  }
}
