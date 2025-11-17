/**
 * GET /admin/safety-score
 *
 * Returns the monthly safety score for a school (or all schools if no school_id provided)
 *
 * Query Parameters:
 * - month: YYYY-MM format (required)
 * - school_id: Integer (optional)
 * - store: Boolean - whether to store the computed score in database (optional, default: false)
 */

import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';
import { calculateSafetyScore, storeSafetyScore } from '../score/calc_safety_score';

export async function getSafetyScore(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    // Parse and validate query parameters
    const { month, school_id, store } = req.query;

    // Validate month parameter (required)
    if (!month || typeof month !== 'string') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Query parameter "month" is required and must be in YYYY-MM format',
        request_id: requestId,
      });
      return;
    }

    // Validate month format
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(month)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Query parameter "month" must be in YYYY-MM format (e.g., 2024-03)',
        request_id: requestId,
      });
      return;
    }

    // Parse school_id if provided
    let schoolId: number | undefined;
    if (school_id) {
      const parsedSchoolId = parseInt(school_id as string, 10);
      if (isNaN(parsedSchoolId)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Query parameter "school_id" must be a valid integer',
          request_id: requestId,
        });
        return;
      }
      schoolId = parsedSchoolId;
    }

    // Parse store flag
    const shouldStore = store === 'true';

    // Calculate safety score
    console.log(`[${requestId}] Calculating safety score for month=${month}, school_id=${schoolId || 'all'}`);

    const scoreResult = await calculateSafetyScore(pool, month, schoolId);

    // Optionally store in database
    if (shouldStore) {
      console.log(`[${requestId}] Storing safety score in database`);
      await storeSafetyScore(pool, scoreResult);
    }

    // Return the result
    res.status(200).json({
      score: scoreResult.score,
      components: scoreResult.components,
      month: scoreResult.month,
      school_id: scoreResult.school_id,
      computed_at: scoreResult.computed_at,
      request_id: requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error calculating safety score:`, error);

    // Handle specific error types
    if (error.message && error.message.includes('Invalid month format')) {
      res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        request_id: requestId,
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate safety score',
      request_id: requestId,
    });
  }
}
