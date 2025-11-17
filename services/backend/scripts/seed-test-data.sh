#!/bin/bash

# Test data generator for multi-school deployment
# Creates realistic incident data for 3 schools with different performance levels

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Multi-School Test Data Generator                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "This will create test incidents for 3 schools:"
echo "  - School 1 (Lincoln High): 5 incidents - Good performance"
echo "  - School 2 (Washington Elementary): 15 incidents - Medium performance"
echo "  - School 3 (Roosevelt Middle): 30 incidents - Poor performance"
echo ""
read -p "Clear existing incidents first? (y/N): " clear_data

if [[ $clear_data =~ ^[Yy]$ ]]; then
  echo "Clearing existing incidents..."
  psql "$DATABASE_URL" -c "TRUNCATE incidents RESTART IDENTITY CASCADE;"
  echo "✓ Cleared"
  echo ""
fi

echo "Creating test data..."

psql "$DATABASE_URL" <<'SQL'
-- School 1: Lincoln High (5 incidents, good performance)
-- Low incident rate, low severity, high resolution rate, fast response
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at, class_section)
VALUES
  ('bullying', 'Minor teasing incident in classroom', 1, 'resolved',
   '{"severity": 2, "assigned_to": "staff1", "assigned_at": "2024-11-15T10:00:00Z"}',
   '2024-11-15T09:00:00Z', 'Grade 10A'),
  ('harassment', 'Verbal harassment during lunch', 1, 'resolved',
   '{"severity": 3, "assigned_to": "staff1", "assigned_at": "2024-11-16T09:30:00Z"}',
   '2024-11-16T08:00:00Z', 'Grade 11B'),
  ('vandalism', 'Minor graffiti in bathroom', 1, 'closed',
   '{"severity": 2, "assigned_to": "staff2", "assigned_at": "2024-11-17T08:00:00Z"}',
   '2024-11-17T07:30:00Z', 'Bathroom 2A'),
  ('bullying', 'Exclusion from group activity', 1, 'resolved',
   '{"severity": 3, "assigned_to": "staff1", "assigned_at": "2024-11-18T11:00:00Z"}',
   '2024-11-18T10:00:00Z', 'Grade 9C'),
  ('harassment', 'Inappropriate comment', 1, 'resolved',
   '{"severity": 4, "assigned_to": "staff3", "assigned_at": "2024-11-19T14:00:00Z"}',
   '2024-11-19T13:00:00Z', 'Grade 12A');

-- School 2: Washington Elementary (15 incidents, medium performance)
-- Medium incident rate, mixed severity, moderate resolution, slower response
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at, class_section)
VALUES
  ('vandalism', 'Broken cafeteria window', 2, 'in_progress',
   '{"severity": 5, "assigned_to": "staff4", "assigned_at": "2024-11-14T15:00:00Z"}',
   '2024-11-14T14:00:00Z', 'Cafeteria'),
  ('bullying', 'Physical pushing incident', 2, 'resolved',
   '{"severity": 6, "assigned_to": "staff5", "assigned_at": "2024-11-15T10:00:00Z"}',
   '2024-11-15T08:00:00Z', 'Grade 5A'),
  ('harassment', 'Name-calling on playground', 2, 'open',
   '{"severity": 4}', '2024-11-16T10:00:00Z', 'Playground'),
  ('theft', 'Missing backpack reported', 2, 'in_progress',
   '{"severity": 5, "assigned_to": "staff6", "assigned_at": "2024-11-16T16:00:00Z"}',
   '2024-11-16T14:00:00Z', 'Grade 4B'),
  ('vandalism', 'Desk carved with initials', 2, 'resolved',
   '{"severity": 3, "assigned_to": "staff4", "assigned_at": "2024-11-17T09:00:00Z"}',
   '2024-11-17T08:00:00Z', 'Grade 6A'),
  ('bullying', 'Social exclusion pattern', 2, 'open',
   '{"severity": 4}', '2024-11-17T12:00:00Z', 'Grade 5B'),
  ('harassment', 'Threatening text messages', 2, 'in_progress',
   '{"severity": 7, "assigned_to": "staff5", "assigned_at": "2024-11-18T11:00:00Z"}',
   '2024-11-18T09:00:00Z', 'Grade 6C'),
  ('vandalism', 'Locker forced open', 2, 'resolved',
   '{"severity": 4, "assigned_to": "staff6", "assigned_at": "2024-11-18T15:00:00Z"}',
   '2024-11-18T14:00:00Z', 'Hallway B'),
  ('bullying', 'Cyberbullying via social media', 2, 'in_progress',
   '{"severity": 6, "assigned_to": "staff5", "assigned_at": "2024-11-19T10:00:00Z"}',
   '2024-11-19T08:00:00Z', 'Grade 5A'),
  ('theft', 'Lunch money stolen', 2, 'open',
   '{"severity": 3}', '2024-11-19T13:00:00Z', 'Grade 4A'),
  ('harassment', 'Unwanted physical contact', 2, 'resolved',
   '{"severity": 8, "assigned_to": "staff7", "assigned_at": "2024-11-20T09:00:00Z"}',
   '2024-11-20T08:00:00Z', 'Grade 6B'),
  ('vandalism', 'Paint splashed on wall', 2, 'resolved',
   '{"severity": 4, "assigned_to": "staff4", "assigned_at": "2024-11-20T14:00:00Z"}',
   '2024-11-20T13:00:00Z', 'Art Room'),
  ('bullying', 'Racial slurs used', 2, 'in_progress',
   '{"severity": 7, "assigned_to": "staff5", "assigned_at": "2024-11-21T10:00:00Z"}',
   '2024-11-21T09:00:00Z', 'Grade 5C'),
  ('harassment', 'Persistent unwanted attention', 2, 'resolved',
   '{"severity": 5, "assigned_to": "staff6", "assigned_at": "2024-11-21T15:00:00Z"}',
   '2024-11-21T14:00:00Z', 'Grade 6A'),
  ('theft', 'Phone stolen from locker', 2, 'open',
   '{"severity": 6}', '2024-11-22T11:00:00Z', 'Grade 5B');

