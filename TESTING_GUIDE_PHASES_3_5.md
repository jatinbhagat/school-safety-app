# Testing Guide - Phases 3, 4, and 5
## Reporter Notifications, Tracking Portal, and Dispute System

This guide covers comprehensive testing for Phases 3-5 of the School Safety App admin/staff mobile app system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 3: Reporter Notification System](#phase-3-reporter-notification-system)
3. [Phase 4: Anonymous Tracking Portal](#phase-4-anonymous-tracking-portal)
4. [Phase 5: Dispute Submission System](#phase-5-dispute-submission-system)
5. [Integration Testing](#integration-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Environment Setup

Ensure you have the following environment variables configured in `services/backend/.env.local`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# SendGrid Email Service (Phase 3)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@safelynotify.com
SENDGRID_FROM_NAME=School Safety Alert

# Twilio SMS Service (Phase 3)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_FROM_PHONE=+15555555555

# Application URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Database Migrations

Ensure migrations 021, 022, and 023 are applied:

```bash
# From services/backend directory
npm run migrate

# Or run the migration endpoint
curl http://localhost:3001/admin/run-migrations
```

### Services Running

```bash
# Terminal 1 - Backend
cd services/backend
npm run dev

# Terminal 2 - PWA (Frontend)
cd services/pwa
npm run dev

# Terminal 3 - Database
docker-compose up postgres
```

---

## Phase 3: Reporter Notification System

Phase 3 implements email and SMS notifications for reporters when their incident status changes.

### 3.1 Setup Notification Templates

**Verify templates exist in database:**

```sql
SELECT
  event_type,
  email_subject,
  sms_template
FROM notification_templates
ORDER BY event_type;
```

**Expected result:** 7 templates (report_received, status_changed, resolved, closed, assigned_to_staff, flagged_as_false, dispute_resolved)

### 3.2 Test Report Submission with Notifications

**Test Case 3.2.1: Submit report with email contact**

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Bullying",
    "description": "Test report for notification testing",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "dynamic_fields": {
      "contact_email": "reporter@example.com",
      "incident_location": "Main hallway"
    }
  }'
```

**Expected:**
- Response: 201 with `has_pii: true`
- Console log: "✅ Email notification sent successfully" OR "⚠️ SendGrid not configured"
- Database: Check `reporter_notifications` table for new entry

**Verify notification logged:**

```sql
SELECT
  rn.*,
  i.category
FROM reporter_notifications rn
JOIN incidents i ON i.id = rn.incident_id
ORDER BY rn.created_at DESC
LIMIT 1;
```

**Test Case 3.2.2: Submit report with phone contact**

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Vandalism",
    "description": "Test SMS notification",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "dynamic_fields": {
      "contact_phone": "+15551234567",
      "incident_location": "Parking lot"
    }
  }'
```

**Expected:**
- Response: 201 with `has_pii: true`
- Console log: "✅ SMS notification sent successfully" OR "⚠️ Twilio not configured"
- `reporter_notification_preference` should be 'sms'

**Test Case 3.2.3: Submit report with both email and phone**

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Safety Concern",
    "description": "Test both notification channels",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "dynamic_fields": {
      "contact_email": "reporter@example.com",
      "contact_phone": "+15551234567"
    }
  }'
```

**Expected:**
- Both email and SMS sent
- `reporter_notification_preference` = 'both'

### 3.3 Test Status Change Notifications

**Get an incident ID from previous test:**

```bash
# Get latest incident
psql -d school_safety -c "SELECT id FROM incidents ORDER BY created_at DESC LIMIT 1;"
```

**Update status to 'in_progress':**

```bash
# First, login as admin to get JWT token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }' | jq -r '.token')

# Update incident status
curl -X PUT http://localhost:3001/api/admin/incidents/INCIDENT_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "in_progress",
    "notes": "Staff member assigned to investigate"
  }'
```

**Expected:**
- Response: 200
- Console: "✅ Email notification sent successfully" or "⚠️ SendGrid not configured"
- Email subject: "Your Safety Report is Being Reviewed"
- Database: New entry in `reporter_notifications` with `notification_type = 'assigned_to_staff'`

**Verify notification:**

```sql
SELECT
  notification_type,
  delivery_channel,
  delivery_status,
  sent_at
FROM reporter_notifications
WHERE incident_id = INCIDENT_ID
ORDER BY sent_at DESC;
```

### 3.4 Test False Report Flag Notifications

**Flag incident as false:**

```bash
curl -X POST http://localhost:3001/api/admin/incidents/INCIDENT_ID/flag-false \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Unable to verify incident details",
    "notes": "Reporter did not provide sufficient evidence"
  }'
