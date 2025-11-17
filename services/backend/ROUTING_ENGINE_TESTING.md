# Routing Engine Testing Guide

This guide provides step-by-step instructions to test the routing engine implementation.

## Prerequisites

1. Backend server running on port 3001 (default)
2. PostgreSQL database accessible
3. Environment variables configured (`.env.local`)
4. Staff authentication token available

## Step 1: Run Database Migration

First, apply the new migration to create routing tables:

```bash
cd services/backend
./scripts/run-migrations.sh
```

**Expected Output:**
- Migration 005 should execute successfully
- Tables `routing_rules` and `routing_logs` created
- 10 default routing rules seeded

**Verify Migration:**
```bash
psql $DATABASE_URL -c "\dt routing*"
```

Should show:
- `routing_rules` table
- `routing_logs` table

**Check Seeded Rules:**
```bash
psql $DATABASE_URL -c "SELECT rule_id, name, target_role, routing_priority FROM routing_rules ORDER BY priority DESC;"
```

Expected: 10 rules from rule_001 to rule_010

---

## Step 2: Start Backend Server

```bash
cd services/backend
npm run dev
# or
npm start
```

**Expected Output:**
```
🚀 School Safety Backend running on port 3001
📊 Health check: http://localhost:3001/health
📝 Report endpoint: http://localhost:3001/report
📋 Incidents list: http://localhost:3001/incidents
✅ Assign incident: POST http://localhost:3001/incidents/:id/assign
```

**Verify Server:**
```bash
curl http://localhost:3001/health
```

---

## Step 3: Create Test Incidents

Before testing routing, create sample incidents with different categories:

### 3.1 Security Threat Incident

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Security",
    "description": "Someone brought a weapon to school",
    "class_section": "Building A"
  }'
```

**Save the returned `id`** (e.g., `incident_id: 1`)

### 3.2 Medical Emergency

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Medical",
    "description": "Student injured and bleeding",
    "class_section": "Gymnasium"
  }'
```

### 3.3 Bullying Incident

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Bullying",
    "description": "Student being bullied and harassed by classmates",
    "class_section": "Room 203"
  }'
```

### 3.4 Maintenance Issue

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Facility",
    "description": "Broken window in classroom",
    "class_section": "Room 105"
  }'
```

### 3.5 General Incident (Low Priority)

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Other",
    "description": "Lost and found item",
    "class_section": "Main Office"
  }'
```

---

## Step 4: Test POST /triage/route Endpoint

Replace `YOUR_STAFF_TOKEN` with your actual staff token from `.env.local`:

### 4.1 Test Security Incident Routing

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 1
  }'
```

**Expected Response:**
```json
{
  "incident_id": 1,
  "recommendation": {
    "role": "security",
    "confidence": 0.95,
    "priority": "critical",
    "reasoning": "Matched rule: Active Threat (rule_001)",
    "estimated_response_time": "< 5 minutes"
  },
  "routing_log_id": 1,
  "timestamp": "2025-11-17T...",
  "request_id": "..."
}
```

**Validation Checks:**
- ✅ `role` should be `"security"`
- ✅ `confidence` should be `0.95` (high)
- ✅ `priority` should be `"critical"`
- ✅ Response time should be `"< 5 minutes"`

### 4.2 Test Medical Incident Routing

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 2
  }'
```

**Expected:**
- `role`: `"nurse"`
- `priority`: `"critical"`
- `confidence`: `0.95`

### 4.3 Test Bullying Incident Routing

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 3
  }'
```

**Expected:**
- `role`: `"counselor"`
- `priority`: `"high"`
- `confidence`: `0.90`

### 4.4 Test Maintenance Incident Routing

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 4
  }'
```

**Expected:**
- `role`: `"maintenance"`
- `priority`: `"medium"`
- `confidence`: `0.80`

### 4.5 Test Low Priority Incident Routing

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 5
  }'
```

**Expected:**
- `role`: `"staff"`
- `priority`: `"low"`
- `confidence`: `0.60`

---

## Step 5: Test POST /triage/route/assign Endpoint

### 5.1 Assign Security Incident

```bash
curl -X POST http://localhost:3001/triage/route/assign \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 1,
    "role": "security",
    "assigned_by": "Admin User",
    "routing_log_id": 1
  }'
```

**Expected Response:**
```json
{
  "incident_id": 1,
  "assignment": {
    "role": "security",
    "assigned_at": "2025-11-17T...",
    "assigned_by": "Admin User"
  },
  "incident": {
    "id": 1,
    "status": "in_progress",
    "category": "Security",
    "description": "Someone brought a weapon to school",
    "class_section": "Building A",
    "created_at": "...",
    "ai_meta": {
      "assigned_to": "security",
      "assigned_at": "...",
      "assigned_by": "Admin User"
    }
  },
  "request_id": "..."
}
```

**Validation Checks:**
- ✅ `status` changed from `"open"` to `"in_progress"`
- ✅ `ai_meta.assigned_to` is `"security"`
- ✅ `ai_meta.assigned_by` is `"Admin User"`

### 5.2 Test Invalid Role

```bash
curl -X POST http://localhost:3001/triage/route/assign \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 2,
    "role": "invalid_role"
  }'
```

