/**
 * Safety Score Calculator
 *
 * Computes a monthly safety score (0-100) based on incident data and analytics.
 * Higher scores indicate better safety performance.
 *
 * Score Components:
 * - Incident Rate (40%): Fewer incidents = higher score
 * - Severity Score (25%): Lower average severity = higher score
 * - Resolution Rate (20%): More resolved incidents = higher score
 * - Response Time (15%): Faster incident assignment = higher score
 */

import { Pool } from 'pg';

export interface SafetyScoreComponents {
  incident_rate_score: number;      // 0-100, weighted 40%
  severity_score: number;            // 0-100, weighted 25%
  resolution_rate_score: number;     // 0-100, weighted 20%
  response_time_score: number;       // 0-100, weighted 15%

  // Raw metrics for transparency
  raw_metrics: {
    total_incidents: number;
    incidents_per_day: number;
    avg_severity: number | null;
    resolution_rate: number;
    avg_response_hours: number | null;
    resolved_count: number;
    open_count: number;
  };
}

export interface SafetyScoreResult {
  score: number;
  components: SafetyScoreComponents;
  month: string;
  school_id: number | null;
  computed_at: Date;
}

/**
 * Calculate safety score for a given month and optional school
 */
export async function calculateSafetyScore(
  pool: Pool,
  month: string,  // Format: YYYY-MM
  schoolId?: number
): Promise<SafetyScoreResult> {
  // Parse month and calculate date range
  const [year, monthNum] = month.split('-').map(Number);
  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    throw new Error('Invalid month format. Use YYYY-MM');
  }

  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
  const daysInMonth = endDate.getDate();

  // Query incidents for the month
  // Supports both single-school (school_id = null) and multi-school deployments
  const incidentsQuery = `
    SELECT
      COUNT(*) as total_incidents,
      AVG(CASE
        WHEN ai_meta->>'severity' IS NOT NULL
        THEN (ai_meta->>'severity')::decimal
        ELSE NULL
      END) as avg_severity,
      COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END) as resolved_count,
      COUNT(CASE WHEN status IN ('open', 'in_progress') THEN 1 END) as open_count,
      AVG(
        CASE
          WHEN ai_meta->>'assigned_at' IS NOT NULL
          THEN EXTRACT(EPOCH FROM (
            (ai_meta->>'assigned_at')::timestamptz - created_at
          )) / 3600
          ELSE NULL
        END
      ) as avg_response_hours
    FROM incidents
    WHERE created_at >= $1
      AND created_at <= $2
      ${schoolId ? 'AND school_id = $3' : ''}
  `;

  const params = schoolId
    ? [startDate.toISOString(), endDate.toISOString(), schoolId]
    : [startDate.toISOString(), endDate.toISOString()];

  const result = await pool.query(incidentsQuery, params);
  const data = result.rows[0];

  // Extract raw metrics
  const totalIncidents = parseInt(data.total_incidents) || 0;
  const avgSeverity = data.avg_severity ? parseFloat(data.avg_severity) : null;
  const resolvedCount = parseInt(data.resolved_count) || 0;
  const openCount = parseInt(data.open_count) || 0;
  const avgResponseHours = data.avg_response_hours ? parseFloat(data.avg_response_hours) : null;

  const incidentsPerDay = totalIncidents / daysInMonth;
  const resolutionRate = totalIncidents > 0 ? resolvedCount / totalIncidents : 1.0;

  // Calculate component scores
  const components: SafetyScoreComponents = {
    incident_rate_score: calculateIncidentRateScore(incidentsPerDay),
    severity_score: calculateSeverityScore(avgSeverity),
    resolution_rate_score: calculateResolutionRateScore(resolutionRate),
    response_time_score: calculateResponseTimeScore(avgResponseHours),

    raw_metrics: {
      total_incidents: totalIncidents,
      incidents_per_day: parseFloat(incidentsPerDay.toFixed(2)),
      avg_severity: avgSeverity,
      resolution_rate: parseFloat((resolutionRate * 100).toFixed(2)),
      avg_response_hours: avgResponseHours,
      resolved_count: resolvedCount,
      open_count: openCount,
    },
  };

  // Calculate weighted overall score
  const overallScore =
    components.incident_rate_score * 0.40 +
    components.severity_score * 0.25 +
    components.resolution_rate_score * 0.20 +
    components.response_time_score * 0.15;

  return {
    score: parseFloat(overallScore.toFixed(2)),
    components,
    month,
    school_id: schoolId || null,
    computed_at: new Date(),
  };
}