```

**Expected:**
- Response: 200
- Email notification sent with dispute link
- Email contains: dispute URL, reason, 7-day deadline
- Database: `flagged_as_false = true`, `false_report_reason` populated

**Verify notification content:**

```sql
SELECT
  notification_type,
  template_variables,
  delivery_status
FROM reporter_notifications
WHERE incident_id = INCIDENT_ID AND notification_type = 'flagged_as_false';
```

**Check tracking token generation:**

```sql
SELECT
  id,
  reporter_notification_token
FROM incidents
WHERE id = INCIDENT_ID;
```

**Expected:** 64-character hex token

### 3.5 Test Notification Preferences

**Test Case 3.5.1: No contact information**

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Anonymous Report",
    "description": "No contact info provided",
    "tenant_id": "00000000-0000-0000-0000-000000000001"
  }'
```

**Expected:**
- No notifications sent
- `reporter_notification_preference = 'none'`
- No entries in `reporter_notifications`

### 3.6 Test SendGrid Integration (Optional - Requires API Key)

**Prerequisites:**
- Valid SendGrid API key
- Verified sender email in SendGrid

**Configure .env.local:**

```bash
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=School Safety Alert
```

**Submit report and check SendGrid dashboard:**

1. Submit report with valid email
2. Login to SendGrid dashboard
3. Navigate to Activity Feed
4. Verify email appears with status "Delivered"

**Test email content:**

- Subject line matches template
- Tracking link is functional
- All variables are replaced (no {{variable}} in output)

### 3.7 Test Twilio Integration (Optional - Requires Account)

**Prerequisites:**
- Twilio account with credits
- Verified phone number

**Configure .env.local:**

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_PHONE=+15551234567
```

**Submit report and check Twilio logs:**

1. Submit report with valid phone number
2. Login to Twilio console
3. Check Message logs
4. Verify SMS delivered

---

## Phase 4: Anonymous Tracking Portal

Phase 4 provides a public tracking portal where reporters can view their incident status using a tracking token.

### 4.1 Get Tracking Token

**From database:**

```sql
SELECT
  id,
  category,
  status,
  reporter_notification_token
FROM incidents
WHERE reporter_notification_token IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

**Save the token for testing (should be 64 characters).**

### 4.2 Test Tracking Portal API

**Test Case 4.2.1: Valid tracking token**

```bash
curl http://localhost:3001/api/track/YOUR_64_CHAR_TOKEN
```

**Expected Response:**

```json
{
  "incident": {
    "id": 123,
    "category": "Bullying",
    "description": "Test report",
    "status": "in_progress",
    "created_at": "2025-11-22T10:00:00Z",
    "updated_at": "2025-11-22T11:00:00Z",
    "flagged_as_false": false,
    "false_report_confirmed": false
  },
  "timeline": [
    {
      "type": "status_changed",
      "description": "Status changed from open to in_progress",
      "role": "admin",
      "timestamp": "2025-11-22T11:00:00Z"
    },
    {
      "type": "report_submitted",
      "description": "Report submitted",
      "role": "reporter",
      "timestamp": "2025-11-22T10:00:00Z"
    }
  ],
  "disputes": [],
  "canDispute": false
}
```

**Test Case 4.2.2: Invalid token (wrong length)**

```bash
curl http://localhost:3001/api/track/short-token
```

**Expected:**
- Status: 400
- Response: `{"error": "Invalid tracking token"}`

**Test Case 4.2.3: Non-existent token**

```bash
curl http://localhost:3001/api/track/0000000000000000000000000000000000000000000000000000000000000000
```

**Expected:**
- Status: 404
- Response: `{"error": "Report not found", "message": "This tracking link is invalid or expired"}`

### 4.3 Test Tracking Portal Frontend

**Access the tracking page:**

1. Navigate to: `http://localhost:3000/track/YOUR_64_CHAR_TOKEN`

**Expected UI elements:**
- Report summary card with:
  - Report ID
  - Submission date
  - Status badge (color-coded)
  - Category
  - Description
  - Last updated timestamp