**Expected:**
- Status: `400 Bad Request`
- Error message: `"Invalid role. Must be one of: security, nurse, counselor, administrator, teacher, maintenance, staff"`

### 5.3 Test Non-Existent Incident

```bash
curl -X POST http://localhost:3001/triage/route/assign \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 99999,
    "role": "staff"
  }'
```

**Expected:**
- Status: `404 Not Found`
- Error message: `"Incident with id 99999 not found"`

---

## Step 6: Test Authentication

### 6.1 Test Without Token

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -d '{
    "incident_id": 1
  }'
```

**Expected:**
- Status: `401 Unauthorized`

### 6.2 Test With Invalid Token

```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: invalid_token_12345" \
  -d '{
    "incident_id": 1
  }'
```

**Expected:**
- Status: `403 Forbidden`

---

## Step 7: Verify Database Entries

### 7.1 Check Routing Logs

```bash
psql $DATABASE_URL -c "SELECT id, incident_id, recommended_role, confidence, priority, routing_method, matched_rule_id FROM routing_logs ORDER BY created_at DESC LIMIT 5;"
```

**Expected:**
- Entries for all routing requests made
- `matched_rule_id` should reference the correct rule (e.g., `rule_001`, `rule_002`)
- `routing_method` should be `"hybrid"` by default

### 7.2 Check Updated Incidents

```bash
psql $DATABASE_URL -c "SELECT id, category, status, ai_meta->>'assigned_to' as assigned_to FROM incidents WHERE id IN (1, 2, 3, 4, 5);"
```

**Expected:**
- Incident 1: `status = 'in_progress'`, `assigned_to = 'security'` (if assigned)
- Other incidents: `status = 'open'` or `'in_progress'` based on assignments

### 7.3 Check Routing Logs with Assignment Tracking

```bash
psql $DATABASE_URL -c "SELECT incident_id, recommended_role, actual_assigned_role, was_reassigned FROM routing_logs WHERE actual_assigned_role IS NOT NULL;"
```

**Expected:**
- `actual_assigned_role` should match assignments made via `/triage/route/assign`
- `was_reassigned` should be `false` if role matches recommendation

---

## Step 8: Test Edge Cases

### 8.1 Test Incident with Multiple Keywords

Create an incident that matches multiple rules:

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Emergency",
    "description": "Fight involving weapon and student injured",
    "class_section": "Cafeteria"
  }'
```

Route it:
```bash
curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 6
  }'
```

**Expected:**
- Should match highest priority rule (Active Threat - `rule_001`)
- `role`: `"security"` (not nurse, since security has higher priority)

### 8.2 Test Empty Description

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Unknown",
    "class_section": "Parking Lot"
  }'
```

**Expected:**
- Routes to default `"staff"` role with low priority

---

## Step 9: Performance Testing

### 9.1 Test Response Time

```bash
time curl -X POST http://localhost:3001/triage/route \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -d '{
    "incident_id": 1
  }'
```

**Expected:**
- Response time < 100ms for routing decision
- Database query should be fast due to indexes

### 9.2 Test Concurrent Requests

Using Apache Bench (if installed):
```bash
ab -n 100 -c 10 \
  -H "Content-Type: application/json" \
  -H "X-STAFF-TOKEN: YOUR_STAFF_TOKEN" \
  -p /tmp/route_payload.json \
  http://localhost:3001/triage/route
```

Where `/tmp/route_payload.json` contains:
```json
{"incident_id": 1}
```

---

## Step 10: Integration Testing Checklist

- [ ] All 10 routing rules work correctly
- [ ] Confidence scores are accurate (0.0 to 1.0)
- [ ] Priority levels are correct (low, medium, high, critical)
- [ ] Estimated response times are populated
- [ ] Staff authentication required for both endpoints
- [ ] Invalid roles are rejected
- [ ] Non-existent incidents return 404
- [ ] Routing logs are created correctly
- [ ] Assignment updates incident status to 'in_progress'
- [ ] ai_meta field is updated with assignment info
- [ ] routing_logs.actual_assigned_role is updated when assignment is made

---

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Run `npm install` in `services/backend/`

### Issue: Migration fails
**Solution:** Check PostgreSQL connection and ensure `DATABASE_URL` is correct in `.env.local`

### Issue: 401/403 errors
**Solution:** Verify `STAFF_TOKEN` in `.env.local` matches the header value

### Issue: Routing returns default "staff" for all incidents
**Solution:** Check that incident descriptions contain relevant keywords (lowercase matching)

### Issue: TypeScript compilation errors
**Solution:** These are expected due to missing `node_modules`. The code runs fine with `tsx` at runtime.

---

## Success Criteria

✅ All routing rules match expected roles
✅ Confidence scores are appropriate (critical: 0.92-0.95, high: 0.85-0.90, etc.)
✅ Assignment endpoint updates status and ai_meta correctly
✅ Routing logs capture all decisions
✅ Authentication protects endpoints
✅ Edge cases handled gracefully
✅ Performance is acceptable (< 100ms per request)

---

## Next Steps

After successful testing:

1. **Train ML Model** - Replace stub with actual trained model
2. **Add Feedback Loop** - Collect routing quality scores
3. **Build Analytics** - Dashboard for routing performance
4. **Staff Database** - Implement real staff member tracking
5. **Reassignment Logic** - Handle incident reassignment scenarios
