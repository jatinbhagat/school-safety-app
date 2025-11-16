import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

interface AttachmentMetadata {
  key: string;
  filename: string;
  contentType: string;
  size?: number;
  uploadedAt: string;
}

interface PostReportBody {
  category?: string;
  description?: string;
  class_section?: string;
  attachments?: AttachmentMetadata[];
}

export async function postReport(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { category, description, class_section, attachments }: PostReportBody = req.body;

    // Validate required fields
    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "category" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    // Validate attachments if provided
    if (attachments) {
      if (!Array.isArray(attachments)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Field "attachments" must be an array',
          request_id: requestId,
        });
        return;
      }

      for (const attachment of attachments) {
        if (!attachment.key || typeof attachment.key !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "key" field',
            request_id: requestId,
          });
          return;
        }
        if (!attachment.filename || typeof attachment.filename !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "filename" field',
            request_id: requestId,
          });
          return;
        }
        if (!attachment.contentType || typeof attachment.contentType !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "contentType" field',
            request_id: requestId,
          });
          return;
        }
      }
    }

    // Insert incident into database
    const query = `
      INSERT INTO incidents (category, description, class_section, attachments, status)
      VALUES ($1, $2, $3, $4, 'open')
      RETURNING id, created_at
    `;

    const values = [
      category.trim(),
      description?.trim() || null,
      class_section?.trim() || null,
      attachments ? JSON.stringify(attachments) : null,
    ];

    const result = await pool.query(query, values);
    const incident = result.rows[0];

    res.status(201).json({
      id: incident.id,
      created_at: incident.created_at,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error creating incident report:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create incident report',
      request_id: requestId,
    });
  }
}