- Activity timeline showing all events in chronological order
- Each timeline event shows:
  - Description
  - Timestamp
  - Actor role
- Footer with privacy notice

**Test responsive design:**
- Desktop: Clean 4-column max-width layout
- Mobile: Stacks properly, readable text

**Test invalid token:**

1. Navigate to: `http://localhost:3000/track/invalid-token`

**Expected:**
- Error page with red alert icon
- Message: "Invalid tracking token" or "Report not found"
- "Return to Homepage" button

### 4.4 Test Timeline Events

**Create multiple events:**

```bash
# 1. Update status
curl -X PUT http://localhost:3001/api/admin/incidents/INCIDENT_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# 2. Add note
curl -X POST http://localhost:3001/api/admin/incidents/INCIDENT_ID/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": "Investigation started"}'

# 3. Update status again
curl -X PUT http://localhost:3001/api/admin/incidents/INCIDENT_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved", "notes": "Issue addressed with counselor"}'
```

**Refresh tracking portal:**

**Expected:**
- Timeline shows all 3+ events
- Events in reverse chronological order (newest first)
- Each event has proper description and timestamp
- Timeline visualization with dots and connecting lines

### 4.5 Test False Report Display in Tracking Portal

**Flag an incident as false:**

```bash
curl -X POST http://localhost:3001/api/admin/incidents/INCIDENT_ID/flag-false \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Unable to verify incident details",
    "notes": "Test flagging"
  }'
```

**View in tracking portal:**

**Expected UI elements:**
- Yellow warning banner with:
  - "Report Flagged as Potentially False" heading
  - Flagging reason displayed
  - "Submit a Dispute" button
  - 7-day deadline notice
- `canDispute` field in API response = `true`

---

## Phase 5: Dispute Submission System

Phase 5 allows reporters to challenge false report flags through a dispute submission form.

### 5.1 Test Dispute Submission API

**Prerequisites:**
- Incident flagged as false (from 4.5)
- Tracking token for that incident

**Test Case 5.1.1: Valid dispute submission**

```bash
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_reason": "This report is accurate. I witnessed the incident myself and can provide additional details if needed.",
    "contact_info": "reporter@example.com",
    "additional_evidence": "The incident occurred at 2pm on 11/20 in the north stairwell. Two other students were present."
  }'
```

**Expected Response:**

```json
{
  "message": "Dispute submitted successfully",
  "dispute": {
    "id": 1,
    "created_at": "2025-11-22T12:00:00Z",
    "status": "pending"
  }
}
```

**Verify in database:**

```sql
SELECT * FROM false_report_disputes WHERE incident_id = INCIDENT_ID;
```

**Expected:**
- `status = 'pending'`
- `dispute_reason` matches submitted text
- `created_at` is current timestamp

**Check event log:**

```sql
SELECT
  event_type,
  event_description,
  actor_role
FROM incident_events
WHERE incident_id = INCIDENT_ID AND event_type = 'dispute_submitted';
```

**Test Case 5.1.2: Duplicate dispute attempt**

```bash
# Try to submit another dispute for same incident
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_reason": "Another dispute attempt"
  }'
```

**Expected:**
- Status: 400
- Response: `{"error": "Dispute already exists", "message": "A dispute has already been submitted..."}`

**Test Case 5.1.3: Missing required fields**

```bash
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:**
- Status: 400
- Response: `{"error": "Dispute reason is required"}`

**Test Case 5.1.4: Dispute reason too long**

```bash
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d "{\"dispute_reason\": \"$(python3 -c 'print("a" * 2001)')\"}"
```

**Expected:**
- Status: 400
- Response: `{"error": "Dispute reason must be less than 2000 characters"}`

**Test Case 5.1.5: Dispute after confirmation**

```bash
# First confirm the false report (super admin only)
curl -X POST http://localhost:3001/api/admin/incidents/INCIDENT_ID/confirm-false \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Now try to dispute
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_reason": "Should not be allowed"
  }'
```

**Expected:**
- Status: 400
- Response: `{"error": "Cannot dispute", "message": "...already been confirmed as false..."}`

### 5.2 Test Dispute Submission Frontend

**Access dispute form:**

1. Navigate to tracking portal: `http://localhost:3000/track/YOUR_TOKEN`
2. Click "Submit a Dispute" button
3. Or directly: `http://localhost:3000/dispute/YOUR_TOKEN`

