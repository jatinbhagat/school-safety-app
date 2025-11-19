import { pool } from '../db';
import { createHash } from 'crypto';

/**
 * AI Audit Log Entry
 */
export interface AIAuditLogEntry {
  incident_id: number;
  model: string;                    // e.g., 'gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet'
  prompt: string;                   // The prompt sent to the AI
  output_json: Record<string, any>; // The AI's response
  token_count?: number;             // Optional: token usage
  latency_ms?: number;              // Optional: response time
  error?: string;                   // Optional: error message if AI call failed
}

/**
 * Generate a SHA-256 hash of a prompt for privacy and storage efficiency
 * @param prompt The prompt text to hash
 * @returns Hexadecimal hash string
 */
export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt, 'utf8').digest('hex');
}

/**
 * Log an AI API call to the audit table
 *
 * This function captures AI interactions for:
 * - Audit trail and compliance
 * - Cost tracking and token usage analysis
 * - Model performance evaluation
 * - Debugging and incident investigation
 *
 * @param entry The AI audit log entry
 * @returns The ID of the created audit log entry
 */
export async function logAIOutput(entry: AIAuditLogEntry): Promise<number> {
  const {
    incident_id,
    model,
    prompt,
    output_json,
    token_count,
    latency_ms,
    error,
  } = entry;

  // Generate prompt hash for privacy and efficiency
  const prompt_hash = hashPrompt(prompt);

  const query = `
    INSERT INTO ai_audit_logs (
      incident_id,
      model,
      prompt_hash,
      output_json,
      token_count,
      latency_ms,
      error
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  const values = [
    incident_id,
    model,
    prompt_hash,
    JSON.stringify(output_json),
    token_count || null,
    latency_ms || null,
    error || null,
  ];

  try {
    const result = await pool.query(query, values);
    const logId = result.rows[0].id;

    console.log(
      `AI audit log created: id=${logId}, incident=${incident_id}, model=${model}, ` +
      `tokens=${token_count || 'N/A'}, latency=${latency_ms || 'N/A'}ms`
    );

    return logId;
  } catch (dbError) {
    console.error('Failed to write AI audit log:', dbError);
    // Don't throw - we don't want audit logging failures to break the main flow
    // But log the error so it can be investigated
    return -1;
  }
}

/**
 * Retrieve audit logs for a specific incident
 * @param incident_id The incident ID
 * @returns Array of audit log entries
 */
export async function getAuditLogsForIncident(incident_id: number) {
  const query = `
    SELECT
      id,
      incident_id,
      model,
      prompt_hash,
      output_json,
      token_count,
      latency_ms,
      error,
      created_at
    FROM ai_audit_logs
    WHERE incident_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [incident_id]);
  return result.rows;
}

/**
 * Get aggregate statistics for AI usage
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 * @returns Usage statistics
 */
export async function getAIUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_calls: number;
  total_tokens: number;
  avg_latency_ms: number;
  calls_by_model: Record<string, number>;
  error_count: number;
}> {
  let query = `
    SELECT
      COUNT(*) as total_calls,
      COALESCE(SUM(token_count), 0) as total_tokens,
      COALESCE(AVG(latency_ms), 0) as avg_latency_ms,
      COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count,
      model,
      COUNT(*) as model_count
    FROM ai_audit_logs
  `;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    values.push(endDate);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY model';

  const result = await pool.query(query, values);

  // Aggregate results
  let total_calls = 0;
  let total_tokens = 0;
  let total_latency = 0;
  let error_count = 0;
  const calls_by_model: Record<string, number> = {};

  for (const row of result.rows) {
    total_calls += parseInt(row.total_calls);
    total_tokens += parseInt(row.total_tokens);
    total_latency += parseFloat(row.avg_latency_ms) * parseInt(row.model_count);
    error_count += parseInt(row.error_count);
    calls_by_model[row.model] = parseInt(row.model_count);
  }

  return {
    total_calls,
    total_tokens,
    avg_latency_ms: total_calls > 0 ? total_latency / total_calls : 0,
    calls_by_model,
    error_count,
  };
}
