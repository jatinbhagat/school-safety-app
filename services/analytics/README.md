# Incident Analytics Service

ETL service for computing daily incident aggregates and generating heatmap analytics.

## Overview

This service processes incident data from the main database and generates pre-computed aggregates for efficient heatmap visualization. It computes:

- **Incident counts** by location, category, and date
- **Recurrence patterns** (incidents in the same location/category within 7 days)
- **Severity averages** from AI metadata
- **Status breakdowns** (open, in_progress, resolved, closed)
- **Spatial data** for heatmap rendering (x/y coordinates)
- **Tags** for filtering (high-urgency, recurring, unresolved, etc.)

## Database Schema

The ETL creates three new tables:

### `incident_locations`
Stores spatial data for each incident:
- `id` - Primary key
- `incident_id` - Foreign key to incidents table
- `class_section` - Classroom/section identifier
- `x_coord` - X coordinate for heatmap
- `y_coord` - Y coordinate for heatmap

### `incident_tags`
Flexible tagging system for categorization:
- `id` - Primary key
- `incident_id` - Foreign key to incidents table
- `tag` - Tag name (e.g., "high-urgency", "recurring")

### `analytics.incident_aggregates`
Pre-computed daily aggregates:
- `date` - Aggregation date (daily granularity)
- `class_section` - Location filter
- `category` - Incident category
- `x_coord`, `y_coord` - Spatial coordinates
- `incident_count` - Total incidents
- `recurrence_count` - Recurring incidents
- `severity_avg` - Average severity score
- `status_breakdown` - JSONB with status counts

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database with incidents table
- Database migrations applied (002_incident_analytics.sql)

### Installation

```bash
cd services/analytics
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file or set:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety
```

## Running the ETL

### Run migrations first

Apply the database migration to create the required tables:

```bash
# From the backend directory
psql $DATABASE_URL -f migrations/002_incident_analytics.sql
```

### Execute the ETL

```bash
cd services/analytics
python aggregate_incidents.py
```

The ETL will:
1. Populate `incident_locations` for any incidents missing location data
2. Generate tags based on AI metadata and patterns
3. Compute daily aggregates for the last 30 days
4. Display summary statistics

### Output Example

```
============================================================
INCIDENT ANALYTICS ETL
============================================================

Populating locations for 15 incidents...
✓ Created 15 location records

Generating incident tags...
✓ Generated tags:
  High-urgency: 3
  Recurring: 5
  Unresolved: 8
  Category tags: 12

Computing aggregates from 2025-10-17 to 2025-11-16...
✓ Computed 23 aggregate records
  Total incidents aggregated: 15
  Unique date/location/category combinations: 23

============================================================
AGGREGATION STATISTICS
============================================================
Total aggregate records: 23
Total location records: 15
Total tag records: 28
Last aggregation run: 2025-11-16 14:32:15.123456+00:00
============================================================

✓ ETL completed successfully!
```

## Testing

### 1. Apply Database Migration

```bash
# Navigate to backend directory
cd services/backend

# Apply the migration
psql $DATABASE_URL -f migrations/002_incident_analytics.sql

# Verify tables were created
psql $DATABASE_URL -c "\dt analytics.*"
psql $DATABASE_URL -c "\d incident_locations"
psql $DATABASE_URL -c "\d incident_tags"
```

Expected output: You should see the three new tables listed.

### 2. Run the ETL

```bash
# Navigate to analytics directory
cd services/analytics

# Install dependencies
pip install -r requirements.txt

# Run the ETL
python aggregate_incidents.py
```

Expected output: Summary statistics showing aggregates computed.

### 3. Verify Data

```bash
# Check that aggregates were created
psql $DATABASE_URL -c "SELECT COUNT(*) FROM analytics.incident_aggregates;"

# View sample aggregates
psql $DATABASE_URL -c "SELECT * FROM analytics.incident_aggregates LIMIT 5;"

# Check location data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM incident_locations;"

# Check tags
psql $DATABASE_URL -c "SELECT tag, COUNT(*) FROM incident_tags GROUP BY tag;"
```

### 4. Test the API Endpoint

Start the backend server:

```bash
cd services/backend
npm run dev
```

