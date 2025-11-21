import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { pool } from '../db';
import { uploadQRCode } from '../utils/localStorage';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * POST /api/institutions/:id/qr-code
 * Generate QR code for institution (immutable)
 */
export async function generateQRCode(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);
    const { type = 'kiosk', size = 512 } = req.body;

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if QR code already exists (immutable)
    const existing = await pool.query(
      'SELECT qr_code_url, qr_code_data FROM qr_codes WHERE institution_id = $1 AND qr_type = $2',
      [institutionId, type]
    );

    if (existing.rows.length > 0) {
      // Return existing QR code (immutable)
      return res.json({
        success: true,
        qrCodeUrl: existing.rows[0].qr_code_url,
        qrCodeData: existing.rows[0].qr_code_data,
        message: 'QR code already exists (immutable)',
      });
    }

    // Get institution URL slug
    const instResult = await pool.query(
      'SELECT url_slug FROM institutions WHERE id = $1',
      [institutionId]
    );

    if (instResult.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const { url_slug } = instResult.rows[0];

    // Generate QR code data (the kiosk URL)
    const qrData = `${APP_URL}/kiosk/${url_slug}`;

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Upload to S3
    const qrCodeUrl = await uploadQRCode(institutionId, qrBuffer, type);

    // Store in database
    await pool.query(
      `INSERT INTO qr_codes (institution_id, qr_code_url, qr_code_data, qr_type, size)
       VALUES ($1, $2, $3, $4, $5)`,
      [institutionId, qrCodeUrl, qrData, type, size]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, new_values)
       VALUES ($1, $2, 'generate_qr_code', 'qr_code', $3)`,
      [institutionId, req.admin.adminId, JSON.stringify({ qrCodeUrl, qrData, type })]
    );

    res.json({
      success: true,
      qrCodeUrl,
      qrCodeData: qrData,
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

/**
 * GET /api/institutions/:id/qr-code
 * Get existing QR code
 */
export async function getQRCode(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.id);
    const type = req.query.type || 'kiosk';

    // Verify this admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT qr_code_url, qr_code_data, size, created_at FROM qr_codes WHERE institution_id = $1 AND qr_type = $2',
      [institutionId, type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found. Generate one first.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
}