**Expected UI elements:**
- Header with "Back to Report Status" link
- Report ID displayed
- Yellow info box showing why report was flagged
- Form with three fields:
  - Dispute reason (required, max 2000 chars)
  - Contact info (optional)
  - Additional evidence (optional)
- Character counter for dispute reason
- Submit and Cancel buttons
- "What happens next?" info box at bottom

**Test Case 5.2.1: Submit valid dispute**

1. Fill out form with valid data
2. Click "Submit Dispute"

**Expected:**
- Loading state shown on button ("Submitting...")
- Success page appears with green checkmark
- Success message displayed
- Auto-redirect to tracking portal after 3 seconds
- Dispute appears in tracking portal disputes section

**Test Case 5.2.2: Submit empty form**

1. Click "Submit Dispute" without filling form

**Expected:**
- Alert: "Please provide a reason for your dispute."
- No API call made

**Test Case 5.2.3: Character limit enforcement**

1. Type 2001 characters in dispute reason
2. Try to submit

**Expected:**
- Character counter shows "2001/2000"
- Alert when submitting

**Test Case 5.2.4: Cancel dispute**

1. Fill out form
2. Click "Cancel" button

**Expected:**
- Redirects to tracking portal
- No dispute submitted

**Test Case 5.2.5: Invalid tracking token**

1. Navigate to: `http://localhost:3000/dispute/invalid-token`

**Expected:**
- Error page with message
- "Return to Report Status" button (disabled or links to generic page)

**Test Case 5.2.6: Dispute when not allowed**

1. Use token for non-flagged incident
2. Navigate to dispute page

**Expected:**
- Yellow warning page
- Message: "This report has not been flagged as false"
- "Return to Report Status" button

### 5.3 Test Dispute Display in Tracking Portal

**After submitting dispute:**

1. Return to tracking portal: `http://localhost:3000/track/YOUR_TOKEN`

**Expected:**
- Disputes section visible
- Dispute card showing:
  - Dispute ID
  - Status badge (yellow "PENDING")
  - Submitted date
- False report banner updated:
  - "Submit a Dispute" button hidden
  - Message: "A dispute has been submitted and is under review"

**Update dispute status (simulate admin review):**

```sql
UPDATE false_report_disputes
SET
  status = 'approved',
  resolved_at = NOW(),
  resolved_by = 1,
  resolution_notes = 'Dispute approved - flag removed'
WHERE id = DISPUTE_ID;
```

**Refresh tracking portal:**

**Expected:**
- Dispute status badge: green "APPROVED"
- Resolved date shown

### 5.4 Test Dispute Window Expiration

**Create old flagged incident:**

```sql
-- Update flag date to 8 days ago
UPDATE incidents
SET false_report_marked_at = NOW() - INTERVAL '8 days'
WHERE id = INCIDENT_ID;
```

**Try to submit dispute:**

```bash
curl -X POST http://localhost:3001/api/dispute/YOUR_TRACKING_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_reason": "Should be expired"
  }'
```

**Expected:**
- Status: 400
- Response: `{"error": "Dispute window expired", "message": "Disputes must be submitted within 7 days..."}`

**Check tracking portal:**

**Expected:**
- No "Submit a Dispute" button
- `canDispute = false` in API response

---

## Integration Testing

### End-to-End Workflow

**Test the complete reporter journey:**

**Step 1: Submit report with email**

```bash
curl -X POST http://localhost:3001/report \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Bullying",
    "description": "E2E test report",
    "tenant_id": "00000000-0000-0000-0000-000000000001",
    "dynamic_fields": {
      "contact_email": "e2e-test@example.com",
      "incident_location": "Cafeteria"
    }
  }'
```

**Verify:** Confirmation email sent (if configured)

**Step 2: Get tracking token**

```sql
SELECT id, reporter_notification_token FROM incidents ORDER BY created_at DESC LIMIT 1;
```

**Step 3: View tracking portal**

Navigate to: `http://localhost:3000/track/TOKEN`

**Verify:** Status is "OPEN", timeline shows submission event

**Step 4: Admin updates status**

```bash
curl -X PUT http://localhost:3001/api/admin/incidents/INCIDENT_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "notes": "Investigating"}'
```