-- School 3: Roosevelt Middle (30 incidents, poor performance)
-- High incident rate, high severity, low resolution, very slow response
INSERT INTO incidents (category, description, school_id, status, ai_meta, created_at, class_section)
VALUES
  ('violence', 'Physical fight in hallway', 3, 'open',
   '{"severity": 9}', '2024-11-01T10:00:00Z', 'Hallway C'),
  ('vandalism', 'Extensive graffiti covering walls', 3, 'in_progress',
   '{"severity": 7, "assigned_to": "staff8", "assigned_at": "2024-11-02T16:00:00Z"}',
   '2024-11-02T09:00:00Z', 'Building 3'),
  ('bullying', 'Gang-related intimidation', 3, 'open',
   '{"severity": 8}', '2024-11-03T11:00:00Z', 'Grade 7A'),
  ('theft', 'Multiple school laptops stolen', 3, 'in_progress',
   '{"severity": 8, "assigned_to": "staff9", "assigned_at": "2024-11-04T18:00:00Z"}',
   '2024-11-04T08:00:00Z', 'Computer Lab'),
  ('violence', 'Assault on another student', 3, 'in_progress',
   '{"severity": 10, "assigned_to": "staff10", "assigned_at": "2024-11-05T20:00:00Z"}',
   '2024-11-05T09:00:00Z', 'Cafeteria'),
  ('harassment', 'Sexual harassment complaint', 3, 'open',
   '{"severity": 9}', '2024-11-06T10:00:00Z', 'Grade 8B'),
  ('vandalism', 'Classroom equipment destroyed', 3, 'open',
   '{"severity": 6}', '2024-11-07T11:00:00Z', 'Science Lab'),
  ('bullying', 'Coordinated cyberbullying campaign', 3, 'in_progress',
   '{"severity": 8, "assigned_to": "staff8", "assigned_at": "2024-11-08T22:00:00Z"}',
   '2024-11-08T08:00:00Z', 'Grade 7C'),
  ('violence', 'Weapon confiscated from student', 3, 'resolved',
   '{"severity": 10, "assigned_to": "staff10", "assigned_at": "2024-11-09T09:30:00Z"}',
   '2024-11-09T09:00:00Z', 'Security Office'),
  ('theft', 'Multiple locker break-ins', 3, 'open',
   '{"severity": 7}', '2024-11-10T12:00:00Z', 'Building 2'),
  ('harassment', 'Stalking behavior reported', 3, 'open',
   '{"severity": 8}', '2024-11-11T13:00:00Z', 'Grade 8A'),
  ('vandalism', 'Fire alarm tampered with', 3, 'in_progress',
   '{"severity": 8, "assigned_to": "staff9", "assigned_at": "2024-11-12T20:00:00Z"}',
   '2024-11-12T10:00:00Z', 'Building 1'),
  ('bullying', 'Extortion for lunch money', 3, 'open',
   '{"severity": 9}', '2024-11-13T11:00:00Z', 'Grade 7B'),
  ('violence', 'Large fight during lunch period', 3, 'in_progress',
   '{"severity": 8, "assigned_to": "staff8", "assigned_at": "2024-11-14T18:00:00Z"}',
   '2024-11-14T12:00:00Z', 'Cafeteria'),
  ('harassment', 'Homophobic slurs and threats', 3, 'open',
   '{"severity": 7}', '2024-11-15T14:00:00Z', 'Grade 8C'),
  ('vandalism', 'Bathroom intentionally flooded', 3, 'resolved',
   '{"severity": 6, "assigned_to": "staff9", "assigned_at": "2024-11-16T10:00:00Z"}',
   '2024-11-16T09:00:00Z', 'Bathroom 3B'),
  ('theft', 'Teacher personal property stolen', 3, 'open',
   '{"severity": 7}', '2024-11-17T15:00:00Z', 'Staff Room'),
  ('bullying', 'Group assault on student', 3, 'open',
   '{"severity": 9}', '2024-11-18T11:00:00Z', 'Parking Lot'),
  ('violence', 'Violent classroom disruption', 3, 'in_progress',
   '{"severity": 7, "assigned_to": "staff10", "assigned_at": "2024-11-19T20:00:00Z"}',
   '2024-11-19T10:00:00Z', 'Grade 7A'),
  ('harassment', 'Persistent harassment campaign', 3, 'open',
   '{"severity": 8}', '2024-11-20T13:00:00Z', 'Grade 8B'),
  ('vandalism', 'Library books destroyed', 3, 'open',
   '{"severity": 6}', '2024-11-21T11:00:00Z', 'Library'),
  ('bullying', 'Death threats via social media', 3, 'open',
   '{"severity": 8}', '2024-11-21T14:00:00Z', 'Grade 7C'),
  ('violence', 'After-school fight near campus', 3, 'in_progress',
   '{"severity": 9, "assigned_to": "staff8", "assigned_at": "2024-11-22T19:00:00Z"}',
   '2024-11-22T16:00:00Z', 'Parking Lot'),
  ('theft', 'Cash stolen from office', 3, 'open',
   '{"severity": 7}', '2024-11-22T10:00:00Z', 'Main Office'),
  ('harassment', 'Repeated unwanted advances', 3, 'open',
   '{"severity": 8}', '2024-11-23T12:00:00Z', 'Grade 8A'),
  ('vandalism', 'Computer lab equipment damaged', 3, 'open',
   '{"severity": 8}', '2024-11-23T14:00:00Z', 'Computer Lab'),
  ('bullying', 'Orchestrated social exclusion', 3, 'open',
   '{"severity": 7}', '2024-11-24T11:00:00Z', 'Grade 7B'),
  ('violence', 'Staff member assaulted', 3, 'in_progress',
   '{"severity": 10, "assigned_to": "staff10", "assigned_at": "2024-11-24T15:00:00Z"}',
   '2024-11-24T14:00:00Z', 'Classroom 301'),
  ('theft', 'Science equipment stolen', 3, 'open',
   '{"severity": 7}', '2024-11-25T09:00:00Z', 'Science Lab'),
  ('harassment', 'Anonymous threatening notes', 3, 'open',
   '{"severity": 8}', '2024-11-25T13:00:00Z', 'Grade 8C');
SQL

echo ""
echo "✓ Test data created successfully!"
echo ""
echo "Summary of created incidents:"
psql "$DATABASE_URL" -c "
  SELECT
    CASE school_id
      WHEN 1 THEN 'School 1 (Lincoln High)'
      WHEN 2 THEN 'School 2 (Washington Elementary)'
      WHEN 3 THEN 'School 3 (Roosevelt Middle)'
    END as school,
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
echo "Next steps:"
echo "  1. Test safety scores for each school:"
echo "     curl \"http://localhost:3001/admin/safety-score?month=2024-11&school_id=1\" \\"
echo "       -H \"X-ADMIN-TOKEN: admin-token-12345\""
echo ""
echo "  2. Compare scores across all schools:"
echo "     curl \"http://localhost:3001/admin/safety-score?month=2024-11\" \\"
echo "       -H \"X-ADMIN-TOKEN: admin-token-12345\""
echo ""
echo "  3. Store scores for all schools:"
echo "     for i in 1 2 3; do"
echo "       curl \"http://localhost:3001/admin/safety-score?month=2024-11&school_id=\$i&store=true\" \\"
echo "         -H \"X-ADMIN-TOKEN: admin-token-12345\""
echo "     done"
echo ""
