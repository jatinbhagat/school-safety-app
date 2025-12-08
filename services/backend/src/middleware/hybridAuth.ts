import { Request, Response, NextFunction } from 'express';
import { jwtAuth } from './jwtAuth';
import { staffAuth } from './staffAuth';

/**
 * Hybrid Authentication Middleware
 * 
 * Provides backward compatibility between staffAuth and jwtAuth while adding safety:
 * - Preserves existing functionality for both auth methods
 * - Prevents authorization bypass by validating both methods properly
 * - Logs auth method used for monitoring
 * - Fails securely if neither auth method succeeds
 */
export function hybridAuth(req: Request, res: Response, next: NextFunction) {
  // Check if JWT auth is present (Bearer token)
  const authHeader = req.headers.authorization;
  const hasJWTAuth = authHeader && authHeader.startsWith('Bearer ');
  
  // Check if staff token is present
  const staffToken = req.headers['x-staff-token'];
  const hasStaffAuth = !!staffToken;

  // Log auth method being used for monitoring
  const authMethod = hasJWTAuth ? 'JWT' : hasStaffAuth ? 'STAFF' : 'NONE';
  console.log(`Auth Method: ${authMethod} for ${req.method} ${req.path}`);

  // If JWT token is present, use jwtAuth (modern method)
  if (hasJWTAuth) {
    return jwtAuth(req, res, (error?: any) => {
      if (error) {
        // JWT failed, do not fallback to staff auth for security
        return next(error);
      }
      // JWT succeeded, attach auth method for audit
      req.authMethod = 'JWT';
      next();
    });
  }

  // If staff token is present, use staffAuth (legacy method)
  if (hasStaffAuth) {
    return staffAuth(req, res, (error?: any) => {
      if (error) {
        return next(error);
      }
      // Staff auth succeeded, attach auth method for audit
      req.authMethod = 'STAFF';
      next();
    });
  }

  // No authentication method provided
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Authentication required. Provide either Authorization: Bearer <token> or X-STAFF-TOKEN header.',
  });
}

// Extend Express Request type for auth method tracking
declare global {
  namespace Express {
    interface Request {
      authMethod?: 'JWT' | 'STAFF';
    }
  }
}