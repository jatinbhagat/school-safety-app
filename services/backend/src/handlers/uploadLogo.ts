import { Request, Response } from 'express';
import multer from 'multer';
import { pool } from '../db';
import { uploadLogo } from '../utils/s3';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and SVG allowed.'));
    }
  },
});

/**
 * POST /api/institutions/:id/logo
 * Upload institution logo
 */
export const uploadLogoHandler = [
  upload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!req.admin) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const institutionId = parseInt(req.params.id);

      // Verify this admin belongs to this institution
      if (req.admin.institutionId !== institutionId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Upload to S3
      const logoUrl = await uploadLogo(
        institutionId,
        req.file.buffer,
        req.file.mimetype
      );

      // Update institution
      await pool.query(
        'UPDATE institutions SET logo_url = $1, updated_at = NOW() WHERE id = $2',
        [logoUrl, institutionId]
      );

      // Create audit log
      await pool.query(
        `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
         VALUES ($1, $2, 'upload_logo', 'institution', $3, $4)`,
        [institutionId, req.admin.adminId, institutionId, JSON.stringify({ logoUrl })]
      );

      res.json({
        success: true,
        logoUrl,
      });
    } catch (error) {
      console.error('Upload logo error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    }
  },
];
