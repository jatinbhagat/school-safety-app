import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * POST /api/demo/request
 * Submit demo booking request
 */
export async function submitDemoRequest(req: Request, res: Response) {
  try {
    const {
      organizationName,
      organizationType,
      industry,
      organizationSize,
      contactName,
      contactTitle,
      email,
      phone,
      preferredDate,
      preferredTime,
      message,
    } = req.body;

    // Validate required fields
    if (!organizationName || !organizationType || !contactName || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['organizationName', 'organizationType', 'contactName', 'email', 'phone'],
      });
    }

    // Insert demo request
    const result = await pool.query(
      `INSERT INTO demo_requests (
        organization_name, organization_type, industry, organization_size,
        contact_name, contact_title, email, phone,
        preferred_date, preferred_time, message, demo_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at`,
      [
        organizationName,
        organizationType,
        industry || null,
        organizationSize || null,
        contactName,
        contactTitle || null,
        email,
        phone,
        preferredDate || null,
        preferredTime || null,
        message || null,
        JSON.stringify(req.body),
      ]
    );

    const demoRequest = result.rows[0];

    // TODO: Send email notification to sales team

    res.json({
      success: true,
      requestId: demoRequest.id,
      message: 'Demo request received. Our team will contact you within 24 hours.',
    });
  } catch (error) {
    console.error('Submit demo request error:', error);
    res.status(500).json({ error: 'Failed to submit demo request' });
  }
}

/**
 * GET /api/demo/requests
 * Get all demo requests (admin only)
 */
export async function getDemoRequests(req: Request, res: Response) {
  try {
    // This would typically require admin authentication
    // For now, just return all requests

    const { status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM demo_requests';
    const values: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      requests: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Get demo requests error:', error);
    res.status(500).json({ error: 'Failed to get demo requests' });
  }
}
