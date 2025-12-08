import { Pool, PoolClient } from 'pg';
import { pool } from '../db';

/**
 * Database Transaction Utility
 * 
 * Provides standardized transaction management for critical database operations.
 * Ensures consistent error handling, rollback on failures, and connection cleanup.
 * 
 * SAFETY NOTES:
 * - All database write operations should use transactions
 * - Automatic rollback on any error
 * - Connection pool management with timeout protection
 * - Logging for audit and debugging
 */

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Execute a function within a database transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
  operationName?: string
): Promise<TransactionResult<T>> {
  const client = await pool.connect();
  const startTime = Date.now();
  const opName = operationName || 'unknown';

  try {
    await client.query('BEGIN');
    console.log(`[DB_TRANSACTION] Started: ${opName}`);

    const result = await operation(client);
    
    await client.query('COMMIT');
    const duration = Date.now() - startTime;
    console.log(`[DB_TRANSACTION] Committed: ${opName} (${duration}ms)`);

    return {
      success: true,
      data: result,
    };

  } catch (error) {
    await client.query('ROLLBACK');
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[DB_TRANSACTION] Rolled back: ${opName} (${duration}ms) - ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };

  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries in a single transaction
 * Useful for batch operations that must all succeed or fail together
 */
export async function withBatchTransaction(
  queries: Array<{ query: string; params?: any[]; description?: string }>,
  operationName?: string
): Promise<TransactionResult<any[]>> {
  return withTransaction(async (client) => {
    const results: any[] = [];
    
    for (const { query, params, description } of queries) {
      const queryName = description || query.substring(0, 50) + '...';
      console.log(`[DB_BATCH] Executing: ${queryName}`);
      
      const result = await client.query(query, params);
      results.push(result);
    }
    
    return results;
  }, operationName || 'batch_operation');
}

/**
 * Safe query execution with automatic error handling
 * For read-only operations that don't require transactions
 */
export async function safeQuery(
  query: string, 
  params?: any[], 
  queryName?: string
): Promise<TransactionResult<any>> {
  const startTime = Date.now();
  const qName = queryName || 'query';
  
  try {
    console.log(`[DB_QUERY] Starting: ${qName}`);
    const result = await pool.query(query, params);
    
    const duration = Date.now() - startTime;
    console.log(`[DB_QUERY] Completed: ${qName} (${duration}ms) - ${result.rowCount} rows`);
    
    return {
      success: true,
      data: result,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[DB_QUERY] Failed: ${qName} (${duration}ms) - ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate connection pool health
 * Used for monitoring and health checks
 */
export async function validateConnectionPool(): Promise<{
  healthy: boolean;
  totalConnections?: number;
  idleConnections?: number;
  waitingConnections?: number;
  error?: string;
}> {
  try {
    // Test a simple query
    const result = await pool.query('SELECT 1 as test');
    
    return {
      healthy: true,
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingConnections: pool.waitingCount,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      healthy: false,
      error: errorMessage,
    };
  }
}