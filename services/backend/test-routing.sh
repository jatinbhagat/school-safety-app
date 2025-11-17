#!/bin/bash

# Routing Engine Test Script
# Tests the routing engine endpoints with various incident types

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
STAFF_TOKEN="${STAFF_TOKEN:-}"

if [ -z "$STAFF_TOKEN" ]; then
  # Try to load from .env.local
  if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
    STAFF_TOKEN="${STAFF_TOKEN:-}"
  fi
fi

if [ -z "$STAFF_TOKEN" ]; then
  echo -e "${RED}ERROR: STAFF_TOKEN not set${NC}"
  echo "Please set STAFF_TOKEN environment variable or add it to .env.local"
  echo "Example: export STAFF_TOKEN=your_token_here"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Routing Engine Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test counter
PASSED=0
FAILED=0

# Helper function to print test results
print_result() {
  local test_name=$1
  local expected=$2
  local actual=$3

  if [ "$expected" == "$actual" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $test_name"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $test_name"
    echo -e "  Expected: $expected"
    echo -e "  Actual: $actual"
    ((FAILED++))
  fi
}

# Helper function to create incident
create_incident() {
  local category=$1
  local description=$2
  local class_section=$3

  local response=$(curl -s -X POST "$BASE_URL/report" \
    -H "Content-Type: application/json" \
    -d "{
      \"category\": \"$category\",
      \"description\": \"$description\",
      \"class_section\": \"$class_section\"
    }")

  echo "$response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*'
}

# Helper function to test routing
test_routing() {
  local incident_id=$1
  local expected_role=$2
  local expected_priority=$3
  local test_name=$4

  echo -e "\n${YELLOW}Testing:${NC} $test_name (incident_id: $incident_id)"

  local response=$(curl -s -X POST "$BASE_URL/triage/route" \
    -H "Content-Type: application/json" \
    -H "X-STAFF-TOKEN: $STAFF_TOKEN" \
    -d "{\"incident_id\": $incident_id}")

  local actual_role=$(echo "$response" | grep -o '"role":"[^"]*"' | head -1 | cut -d'"' -f4)
  local actual_priority=$(echo "$response" | grep -o '"priority":"[^"]*"' | head -1 | cut -d'"' -f4)
  local confidence=$(echo "$response" | grep -o '"confidence":[0-9.]*' | head -1 | cut -d':' -f2)

  print_result "$test_name - Role" "$expected_role" "$actual_role"
  print_result "$test_name - Priority" "$expected_priority" "$actual_priority"

  echo -e "  Confidence: ${BLUE}$confidence${NC}"

  # Return the routing_log_id for later use
  echo "$response" | grep -o '"routing_log_id":[0-9]*' | grep -o '[0-9]*'
}

# Helper function to test assignment
test_assignment() {
  local incident_id=$1
  local role=$2
  local routing_log_id=$3
  local test_name=$4

  echo -e "\n${YELLOW}Testing:${NC} $test_name (incident_id: $incident_id)"

  local response=$(curl -s -X POST "$BASE_URL/triage/route/assign" \
    -H "Content-Type: application/json" \
    -H "X-STAFF-TOKEN: $STAFF_TOKEN" \
    -d "{
      \"incident_id\": $incident_id,
      \"role\": \"$role\",
      \"assigned_by\": \"Test Script\",
      \"routing_log_id\": $routing_log_id
    }")

  local actual_status=$(echo "$response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  local actual_role=$(echo "$response" | grep -o '"role":"[^"]*"' | head -1 | cut -d'"' -f4)

  print_result "$test_name - Status" "in_progress" "$actual_status"
  print_result "$test_name - Assigned Role" "$role" "$actual_role"
}

echo -e "${BLUE}Step 1: Creating Test Incidents${NC}"
echo "======================================\n"

echo "Creating security threat incident..."
INCIDENT_1=$(create_incident "Security" "Someone brought a weapon to school" "Building A")
echo -e "Created incident ID: ${GREEN}$INCIDENT_1${NC}"

echo "Creating medical emergency..."
INCIDENT_2=$(create_incident "Medical" "Student injured and bleeding" "Gymnasium")
echo -e "Created incident ID: ${GREEN}$INCIDENT_2${NC}"

echo "Creating bullying incident..."
INCIDENT_3=$(create_incident "Bullying" "Student being bullied by classmates" "Room 203")
echo -e "Created incident ID: ${GREEN}$INCIDENT_3${NC}"

echo "Creating maintenance issue..."
INCIDENT_4=$(create_incident "Facility" "Broken window in classroom" "Room 105")
echo -e "Created incident ID: ${GREEN}$INCIDENT_4${NC}"

echo "Creating mental health crisis..."
INCIDENT_5=$(create_incident "Mental Health" "Student talking about self-harm" "Counselor Office")
echo -e "Created incident ID: ${GREEN}$INCIDENT_5${NC}"

echo "Creating substance abuse incident..."
INCIDENT_6=$(create_incident "Substance" "Student caught vaping in bathroom" "Restroom B")
echo -e "Created incident ID: ${GREEN}$INCIDENT_6${NC}"

echo "Creating general incident..."
INCIDENT_7=$(create_incident "Other" "Lost and found item" "Main Office")
echo -e "Created incident ID: ${GREEN}$INCIDENT_7${NC}"

echo -e "\n${BLUE}Step 2: Testing Routing Recommendations${NC}"
echo "======================================\n"

LOG_1=$(test_routing $INCIDENT_1 "security" "critical" "Security Threat → Security (Critical)")
LOG_2=$(test_routing $INCIDENT_2 "nurse" "critical" "Medical Emergency → Nurse (Critical)")
LOG_3=$(test_routing $INCIDENT_3 "counselor" "high" "Bullying → Counselor (High)")
LOG_4=$(test_routing $INCIDENT_4 "maintenance" "medium" "Facility Issue → Maintenance (Medium)")
LOG_5=$(test_routing $INCIDENT_5 "counselor" "critical" "Mental Health → Counselor (Critical)")
LOG_6=$(test_routing $INCIDENT_6 "administrator" "high" "Substance Abuse → Administrator (High)")
LOG_7=$(test_routing $INCIDENT_7 "staff" "low" "General → Staff (Low)")

echo -e "\n${BLUE}Step 3: Testing Incident Assignment${NC}"
echo "======================================\n"

test_assignment $INCIDENT_1 "security" $LOG_1 "Assign Security Incident"
test_assignment $INCIDENT_2 "nurse" $LOG_2 "Assign Medical Incident"
test_assignment $INCIDENT_3 "counselor" $LOG_3 "Assign Bullying Incident"

echo -e "\n${BLUE}Step 4: Testing Error Handling${NC}"
echo "======================================\n"

echo -e "${YELLOW}Testing:${NC} Invalid Role"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/triage/route/assign" \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: $STAFF_TOKEN" \
  -d "{\"incident_id\": $INCIDENT_4, \"role\": \"invalid_role\"}")

http_code=$(echo "$response" | tail -1)
print_result "Invalid Role - HTTP 400" "400" "$http_code"

echo -e "\n${YELLOW}Testing:${NC} Non-existent Incident"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/triage/route" \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: $STAFF_TOKEN" \
  -d "{\"incident_id\": 99999}")

http_code=$(echo "$response" | tail -1)
print_result "Non-existent Incident - HTTP 404" "404" "$http_code"

echo -e "\n${YELLOW}Testing:${NC} Missing Authentication"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/triage/route" \
  -H "Content-Type: application/json" \
  -d "{\"incident_id\": $INCIDENT_1}")

http_code=$(echo "$response" | tail -1)
print_result "Missing Auth - HTTP 401" "401" "$http_code"

echo -e "\n${YELLOW}Testing:${NC} Invalid Authentication"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/triage/route" \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: invalid_token_12345" \
  -d "{\"incident_id\": $INCIDENT_1}")

http_code=$(echo "$response" | tail -1)
print_result "Invalid Auth - HTTP 403" "403" "$http_code"

# Final Results
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "Total Passed: ${GREEN}$PASSED${NC}"
echo -e "Total Failed: ${RED}$FAILED${NC}"
echo -e "Total Tests:  $((PASSED + FAILED))\n"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}\n"
  exit 0
else
  echo -e "${RED}✗ Some tests failed.${NC}\n"
  exit 1
fi