**Verify:**
- Status update email sent
- Tracking portal shows new status and timeline event

**Step 5: Admin flags as false**

```bash
curl -X POST http://localhost:3001/api/admin/incidents/INCIDENT_ID/flag-false \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Cannot verify incident details",
    "notes": "Reporter not responsive"
  }'
```

**Verify:**
- False report email sent with dispute link
- Tracking portal shows yellow warning banner
- "Submit a Dispute" button appears

**Step 6: Reporter submits dispute**

Navigate to: `http://localhost:3000/dispute/TOKEN`

Fill out and submit form.

**Verify:**
- Dispute created successfully
- Tracking portal updated with dispute status
- "Submit a Dispute" button disappears

**Step 7: Check all notifications**

```sql
SELECT
  notification_type,
  delivery_channel,
  delivery_status,
  sent_at
FROM reporter_notifications
WHERE incident_id = INCIDENT_ID
ORDER BY sent_at;
```

**Expected notifications:**
1. report_received
2. assigned_to_staff (status to in_progress)
3. flagged_as_false

---

## Troubleshooting

### Common Issues

**Issue 1: Notifications not sending**

**Symptoms:** No console logs, no entries in `reporter_notifications`

**Solution:**
1. Check environment variables are set
2. Verify notification templates exist:
   ```sql
   SELECT COUNT(*) FROM notification_templates;
   ```
   Should return 7.
3. Check console for errors
4. Verify incident has contact info:
   ```sql
   SELECT reporter_contact_email, reporter_contact_phone FROM incidents WHERE id = X;
   ```

**Issue 2: SendGrid returns 401**

**Symptoms:** Error: "SendGrid API error: 401"

**Solution:**
1. Verify API key is correct
2. Check API key permissions in SendGrid dashboard
3. Ensure sender email is verified

**Issue 3: Twilio returns 403**

**Symptoms:** Error: "Twilio API error: 403"

**Solution:**
1. Check account SID and auth token
2. Verify phone number is in E.164 format (+15551234567)
3. For trial accounts, verify recipient number is verified

**Issue 4: Tracking portal shows "Report not found"**

**Symptoms:** 404 error on tracking endpoint

**Solution:**
1. Verify token is exactly 64 characters
2. Check incident has tracking token:
   ```sql
   SELECT id, reporter_notification_token FROM incidents WHERE id = X;
   ```
3. Ensure backend is running

**Issue 5: Cannot submit dispute**

**Symptoms:** 400 error "Cannot dispute"

**Solution:**
1. Check incident is flagged as false:
   ```sql
   SELECT flagged_as_false, false_report_confirmed FROM incidents WHERE id = X;
   ```
2. Verify dispute window (< 7 days since flagging)
3. Check no pending disputes exist:
   ```sql
   SELECT * FROM false_report_disputes WHERE incident_id = X;
   ```

**Issue 6: Timeline events not showing**

**Symptoms:** Empty timeline in tracking portal

**Solution:**
1. Check `incident_events` table:
   ```sql
   SELECT * FROM incident_events WHERE incident_id = X ORDER BY created_at DESC;
   ```
2. Verify events were logged when actions performed
3. Check API response includes timeline array

### Database Verification Queries

**Check notification statistics:**

```sql
SELECT
  notification_type,
  delivery_channel,
  COUNT(*) as count,
  SUM(CASE WHEN delivery_status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN delivery_status = 'failed' THEN 1 ELSE 0 END) as failed
FROM reporter_notifications
GROUP BY notification_type, delivery_channel;
```

**Check dispute statistics:**

```sql
SELECT
  status,
  COUNT(*) as count
FROM false_report_disputes
GROUP BY status;
```

**Check incidents with tracking:**

```sql
SELECT
  COUNT(*) as total_incidents,
  SUM(CASE WHEN reporter_notification_token IS NOT NULL THEN 1 ELSE 0 END) as with_tracking,
  SUM(CASE WHEN flagged_as_false THEN 1 ELSE 0 END) as flagged,
  SUM(CASE WHEN false_report_confirmed THEN 1 ELSE 0 END) as confirmed_false
FROM incidents;
```

---

## Test Checklist

### Phase 3: Reporter Notifications

