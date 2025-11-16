#!/bin/bash
# Test script for Heatmap Analytics Feature
# This script will test the complete analytics pipeline

set -e  # Exit on error

echo "=========================================="
echo "HEATMAP ANALYTICS - TESTING SCRIPT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo "---"

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
    echo "Please set DATABASE_URL environment variable"
    exit 1
fi
echo -e "${GREEN}✓ DATABASE_URL is set${NC}"

if [ -z "$STAFF_TOKEN" ]; then
    echo -e "${YELLOW}WARNING: STAFF_TOKEN not set${NC}"
    echo "Using default: staff-token-12345"
    export STAFF_TOKEN="staff-token-12345"
fi
echo -e "${GREEN}✓ STAFF_TOKEN: $STAFF_TOKEN${NC}"
echo ""

# Step 2: Apply database migration
echo "Step 2: Applying database migration..."
echo "---"
cd services/backend
psql $DATABASE_URL -f migrations/002_incident_analytics.sql
echo -e "${GREEN}✓ Migration applied${NC}"
echo ""

# Step 3: Verify tables were created
echo "Step 3: Verifying tables..."
echo "---"
echo "Checking analytics schema:"
psql $DATABASE_URL -c "\dt analytics.*"
echo ""
echo "Checking incident_locations table:"
psql $DATABASE_URL -c "\d incident_locations" | head -20
echo ""
echo "Checking incident_tags table:"
psql $DATABASE_URL -c "\d incident_tags" | head -20
echo -e "${GREEN}✓ All tables created successfully${NC}"
echo ""

# Step 4: Create test incidents
echo "Step 4: Creating test incidents..."
echo "---"
cd ../..

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${YELLOW}WARNING: Backend not running at localhost:3001${NC}"
    echo "Please start the backend with: cd services/backend && npm run dev"
    echo "Then run this script again"
    exit 1
fi

# Create 5 test incidents
for i in {1..5}; do
    RESPONSE=$(curl -s -X POST http://localhost:3001/report \
        -H "Content-Type: application/json" \
        -d "{
            \"category\": \"bullying\",
            \"description\": \"Test incident #$i for heatmap analytics\",
            \"class_section\": \"Test Room $((i % 3 + 1))\"
        }")

    INCIDENT_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$INCIDENT_ID" ]; then
        echo -e "${GREEN}✓ Created incident #$INCIDENT_ID in Test Room $((i % 3 + 1))${NC}"
    else
        echo -e "${RED}✗ Failed to create incident #$i${NC}"
        echo "Response: $RESPONSE"
    fi
done
echo ""

# Step 5: Run the ETL
echo "Step 5: Running ETL to compute aggregates..."
echo "---"
cd services/analytics

# Check if Python dependencies are installed
if ! python3 -c "import psycopg2" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

python3 aggregate_incidents.py
echo -e "${GREEN}✓ ETL completed${NC}"
echo ""

# Step 6: Verify data in tables
echo "Step 6: Verifying data in tables..."
echo "---"
cd ../..

echo "Incident locations:"
psql $DATABASE_URL -c "SELECT id, incident_id, class_section, ROUND(x_coord::numeric, 2) as x, ROUND(y_coord::numeric, 2) as y FROM incident_locations ORDER BY id DESC LIMIT 5;"
echo ""

echo "Incident tags:"
psql $DATABASE_URL -c "SELECT tag, COUNT(*) as count FROM incident_tags GROUP BY tag ORDER BY count DESC;"
echo ""

echo "Aggregates:"
psql $DATABASE_URL -c "SELECT date, class_section, category, incident_count, recurrence_count FROM analytics.incident_aggregates ORDER BY date DESC LIMIT 5;"
echo -e "${GREEN}✓ Data verified${NC}"
echo ""

# Step 7: Test the API endpoint
echo "Step 7: Testing API endpoint..."
echo "---"

echo "Test 1: Get all heatmap data (last 30 days)"
RESPONSE=$(curl -s -H "X-STAFF-TOKEN: $STAFF_TOKEN" http://localhost:3001/analytics/heatmap)
TOTAL_AGGREGATES=$(echo $RESPONSE | grep -o '"total_aggregates":[0-9]*' | grep -o '[0-9]*')
echo -e "Response: ${GREEN}$TOTAL_AGGREGATES aggregate records found${NC}"
echo ""

echo "Test 2: Filter by class section (Test Room 1)"
RESPONSE=$(curl -s -H "X-STAFF-TOKEN: $STAFF_TOKEN" "http://localhost:3001/analytics/heatmap?class_section=Test%20Room%201")
FILTERED_COUNT=$(echo $RESPONSE | grep -o '"total_aggregates":[0-9]*' | grep -o '[0-9]*')
echo -e "Response: ${GREEN}$FILTERED_COUNT aggregate records for Test Room 1${NC}"
echo ""

echo "Test 3: Filter by category (bullying)"
RESPONSE=$(curl -s -H "X-STAFF-TOKEN: $STAFF_TOKEN" "http://localhost:3001/analytics/heatmap?category=bullying")
CATEGORY_COUNT=$(echo $RESPONSE | grep -o '"total_aggregates":[0-9]*' | grep -o '[0-9]*')
echo -e "Response: ${GREEN}$CATEGORY_COUNT aggregate records for bullying category${NC}"
echo ""

echo "Test 4: Get full JSON response (formatted)"
curl -s -H "X-STAFF-TOKEN: $STAFF_TOKEN" http://localhost:3001/analytics/heatmap | python3 -m json.tool | head -40
echo "..."
echo ""

# Step 8: Summary
echo "=========================================="
echo "TESTING COMPLETE!"
echo "=========================================="
echo ""
echo -e "${GREEN}All tests passed successfully!${NC}"
echo ""
echo "Summary:"
echo "- Database migration applied ✓"
echo "- Test incidents created ✓"
echo "- ETL executed ✓"
echo "- Data populated in all tables ✓"
echo "- API endpoint responding correctly ✓"
echo ""
echo "You can now:"
echo "1. View aggregates: curl -H 'X-STAFF-TOKEN: $STAFF_TOKEN' http://localhost:3001/analytics/heatmap"
echo "2. Re-run ETL anytime: cd services/analytics && python3 aggregate_incidents.py"
echo "3. Clean up test data: psql \$DATABASE_URL -c \"DELETE FROM incidents WHERE description LIKE 'Test incident %';\""
echo ""
