# Multi-School Deployment Guide

This guide explains how to configure and use the School Safety App for multiple schools.

## Overview

The system supports both single-school and multi-school deployments:
- **Single-school**: All incidents belong to one school (school_id can be null)
- **Multi-school**: Each incident is tagged with a school_id for proper segmentation

## Database Setup

### 1. Run Migration 004

This migration adds `school_id` to the incidents table:

```bash
cd services/backend

# Option A: Run all migrations
./scripts/run-migrations.sh

# Option B: Run only migration 004
psql $DATABASE_URL -f migrations/004_add_school_id_to_incidents.sql
```

**What this migration does:**
- Adds `school_id` column to incidents (nullable for backward compatibility)
- Creates indexes for efficient querying by school
- Maintains compatibility with existing data

### 2. Verify Migration

```bash
psql $DATABASE_URL -c "\d incidents"
```

You should see `school_id` column in the table structure.

## Multi-School Configuration

### Option 1: Simple Multi-School (No Schools Table)

Just use integer IDs to represent different schools:

```bash
# School 1 = Lincoln High
# School 2 = Washington Elementary
# School 3 = Roosevelt Middle School
# etc.
```

**Create test incidents for different schools:**

```sql
-- Lincoln High (school_id = 1)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
VALUES
  ('bullying', 'Incident at Lincoln High', 1, 'resolved',
   '{"severity": 4, "assigned_at": "2024-11-15T10:00:00Z"}',
   '2024-11-15T09:00:00Z'),
  ('vandalism', 'Another incident at Lincoln', 1, 'open',
   '{"severity": 6}',
   '2024-11-16T14:00:00Z');

-- Washington Elementary (school_id = 2)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
VALUES
  ('harassment', 'Incident at Washington Elementary', 2, 'resolved',
   '{"severity": 3, "assigned_at": "2024-11-15T11:00:00Z"}',
   '2024-11-15T10:00:00Z'),
  ('bullying', 'Another incident at Washington', 2, 'in_progress',
   '{"severity": 5, "assigned_at": "2024-11-16T09:00:00Z"}',
   '2024-11-16T08:00:00Z');

-- Roosevelt Middle School (school_id = 3)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
VALUES
  ('vandalism', 'Incident at Roosevelt', 3, 'closed',
   '{"severity": 2, "assigned_at": "2024-11-14T15:00:00Z"}',
   '2024-11-14T14:00:00Z');
```

### Option 2: Full Multi-School with Schools Table (Recommended for Production)

Create a proper schools table for better data management:

```sql
-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add some schools
INSERT INTO schools (name, code, district) VALUES
  ('Lincoln High School', 'LHS', 'Central District'),
  ('Washington Elementary', 'WES', 'North District'),
  ('Roosevelt Middle School', 'RMS', 'South District');

-- Add foreign key constraint to incidents
ALTER TABLE incidents
ADD CONSTRAINT fk_incidents_school
FOREIGN KEY (school_id) REFERENCES schools(id)
ON DELETE SET NULL;

-- Create index on schools
CREATE INDEX idx_schools_code ON schools(code);
```

## API Usage for Multi-School

### Get Safety Score for Specific School

```bash
# Get score for Lincoln High (school_id = 1)
curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=1" \
  -H "X-ADMIN-TOKEN: your-admin-token"

# Get score for Washington Elementary (school_id = 2)
curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=2" \
  -H "X-ADMIN-TOKEN: your-admin-token"
```

### Get Safety Score Across All Schools

```bash
# Omit school_id to get aggregate score across all schools
curl "http://localhost:3001/admin/safety-score?month=2024-11" \
  -H "X-ADMIN-TOKEN: your-admin-token"
```

### Store Scores for All Schools

```bash
# Loop through schools and store their scores
for school_id in 1 2 3; do
  echo "Computing safety score for school $school_id..."
  curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=$school_id&store=true" \
    -H "X-ADMIN-TOKEN: your-admin-token"
  echo ""
done
```

## Testing Multi-School Functionality

### 1. Create Test Data for Multiple Schools

```bash
psql $DATABASE_URL <<EOF
-- Clear existing test data (optional)
TRUNCATE incidents CASCADE;

-- Add incidents for School 1 (Good performance)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
SELECT
  (ARRAY['bullying', 'harassment', 'vandalism'])[floor(random() * 3 + 1)],
  'Test incident for School 1',
  1,
  (ARRAY['resolved', 'closed'])[floor(random() * 2 + 1)],
  jsonb_build_object(
    'severity', floor(random() * 3 + 1),
    'assigned_at', (NOW() - (random() * interval '2 hours'))::text
  ),
  NOW() - (random() * interval '25 days')
FROM generate_series(1, 5);

-- Add incidents for School 2 (Medium performance)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
SELECT
  (ARRAY['bullying', 'harassment', 'vandalism', 'theft'])[floor(random() * 4 + 1)],
  'Test incident for School 2',
  2,
  (ARRAY['open', 'in_progress', 'resolved'])[floor(random() * 3 + 1)],
  jsonb_build_object(
    'severity', floor(random() * 5 + 3),
    'assigned_at', CASE
      WHEN random() > 0.3 THEN (NOW() - (random() * interval '12 hours'))::text
      ELSE NULL
    END
  ),
  NOW() - (random() * interval '25 days')
FROM generate_series(1, 15);

-- Add incidents for School 3 (Poor performance)
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at)
SELECT
  (ARRAY['bullying', 'harassment', 'vandalism', 'theft', 'violence'])[floor(random() * 5 + 1)],
  'Test incident for School 3',
  3,
  (ARRAY['open', 'in_progress'])[floor(random() * 2 + 1)],
  jsonb_build_object(
    'severity', floor(random() * 3 + 7),
    'assigned_at', CASE
      WHEN random() > 0.6 THEN (NOW() - (random() * interval '72 hours'))::text
      ELSE NULL
    END
  ),
  NOW() - (random() * interval '25 days')
FROM generate_series(1, 30);

-- Show summary
SELECT
  school_id,
  COUNT(*) as total_incidents,
  AVG((ai_meta->>'severity')::decimal) as avg_severity,
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) * 100.0 / COUNT(*) as resolution_rate
FROM incidents
WHERE school_id IS NOT NULL
GROUP BY school_id
ORDER BY school_id;
EOF
```