- [ ] Notification templates created (7 templates)
- [ ] Email notification sent on report submission
- [ ] SMS notification sent on report submission
- [ ] Both channels work when both provided
- [ ] No notification when no contact info
- [ ] Status change triggers notification
- [ ] False report flag triggers notification with dispute link
- [ ] Tracking token generated (64 chars)
- [ ] Notifications logged in database
- [ ] SendGrid integration works (if configured)
- [ ] Twilio integration works (if configured)

### Phase 4: Tracking Portal

- [ ] Tracking API returns correct data
- [ ] Tracking API validates token (400 for invalid)
- [ ] Tracking API returns 404 for non-existent token
- [ ] Tracking portal displays incident details
- [ ] Status badge shows correct color
- [ ] Timeline displays all events
- [ ] Timeline events in correct order
- [ ] False report warning displayed when flagged
- [ ] Dispute button shown when `canDispute = true`
- [ ] Responsive design works on mobile
- [ ] Error page shown for invalid tokens

### Phase 5: Dispute Submission

- [ ] Dispute API accepts valid submissions
- [ ] Dispute API validates required fields
- [ ] Dispute API prevents duplicates
- [ ] Dispute API enforces character limit
- [ ] Dispute API checks confirmation status
- [ ] Dispute API enforces 7-day window
- [ ] Dispute form displays correctly
- [ ] Form validation works
- [ ] Character counter updates
- [ ] Success page displays after submission
- [ ] Disputes display in tracking portal
- [ ] Dispute status badges correct
- [ ] Cancel button works

### Integration

- [ ] Complete E2E workflow successful
- [ ] All notifications sent in correct order
- [ ] Tracking portal updates in real-time
- [ ] Dispute submission affects tracking portal
- [ ] Database consistency maintained

---

## Performance Testing

### Load Testing Tracking Endpoint

```bash
# Using Apache Bench (install with: apt-get install apache2-utils)
ab -n 100 -c 10 http://localhost:3001/api/track/YOUR_TOKEN
```

**Expected:**
- All requests succeed
- Average response time < 200ms

### Concurrent Dispute Submissions

```bash
# Submit multiple disputes simultaneously (should only allow one)
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/dispute/YOUR_TOKEN \
    -H "Content-Type: application/json" \
    -d '{"dispute_reason": "Concurrent test '$i'"}' &
done
wait
```

**Expected:**
- Only 1 dispute created
- Other requests return 400 "Dispute already exists"

---

## Security Testing

### Token Validation

**Test SQL injection in token:**

```bash
curl http://localhost:3001/api/track/"'; DROP TABLE incidents; --"
```

**Expected:** 400 error, no SQL executed

**Test XSS in dispute reason:**

```bash
curl -X POST http://localhost:3001/api/dispute/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_reason": "<script>alert(\"XSS\")</script>"
  }'
```

**Expected:** Data stored as plain text, rendered safely in UI

### PII Protection

**Verify contact info is encrypted:**

```sql
SELECT
  reporter_contact_email,
  reporter_contact_phone
FROM incidents
WHERE reporter_contact_email IS NOT NULL
LIMIT 1;
```

**Expected:** Values are encrypted (not readable plain text)

**Verify tracking portal doesn't expose PII:**

```bash
curl http://localhost:3001/api/track/YOUR_TOKEN | jq .
```

**Expected:** Response contains no email, phone, or other PII

---

## Cleanup

**After testing, clean up test data:**

```sql
-- Delete test notifications
DELETE FROM reporter_notifications WHERE created_at > NOW() - INTERVAL '1 hour';

-- Delete test disputes
DELETE FROM false_report_disputes WHERE created_at > NOW() - INTERVAL '1 hour';

-- Delete test incidents
DELETE FROM incidents WHERE description LIKE '%test%' OR description LIKE '%E2E%';

-- Delete test events
DELETE FROM incident_events WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## Next Steps

After completing Phases 3-5 testing:

1. **Phase 6**: Push notification implementation (FCM)
2. **Phase 6**: Super admin dispute review UI
3. **Phase 6**: Reporter history UI in admin panel
4. **Production deployment**: Configure real SendGrid and Twilio accounts

---

## Support

For issues or questions:
- Check console logs in backend terminal
- Review database for state verification
- Consult `TESTING_GUIDE_PHASE_2.md` for Phase 1-2 features
- Check environment variables are correct

**End of Testing Guide - Phases 3, 4, 5**
