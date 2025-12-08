import { Request, Response, NextFunction } from 'express';

/**
 * Centralized Error Handling Middleware
 * 
 * Sanitizes all error responses to prevent information disclosure while maintaining
 * proper logging for debugging. Ensures no stack traces, database errors, or
 * internal system details are exposed to clients.
 * 
 * SECURITY FEATURES:
 * - Sanitizes stack traces and internal errors
 * - Redacts database connection strings and credentials
 * - Prevents SQL injection error leakage
 * - Maintains detailed server-side logging
 * - Consistent error response format
 */

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(error: any): string {
  if (!error || !error.message) return 'Internal server error';

  const message = error.message;
  
  // Remove common sensitive patterns
  const sanitized = message
    .replace(/password[=:\s]+[^\s]*/gi, 'password=[REDACTED]')
    .replace(/token[=:\s]+[^\s]*/gi, 'token=[REDACTED]')
    .replace(/key[=:\s]+[^\s]*/gi, 'key=[REDACTED]')
    .replace(/secret[=:\s]+[^\s]*/gi, 'secret=[REDACTED]')
    .replace(/connectionstring[=:\s]+[^\s]*/gi, 'connectionstring=[REDACTED]')
    .replace(/host[=:\s]+[^\s@]*@[^\s]*/gi, 'host=[REDACTED]')
    .replace(/\/\/(.*?)@/g, '//[REDACTED]@')
    .replace(/postgres:\/\/.*?@/g, 'postgres://[REDACTED]@')
    .replace(/file:\/\/.*?([^\/\s]+)$/g, 'file://[REDACTED]/$1');

  // Remove file paths that might contain sensitive information
  const pathSanitized = sanitized.replace(/\/Users\/[^\/\s]+/g, '/[USER]')
                                  .replace(/\/home\/[^\/\s]+/g, '/[USER]')
                                  .replace(/C:\\Users\\[^\\]+/g, 'C:\\[USER]');

  return pathSanitized;
}

/**
 * Determine if error details should be exposed based on environment
 */
function shouldExposeErrorDetails(): boolean {
  const nodeEnv = process.env.NODE_ENV;
  return nodeEnv === 'development' || nodeEnv === 'test';
}

/**
 * Generate client-safe error response
 */
function createErrorResponse(
  error: AppError,
  req: Request
): ErrorResponse {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;
  
  // Default safe error response
  let clientMessage = 'An error occurred while processing your request';
  let statusCode = error.statusCode || 500;

  // Handle specific error types with safe messages
  if (error.code === 'ECONNREFUSED') {
    clientMessage = 'Service temporarily unavailable';
    statusCode = 503;
  } else if (error.code === '23505') { // PostgreSQL unique violation
    clientMessage = 'A record with this information already exists';
    statusCode = 409;
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    clientMessage = 'Cannot complete operation due to data dependencies';
    statusCode = 400;
  } else if (error.code === '23502') { // PostgreSQL not null violation
    clientMessage = 'Required information is missing';
    statusCode = 400;
  } else if (error.message?.includes('jwt')) {
    clientMessage = 'Authentication failed';
    statusCode = 401;
  } else if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
    clientMessage = 'Access denied';
    statusCode = statusCode < 400 ? 403 : statusCode;
  } else if (error.isOperational) {
    // Application-level errors that are safe to expose
    clientMessage = sanitizeErrorMessage(error);
  }

  // In development, provide more detail (but still sanitized)
  if (shouldExposeErrorDetails() && !error.isOperational) {
    clientMessage = sanitizeErrorMessage(error);
  }

  return {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Client Error',
    message: clientMessage,
    timestamp,
    path,
    requestId: req.headers['x-request-id'] as string,
  };
}

/**
 * Log error details for server-side debugging
 */
function logError(error: AppError, req: Request) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const authMethod = (req as any).authMethod || 'none';
  const adminId = (req as any).admin?.adminId || 'none';
  const institutionId = (req as any).admin?.institutionId || 'none';

  console.error('╔══════════════════════════════════════════════════════════════');
  console.error('║ APPLICATION ERROR');
  console.error('╠══════════════════════════════════════════════════════════════');
  console.error(`║ Timestamp: ${timestamp}`);
  console.error(`║ Path: ${method} ${path}`);
  console.error(`║ Status Code: ${error.statusCode || 500}`);
  console.error(`║ Error Code: ${error.code || 'N/A'}`);
  console.error(`║ Auth: ${authMethod} (Admin: ${adminId}, Institution: ${institutionId})`);
  console.error(`║ Client: ${ip} - ${userAgent}`);
  console.error('╠══════════════════════════════════════════════════════════════');
  console.error(`║ Error Message: ${error.message || 'No message'}`);
  if (error.stack) {
    console.error('║ Stack Trace:');
    error.stack.split('\n').forEach(line => {
      console.error(`║   ${line}`);
    });
  }
  console.error('╚══════════════════════════════════════════════════════════════');
}

/**
 * Express error handling middleware
 * Must be placed after all routes and other middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log detailed error for debugging
  logError(error, req);

  // Create safe client response
  const errorResponse = createErrorResponse(error, req);
  const statusCode = error.statusCode || 500;

  // Send sanitized response to client
  res.status(statusCode).json(errorResponse);
}

/**
 * Create an operational error (safe to expose to client)
 */
export function createOperationalError(
  message: string,
  statusCode: number = 400
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}