### 2. Test Each School's Score

```bash
# School 1 (should have high score - few incidents, resolved quickly)
curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=1" \
  -H "X-ADMIN-TOKEN: admin-token-12345" | jq

# School 2 (should have medium score)
curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=2" \
  -H "X-ADMIN-TOKEN: admin-token-12345" | jq

# School 3 (should have lower score - many incidents, high severity)
curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=3" \
  -H "X-ADMIN-TOKEN: admin-token-12345" | jq

# All schools aggregate
curl "http://localhost:3001/admin/safety-score?month=2024-11" \
  -H "X-ADMIN-TOKEN: admin-token-12345" | jq
```

### 3. Store and Verify Scores

```bash
# Store scores for all schools
for school_id in 1 2 3; do
  curl "http://localhost:3001/admin/safety-score?month=2024-11&school_id=$school_id&store=true" \
    -H "X-ADMIN-TOKEN: admin-token-12345"
done

# Verify stored scores
psql $DATABASE_URL -c "
  SELECT
    school_id,
    month,
    score,
    components->>'raw_metrics' as metrics,
    computed_at
  FROM analytics.safety_scores
  ORDER BY school_id;
"
```

## Querying Multi-School Data

### Get Scores for All Schools

```sql
SELECT
  s.school_id,
  s.month,
  s.score,
  s.components->'raw_metrics'->>'total_incidents' as total_incidents,
  s.components->'raw_metrics'->>'resolution_rate' as resolution_rate,
  s.components->'incident_rate_score' as incident_rate_score,
  s.components->'severity_score' as severity_score
FROM analytics.safety_scores s
WHERE s.month = '2024-11-01'
ORDER BY s.score DESC;
```

### Compare Schools Over Time

```sql
SELECT
  school_id,
  month,
  score,
  LAG(score) OVER (PARTITION BY school_id ORDER BY month) as prev_month_score,
  score - LAG(score) OVER (PARTITION BY school_id ORDER BY month) as score_change
FROM analytics.safety_scores
WHERE school_id IN (1, 2, 3)
ORDER BY school_id, month DESC;
```

### School Rankings

```sql
SELECT
  school_id,
  score,
  RANK() OVER (ORDER BY score DESC) as rank,
  components->'raw_metrics'->>'total_incidents' as incidents
FROM analytics.safety_scores
WHERE month = '2024-11-01'
ORDER BY rank;
```

## Backfilling Existing Data

If you have existing incidents without school_id, you can backfill them:

```sql
-- Option 1: Assign all existing incidents to school 1
UPDATE incidents
SET school_id = 1
WHERE school_id IS NULL;

-- Option 2: Assign based on class_section pattern
UPDATE incidents
SET school_id = CASE
  WHEN class_section LIKE 'LHS-%' THEN 1
  WHEN class_section LIKE 'WES-%' THEN 2
  WHEN class_section LIKE 'RMS-%' THEN 3
  ELSE 1  -- Default school
END
WHERE school_id IS NULL;
```

## Frontend Integration

When submitting incidents from the frontend, include school_id:

```javascript
// Submit incident with school_id
const response = await fetch('http://localhost:3001/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'bullying',
    description: 'Incident description',
    class_section: 'Grade 10A',
    school_id: 1  // Add this field
  })
});
```

## Security Considerations

For multi-tenant deployments:

1. **Add Row-Level Security (RLS)**
   ```sql
   ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

   CREATE POLICY school_isolation ON incidents
     FOR ALL
     USING (school_id = current_setting('app.current_school_id')::integer);
   ```

2. **Middleware for School Context**
   ```typescript
   // Add middleware to set school context from auth token
   app.use((req, res, next) => {
     const schoolId = extractSchoolFromToken(req.headers.authorization);
     req.schoolId = schoolId;
     next();
   });
   ```

3. **Validate School Access**
   ```typescript
   // Ensure users can only access their school's data
   if (req.query.school_id && req.query.school_id !== req.schoolId) {
     return res.status(403).json({ error: 'Access denied' });
   }
   ```

## Performance Optimization

For large multi-school deployments:

1. **Partition Tables by School**
   ```sql
   CREATE TABLE incidents_partitioned (LIKE incidents INCLUDING ALL)
   PARTITION BY LIST (school_id);

   CREATE TABLE incidents_school_1 PARTITION OF incidents_partitioned
     FOR VALUES IN (1);
   ```

2. **Cache Safety Scores**
   - Use Redis to cache computed scores
   - Set TTL to 1 hour for frequently accessed schools

3. **Batch Processing**
   - Compute scores for all schools nightly
   - Use background jobs for historical backfills

## Troubleshooting

**Scores are identical for all schools:**
- Verify incidents have different school_id values
- Check that school_id parameter is being passed correctly

**No data returned for specific school:**
- Ensure incidents exist for that school_id
- Check date range covers the incidents' created_at timestamps

**Foreign key constraint errors:**
- Make sure school_id references exist in schools table (if using FK)
- Or remove FK constraint for simple deployments