Test the heatmap endpoint:

```bash
# Get all heatmap data (last 30 days)
curl -H "X-STAFF-TOKEN: ${STAFF_TOKEN}" http://localhost:3001/analytics/heatmap

# Filter by date range
curl -H "X-STAFF-TOKEN: ${STAFF_TOKEN}" \
  "http://localhost:3001/analytics/heatmap?start_date=2025-11-01&end_date=2025-11-16"

# Filter by class section
curl -H "X-STAFF-TOKEN: ${STAFF_TOKEN}" \
  "http://localhost:3001/analytics/heatmap?class_section=Room%20101"

# Filter by category
curl -H "X-STAFF-TOKEN: ${STAFF_TOKEN}" \
  "http://localhost:3001/analytics/heatmap?category=bullying"
```

Expected response format:

```json
{
  "summary": {
    "total_aggregates": 23,
    "total_incidents": 15,
    "total_recurrences": 5,
    "average_severity": 6.25,
    "date_range": {
      "start": "Last 30 days",
      "end": "Today"
    }
  },
  "data": [
    {
      "id": 1,
      "date": "2025-11-15",
      "location": {
        "class_section": "Room 101",
        "x": 45.5,
        "y": 67.8
      },
      "category": "bullying",
      "metrics": {
        "incident_count": 3,
        "recurrence_count": 1,
        "severity_avg": 7.5
      },
      "status_breakdown": {
        "open": 2,
        "in_progress": 1
      },
      "last_computed_at": "2025-11-16T14:32:15.123Z"
    }
  ]
}
```

### 5. Integration Test

Full end-to-end test:

```bash
# 1. Create a test incident
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "bullying",
    "description": "Test incident for heatmap",
    "class_section": "Test Room 42"
  }'

# 2. Run the ETL to aggregate the new incident
cd services/analytics
python aggregate_incidents.py

# 3. Query the heatmap to see the aggregated data
curl -H "X-STAFF-TOKEN: ${STAFF_TOKEN}" \
  "http://localhost:3001/analytics/heatmap?class_section=Test%20Room%2042"
```

You should see the test incident in the aggregated results.

## Scheduling

For production use, schedule the ETL to run periodically:

### Cron (Linux/macOS)

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/services/analytics && python aggregate_incidents.py >> /var/log/analytics-etl.log 2>&1
```

### Systemd Timer (Linux)

Create `/etc/systemd/system/analytics-etl.service`:

```ini
[Unit]
Description=Incident Analytics ETL

[Service]
Type=oneshot
WorkingDirectory=/path/to/services/analytics
ExecStart=/usr/bin/python3 aggregate_incidents.py
User=appuser
Environment="DATABASE_URL=postgresql://..."
```

Create `/etc/systemd/system/analytics-etl.timer`:

```ini
[Unit]
Description=Run Analytics ETL Daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable analytics-etl.timer
sudo systemctl start analytics-etl.timer
```

## Troubleshooting

### No data in aggregates table

- Ensure incidents exist in the database
- Verify date range covers existing incidents
- Check ETL logs for errors

### Missing coordinates

The ETL generates pseudo-random but consistent coordinates based on `class_section`. For production, integrate with actual floor plan/map data.

### Performance

For large datasets (>10k incidents):
- Add database indexes on frequently filtered columns
- Consider partitioning `incident_aggregates` by date
- Run ETL incrementally (only new/changed data)

## API Reference

### GET /analytics/heatmap

Returns aggregated incident data for heatmap visualization.

**Authentication:** Requires `X-STAFF-TOKEN` header

**Query Parameters:**
- `start_date` (optional) - Start date (YYYY-MM-DD), default: 30 days ago
- `end_date` (optional) - End date (YYYY-MM-DD), default: today
- `class_section` (optional) - Filter by class/section
- `category` (optional) - Filter by incident category

**Response:**
- `summary` - Aggregate statistics
- `data` - Array of heatmap data points

## Future Enhancements

- Real-time aggregation using database triggers
- Support for custom date grouping (weekly, monthly)
- Advanced recurrence detection (ML-based patterns)
- Export aggregates as CSV/JSON
- Integration with GIS/mapping systems for accurate coordinates
