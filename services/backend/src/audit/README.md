# AI Audit Logging

This module provides comprehensive audit logging for all AI/ML API calls in the school safety application.

## Purpose

The AI audit logging system tracks:
- **Compliance**: Audit trail for regulatory requirements
- **Cost tracking**: Token usage and API costs
- **Performance monitoring**: Latency and error rates
- **Debugging**: Investigation of AI decisions
- **Security**: Detection of prompt injection or abuse

## Database Schema

The `ai_audit_logs` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `incident_id` | INTEGER | Foreign key to incidents table |
| `model` | VARCHAR(100) | AI model name (e.g., 'gpt-3.5-turbo') |
| `prompt_hash` | VARCHAR(64) | SHA-256 hash of prompt (privacy) |
| `output_json` | JSONB | Structured AI response |
| `token_count` | INTEGER | Tokens used (for cost tracking) |
| `latency_ms` | INTEGER | API response time |
| `error` | TEXT | Error message (if call failed) |
| `created_at` | TIMESTAMPTZ | Timestamp |

**Note**: Prompts are hashed (not stored) for privacy. The hash allows detecting duplicate prompts without storing sensitive data.

## Usage

### TypeScript (Backend/Routing)

```typescript
import { logAIOutput } from './audit/log_ai_output';

// Example: Logging an AI API call
const startTime = Date.now();
const prompt = "Analyze this incident: ...";

try {
  const response = await openai.createCompletion({
    model: 'gpt-3.5-turbo',
    prompt: prompt,
    max_tokens: 200
  });

  const latency = Date.now() - startTime;

  // Log successful call
  await logAIOutput({
    incident_id: incident.id,
    model: 'gpt-3.5-turbo',
    prompt: prompt,
    output_json: response.data,
    token_count: response.usage?.total_tokens,
    latency_ms: latency
  });

  return response.data;
} catch (error) {
  const latency = Date.now() - startTime;

  // Log failed call
  await logAIOutput({
    incident_id: incident.id,
    model: 'gpt-3.5-turbo',
    prompt: prompt,
    output_json: {},
    latency_ms: latency,
    error: error.message
  });

  throw error;
}
```

### Python (Triage Worker)

The triage worker (`services/triage/triage_worker.py`) automatically logs all OpenAI API calls:

```python
from triage_worker import log_ai_audit

# Logging is integrated into analyze_incident_with_ai()
# It automatically captures:
# - Successful calls with token usage and latency
# - Failed calls with error messages
```

## API Functions

### `logAIOutput(entry: AIAuditLogEntry): Promise<number>`

Logs an AI API call to the database.

**Parameters:**
- `incident_id` (required): Incident ID
- `model` (required): AI model name
- `prompt` (required): The prompt sent to AI
- `output_json` (required): AI response as JSON
- `token_count` (optional): Token usage
- `latency_ms` (optional): Response time
- `error` (optional): Error message if call failed

**Returns:** The audit log ID, or -1 if logging failed

### `getAuditLogsForIncident(incident_id: number)`

Retrieves all AI audit logs for a specific incident.

### `getAIUsageStats(startDate?, endDate?)`

Gets aggregate AI usage statistics:
- Total API calls
- Total tokens used
- Average latency
- Calls by model
- Error count

## Migration

Run the migration to create the table:

```bash
psql $DATABASE_URL < services/backend/migrations/006_create_ai_audit_logs.sql
```

## Querying Audit Logs

### Get logs for an incident
```sql
SELECT * FROM ai_audit_logs WHERE incident_id = 123 ORDER BY created_at DESC;
```

### Cost analysis by model
```sql
SELECT
  model,
  COUNT(*) as call_count,
  SUM(token_count) as total_tokens,
  AVG(latency_ms) as avg_latency_ms
FROM ai_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY model
ORDER BY total_tokens DESC;
```

### Error rate analysis
```sql
SELECT
  model,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as errors,
  ROUND(100.0 * COUNT(CASE WHEN error IS NOT NULL THEN 1 END) / COUNT(*), 2) as error_rate
FROM ai_audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY model;
```

### Detect duplicate prompts
```sql
SELECT
  prompt_hash,
  COUNT(*) as usage_count,
  model,
  MIN(created_at) as first_used,
  MAX(created_at) as last_used
FROM ai_audit_logs
GROUP BY prompt_hash, model
HAVING COUNT(*) > 5
ORDER BY usage_count DESC;
```

## Privacy & Security

- **Prompt hashing**: Prompts are hashed with SHA-256, not stored in plaintext
- **Output storage**: AI responses are stored as JSONB for analysis
- **No PII**: Ensure prompts don't contain student PII beyond what's necessary
- **Retention**: Consider implementing log rotation/archiving policies

## Performance

- Audit logging failures are non-blocking (logged but don't throw errors)
- Indexes on `incident_id`, `model`, and `created_at` for fast queries
- JSONB output allows flexible querying without schema changes

## Future Enhancements

- [ ] Add support for different AI providers (Anthropic, Azure OpenAI)
- [ ] Cost calculation based on model pricing
- [ ] Automated alerts for high error rates
- [ ] Dashboard for real-time AI usage monitoring
- [ ] Log retention policies and archiving
