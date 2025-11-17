#!/bin/bash

# Generate random realistic test data for multi-school testing
# This creates randomized incidents with varying characteristics

set -e

if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Random Test Data Generator                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get parameters
read -p "Number of schools (default: 3): " num_schools
num_schools=${num_schools:-3}

read -p "Incidents per school (default: 20): " incidents_per_school
incidents_per_school=${incidents_per_school:-20}

read -p "Clear existing data first? (y/N): " clear_data

if [[ $clear_data =~ ^[Yy]$ ]]; then
  echo "Clearing existing incidents..."
  psql "$DATABASE_URL" -c "TRUNCATE incidents RESTART IDENTITY CASCADE;"
  echo "✓ Cleared"
fi

echo ""
echo "Generating $incidents_per_school incidents for each of $num_schools schools..."
echo ""

psql "$DATABASE_URL" <<SQL
DO \$\$
DECLARE
  school INT;
  incident_num INT;
  category_arr TEXT[] := ARRAY['bullying', 'harassment', 'vandalism', 'theft', 'violence'];
  status_arr TEXT[] := ARRAY['open', 'in_progress', 'resolved', 'closed'];
  location_arr TEXT[] := ARRAY['Hallway A', 'Hallway B', 'Cafeteria', 'Library', 'Gym', 'Classroom', 'Bathroom', 'Parking Lot', 'Playground'];
  random_category TEXT;
  random_status TEXT;
  random_severity INT;
  random_location TEXT;
  random_date TIMESTAMPTZ;
  random_assigned_at TIMESTAMPTZ;
  has_assignment BOOLEAN;
BEGIN
  FOR school IN 1..$num_schools LOOP
    FOR incident_num IN 1..$incidents_per_school LOOP
      -- Random values
      random_category := category_arr[1 + floor(random() * array_length(category_arr, 1))];
      random_status := status_arr[1 + floor(random() * array_length(status_arr, 1))];
      random_severity := 1 + floor(random() * 10);
      random_location := location_arr[1 + floor(random() * array_length(location_arr, 1))];
      random_date := NOW() - (random() * INTERVAL '30 days');
      has_assignment := random() > 0.3; -- 70% chance of assignment

      IF has_assignment THEN
        -- Assigned 1-24 hours after creation
        random_assigned_at := random_date + (random() * INTERVAL '24 hours');
      END IF;

      INSERT INTO incidents (
        category,
        description,
        school_id,
        status,
        class_section,
        ai_meta,
        created_at
      ) VALUES (
        random_category,
        'Randomly generated ' || random_category || ' incident at ' || random_location,
        school,
        random_status,
        random_location,
        CASE
          WHEN has_assignment THEN
            jsonb_build_object(
              'severity', random_severity,
              'assigned_to', 'staff' || (1 + floor(random() * 10)),
              'assigned_at', random_assigned_at::TEXT
            )
          ELSE
            jsonb_build_object('severity', random_severity)
        END,
        random_date
      );
    END LOOP;
  END LOOP;
END \$\$;
SQL

echo "✓ Data generation complete!"
echo ""
echo "Summary:"
psql "$DATABASE_URL" -c "
  SELECT
    'School ' || school_id as school,
    COUNT(*) as total_incidents,
    ROUND(AVG((ai_meta->>'severity')::decimal), 1) as avg_severity,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved,
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as unresolved,
    ROUND(COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) * 100.0 / COUNT(*), 0) || '%' as resolution_rate
  FROM incidents
  WHERE school_id IS NOT NULL
  GROUP BY school_id
  ORDER BY school_id;
"

echo ""
echo "Test the safety scores:"
echo "  for i in {1..$num_schools}; do"
echo "    curl \"http://localhost:3001/admin/safety-score?month=2024-11&school_id=\$i\" \\"
echo "      -H \"X-ADMIN-TOKEN: admin-token-12345\" | jq '.score'"
echo "  done"
echo ""
