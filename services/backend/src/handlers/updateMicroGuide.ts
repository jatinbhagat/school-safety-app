import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

interface UpdateMicroGuideBody {
  enabled?: boolean;
  title?: string;
  body?: string;
  tags?: string[];
  duration_seconds?: number;
}

/**
 * PATCH /micro-guides/:id
 * Update a micro-guide (typically to enable/disable)
 */
export async function updateMicroGuide(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { id } = req.params;
    const updates: UpdateMicroGuideBody = req.body;

    // Validate ID
    const guideId = parseInt(id, 10);
    if (isNaN(guideId)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid guide ID',
        request_id: requestId,
      });
      return;
    }

    // Check if guide exists
    const checkQuery = 'SELECT id FROM micro_guides WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [guideId]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({
        error: 'Not found',
        message: `Micro-guide with ID ${guideId} not found`,
        request_id: requestId,
      });
      return;
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.enabled !== undefined) {
      updateFields.push(`enabled = $${paramIndex}`);
      values.push(updates.enabled);
      paramIndex++;
    }

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(updates.title.trim());
      paramIndex++;
    }

    if (updates.body !== undefined) {
      updateFields.push(`body = $${paramIndex}`);
      values.push(updates.body.trim());
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`);
      values.push(updates.tags);
      paramIndex++;
    }

    if (updates.duration_seconds !== undefined) {
      updateFields.push(`duration_seconds = $${paramIndex}`);
      values.push(updates.duration_seconds);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'No valid update fields provided',
        request_id: requestId,
      });
      return;
    }

    // Add guide ID as last parameter
    values.push(guideId);

    const updateQuery = `
      UPDATE micro_guides
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, title, body, tags, duration_seconds, enabled, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, values);
    const updatedGuide = result.rows[0];

    console.log(`Micro-guide updated: id=${guideId}, fields=${updateFields.join(', ')}`);

    res.status(200).json({
      ...updatedGuide,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error updating micro-guide:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update micro-guide',
      request_id: requestId,
    });
  }
}
