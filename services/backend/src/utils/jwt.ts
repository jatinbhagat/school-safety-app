import jwt, { SignOptions } from 'jsonwebtoken';

// Production-grade JWT secret validation
function validateJWTSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  
  // In production, JWT_SECRET is mandatory
  if (nodeEnv === 'production' && (!jwtSecret || jwtSecret === 'dev-secret-change-in-production')) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required in production and cannot use development default');
  }
  
  // Development fallback (preserved for local development)
  if (!jwtSecret && nodeEnv !== 'production') {
    console.warn('WARNING: Using development JWT secret. Set JWT_SECRET environment variable for production.');
    return 'dev-secret-change-in-production';
  }
  
  return jwtSecret!;
}

const JWT_SECRET = validateJWTSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  adminId: number;
  institutionId: number;
  email: string;
  role: string;
}

/**
 * Generate JWT token for authenticated admin
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate a random verification token (for email verification, password reset)
 */
export function generateVerificationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}
