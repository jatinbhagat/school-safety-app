import { Request, Response, NextFunction } from 'express';

/**
 * Staff authentication middleware
 * Validates X-STAFF-TOKEN header against STAFF_TOKEN env variable
 */
export function staffAuth(req: Request, res: Response, next: NextFunction) {
  const staffToken = process.env.STAFF_TOKEN;

  if (!staffToken) {
    console.error('STAFF_TOKEN environment variable is not set');
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Staff authentication is not configured',
    });
  }

  const providedToken = req.headers['x-staff-token'];

  if (!providedToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-STAFF-TOKEN header',
    });
  }

  if (providedToken !== staffToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid staff token',
    });
  }

  next();
}
