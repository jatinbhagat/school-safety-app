# Triage Worker

AI-powered incident triage service that automatically analyzes and categorizes school safety incidents.

## Overview

The triage worker processes incidents in the database that haven't been analyzed yet (where `ai_meta` is null) and enriches them with AI-generated metadata including:

- **ai_category**: Categorization (violence/bullying/mental_health/substance/other)
- **urgency_score**: Numerical urgency rating (1-10)
- **risk_level**: Risk assessment (low/medium/high/critical)
- **ai_summary**: Brief summary of the incident

## Prerequisites

- Python 3.8 or higher
- PostgreSQL database with incidents table
- OpenAI API key

## Setup

1. **Install dependencies:**

```bash
cd services/triage
pip install -r requirements.txt
```

2. **Configure environment variables:**

Create a `.env` file in the `services/triage` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace the values with your actual database connection string and OpenAI API key.

## Usage

### Run Once (Process all pending incidents and exit)

```bash
python triage_worker.py --once
```

This mode:
- Processes all incidents where `ai_meta` is null
- Exits after completing the batch
- Useful for manual runs or scheduled jobs (e.g., cron)

### Run Continuously (Loop mode)

```bash
python triage_worker.py
```

This mode:
- Runs continuously in a loop
- Checks for new untriaged incidents every 30 seconds
- Useful for long-running background worker
- Press Ctrl+C to stop gracefully

## How It Works

1. **Query**: Fetches incidents from the database where `ai_meta IS NULL`
2. **Analyze**: For each incident, sends category, description, and class info to OpenAI
3. **Update**: Stores the AI-generated analysis in the `ai_meta` JSONB field
4. **Repeat**: In loop mode, waits 30 seconds and checks for new incidents

## Token Usage

The worker is optimized to keep OpenAI token usage under 200 tokens per incident by:
- Using concise prompts
- Requesting structured JSON responses only
- Setting `max_tokens=200` in the API call
- Using GPT-3.5-turbo model for cost efficiency

## Error Handling

The worker includes comprehensive error handling:
- Database connection failures
- API request timeouts
- JSON parsing errors
- Missing environment variables

Errors are logged to stdout with descriptive messages, and the worker continues processing remaining incidents.

## Example Output

```
Triage Worker started...
Mode: Single run

Found 3 untriaged incident(s)

Processing incident #42...
✓ Successfully triaged incident #42
  Category: bullying
  Urgency: 7/10
  Risk: high

Processing incident #43...
✓ Successfully triaged incident #43
  Category: mental_health
  Urgency: 8/10
  Risk: high

Processing incident #44...
✓ Successfully triaged incident #44
  Category: substance
  Urgency: 6/10
  Risk: medium

Single run completed. Exiting.
Triage Worker stopped.
```

## Database Schema

The worker expects the following `incidents` table structure:

```sql
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT,
    class_section TEXT,
    ai_meta JSONB,
    -- other fields...
);
```

## Future Enhancements

- Support for Claude API as an alternative to OpenAI
- Configurable check intervals
- Batch processing limits
- Metrics and monitoring
- Async/parallel processing for higher throughput
