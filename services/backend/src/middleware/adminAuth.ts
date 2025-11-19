import { Request, Response, NextFunction } from 'express';

/**
 * Admin authentication middleware
 * Validates X-ADMIN-TOKEN header against ADMIN_TOKEN env variable
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.error('ADMIN_TOKEN environment variable is not set');
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Admin authentication is not configured',
    });
  }

  const providedToken = req.headers['x-admin-token'];

  if (!providedToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-ADMIN-TOKEN header',
    });
  }

  if (providedToken !== adminToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid admin token',
    });
  }

  next();
}