/**
 * Calculate incident rate score (0-100)
 * Fewer incidents per day = higher score
 *
 * Scoring:
 * - 0 incidents/day: 100 points
 * - 0.5 incidents/day: 80 points
 * - 1 incident/day: 60 points
 * - 2 incidents/day: 40 points
 * - 3+ incidents/day: 20 points or lower
 */
function calculateIncidentRateScore(incidentsPerDay: number): number {
  if (incidentsPerDay === 0) return 100;
  if (incidentsPerDay <= 0.5) return 100 - (incidentsPerDay / 0.5) * 20;
  if (incidentsPerDay <= 1) return 80 - ((incidentsPerDay - 0.5) / 0.5) * 20;
  if (incidentsPerDay <= 2) return 60 - ((incidentsPerDay - 1) / 1) * 20;
  if (incidentsPerDay <= 3) return 40 - ((incidentsPerDay - 2) / 1) * 20;

  // Exponential decay for very high incident rates
  return Math.max(0, 20 * Math.exp(-(incidentsPerDay - 3) / 2));
}

/**
 * Calculate severity score (0-100)
 * Lower average severity = higher score
 *
 * Assumes severity is on a scale of 1-10
 * - Severity 1-2: 90-100 points
 * - Severity 3-4: 70-90 points
 * - Severity 5-6: 50-70 points
 * - Severity 7-8: 30-50 points
 * - Severity 9-10: 0-30 points
 */
function calculateSeverityScore(avgSeverity: number | null): number {
  if (avgSeverity === null) {
    // No severity data available - assume neutral score
    return 70;
  }

  // Clamp severity to 1-10 range
  const severity = Math.max(1, Math.min(10, avgSeverity));

  // Linear interpolation: severity 1 = 100, severity 10 = 0
  return Math.max(0, 100 - ((severity - 1) / 9) * 100);
}

/**
 * Calculate resolution rate score (0-100)
 * Higher resolution rate = higher score
 *
 * Scoring:
 * - 100% resolved: 100 points
 * - 80%+ resolved: 80-100 points
 * - 60%+ resolved: 60-80 points
 * - 40%+ resolved: 40-60 points
 * - <40% resolved: 0-40 points
 */
function calculateResolutionRateScore(resolutionRate: number): number {
  return Math.max(0, Math.min(100, resolutionRate * 100));
}

/**
 * Calculate response time score (0-100)
 * Faster response time = higher score
 *
 * Scoring:
 * - <1 hour: 100 points
 * - 1-4 hours: 80-100 points
 * - 4-8 hours: 60-80 points
 * - 8-24 hours: 40-60 points
 * - 24-48 hours: 20-40 points
 * - >48 hours: 0-20 points
 */
function calculateResponseTimeScore(avgResponseHours: number | null): number {
  if (avgResponseHours === null) {
    // No response time data - assume moderate score
    return 60;
  }

  if (avgResponseHours < 1) return 100;
  if (avgResponseHours <= 4) return 100 - ((avgResponseHours - 1) / 3) * 20;
  if (avgResponseHours <= 8) return 80 - ((avgResponseHours - 4) / 4) * 20;
  if (avgResponseHours <= 24) return 60 - ((avgResponseHours - 8) / 16) * 20;
  if (avgResponseHours <= 48) return 40 - ((avgResponseHours - 24) / 24) * 20;

  // Exponential decay for very slow response times
  return Math.max(0, 20 * Math.exp(-(avgResponseHours - 48) / 24));
}

/**
 * Store safety score in database
 */
export async function storeSafetyScore(
  pool: Pool,
  scoreResult: SafetyScoreResult
): Promise<void> {
  // Convert month string to first day of month for database
  const [year, monthNum] = scoreResult.month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);

  const query = `
    INSERT INTO analytics.safety_scores
      (school_id, month, score, components, metadata, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (school_id, month)
    DO UPDATE SET
      score = EXCLUDED.score,
      components = EXCLUDED.components,
      metadata = EXCLUDED.metadata,
      computed_at = EXCLUDED.computed_at
    RETURNING id
  `;

  const metadata = {
    algorithm_version: '1.0',
    weights: {
      incident_rate: 0.40,
      severity: 0.25,
      resolution_rate: 0.20,
      response_time: 0.15,
    },
  };

  await pool.query(query, [
    scoreResult.school_id,
    monthDate,
    scoreResult.score,
    JSON.stringify(scoreResult.components),
    JSON.stringify(metadata),
    scoreResult.computed_at,
  ]);
}
