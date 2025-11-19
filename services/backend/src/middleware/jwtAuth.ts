import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { pool } from '../db';

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      admin?: TokenPayload;
      institution?: any;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and loads admin + institution context
 */
export async function jwtAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    let payload: TokenPayload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Load admin from database to ensure they're still active
    const adminResult = await pool.query(
      `SELECT a.*, i.institution_name, i.url_slug, i.is_active as institution_active
       FROM institution_admins a
       JOIN institutions i ON i.id = a.institution_id
       WHERE a.id = $1 AND a.is_active = true`,
      [payload.adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin account not found or inactive',
      });
    }

    const admin = adminResult.rows[0];

    // Check if institution is active
    if (!admin.institution_active) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your institution account is inactive',
      });
    }

    // Attach admin and institution to request
    req.admin = payload;
    req.institution = {
      id: payload.institutionId,
      name: admin.institution_name,
      urlSlug: admin.url_slug,
    };

    // Update last login time
    await pool.query(
      'UPDATE institution_admins SET last_login_at = NOW() WHERE id = $1',
      [payload.adminId]
    );

    next();
  } catch (error) {
    console.error('JWT Auth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Require super_admin role
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires super_admin privileges',
    });
  }
  next();
}
