# 🧪 PHASE 2 - COMPREHENSIVE TESTING GUIDE

## Quick Start Testing Checklist

This guide walks you through testing **Phase 1 + Phase 2** of the Admin/Staff App with False Reporting features.

---

## 📋 **Prerequisites**

Before you begin testing, ensure:

✅ **Database migrations have been run** (migrations 021, 022, 023)
✅ **Backend server is running** on `http://localhost:3001`
✅ **You have at least one admin user** in the database
✅ **At least 2-3 test incidents exist** in the database

---

## 🚀 **Setup Steps**

### 1. Start Backend Server

```bash
cd services/backend
npm install  # If not already done
npm run dev
```

**Expected Output:**
```
🚀 School Safety Backend running on port 3001
📊 Health check: http://localhost:3001/health
```

**Verify Backend:**
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T...",
  "service": "school-safety-backend",
  "database": "connected"
}
```

---

### 2. Start Mobile App (Expo)

```bash
cd services/staff-app
npm install  # If not already done
npx expo start
```

**Options:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser (limited functionality)
- Scan QR code with Expo Go app on your phone

---

## 🧪 **PHASE 1: Authentication Testing**

### Test 1.1: Login Flow

**Steps:**
1. Open the mobile app
2. You should see the **Login Screen** automatically
3. Enter valid admin credentials:
   - Email: `admin@yourschool.com` (use your actual admin email)
   - Password: Your password
4. Tap **"Log In"** button

**Expected Results:**
✅ Loading spinner appears
✅ After successful login, you're redirected to **Incidents List** screen
✅ Profile icon appears in the header (shows first letter of your name)

**Negative Test - Invalid Credentials:**
1. Enter wrong password
2. Tap "Log In"
3. Should show error alert: "Login Failed - Invalid email or password"

---

### Test 1.2: Auto-Login on App Restart

**Steps:**
1. Close the app completely
2. Reopen the app

**Expected Results:**
✅ You're automatically logged in
✅ No login screen shown
✅ Incidents list loads immediately

---

### Test 1.3: Profile Screen

**Steps:**
1. From Incidents List, tap the **profile icon** in the header (top right)
2. You're navigated to the Profile screen

**Expected Results:**
✅ Shows your name and email
✅ Shows your role badge (Super Administrator / Administrator / Staff Member)
✅ Shows institution name
✅ Shows verification status
✅ "Logout" button at the bottom

**Test Logout:**
1. Tap "Logout"
2. Confirm in the alert

**Expected Results:**
✅ Alert asks "Are you sure?"
✅ After confirmation, you're logged out
✅ Login screen appears

---

## 📱 **PHASE 1: Incidents List Testing**

### Test 2.1: View All Incidents

**Steps:**
1. Log in
2. You should be on the Incidents List screen

**Expected Results:**
✅ List of incidents from your institution
✅ Each card shows:
  - Incident ID (#123)
  - Status badge (color-coded)
  - Description (truncated)
  - Category and severity
  - Creation timestamp

**Status Colors:**
- 🟠 **Orange** = Open
- 🔵 **Blue** = In Progress
- 🟢 **Green** = Resolved
- ⚫ **Gray** = Closed

---

### Test 2.2: Filter Incidents

**Steps:**
1. Scroll horizontally in the **filter chips** at the top
2. Tap each filter:
   - All
   - Assigned to Me
   - Open
   - In Progress
   - Resolved

**Expected Results:**
✅ Filter chip background changes to blue when selected
✅ List updates to show only matching incidents
✅ Empty state shows "No incidents found" if no matches

**Test "Assigned to Me":**
1. Tap "Assigned to Me" filter
2. Should show only incidents assigned to you
3. If none assigned, shows empty state

---

### Test 2.3: Pull to Refresh

**Steps:**
1. Pull down on the incidents list
2. Release

**Expected Results:**
✅ Loading spinner appears
✅ List refreshes with latest data
✅ Spinner disappears when done

---

## 🔍 **PHASE 2: Incident Detail Screen Testing**

### Test 3.1: View Incident Details

**Steps:**
1. From Incidents List, tap any incident card
2. You're navigated to the **Incident Detail** screen

**Expected Results:**
✅ Shows incident ID and status badge at top
✅ **AI Analysis section** (if available):
  - Severity badge (Critical/High/Medium/Low)
  - AI tags as chips
✅ **Description section** with full text
✅ **Details section** with:
  - Category
  - Location
  - Created timestamp
  - Updated timestamp (if different)
✅ **Timeline section** (if events exist):
  - Shows up to 5 recent events
  - Each event shows description, actor, role, and time
✅ **Notes section** (if notes exist):
  - Shows up to 3 recent notes
  - Each note shows text, author, and time
✅ **Action buttons** at bottom (if incident not closed)

---

### Test 3.2: Add a Note

**Steps:**
1. On Incident Detail screen, tap **"✍️ Add Note"** button
2. A modal slides up from bottom
3. Enter text: "Testing note functionality"
4. Tap **"Add Note"**

**Expected Results:**
✅ Loading spinner appears on button
✅ Success alert: "Note added successfully"
✅ Modal closes
✅ Screen refreshes automatically
✅ Your note now appears in the **Notes section**

**Negative Test - Empty Note:**
1. Tap "Add Note"
2. Leave text field empty
3. Tap "Add Note"
4. Should show error: "Please enter a note"

---

### Test 3.3: Change Status

**Steps:**
1. On Incident Detail screen, tap **"🔄 Change Status"** button
2. Modal appears with 4 status options
3. Select **"In Progress"**
4. Tap **"Update Status"**

**Expected Results:**
✅ Loading spinner appears
✅ Success alert: "Status updated successfully"
✅ Modal closes
✅ Screen refreshes
✅ Status badge updates to blue "In Progress"
✅ New event appears in timeline: "Status changed from..."

**Test Each Status:**
Repeat with:
- Open
- In Progress
- Resolved
- Closed

**Note:** Once status is "Closed", action buttons disappear.

---

### Test 3.4: Assign to Me

**Steps:**
1. Find an incident with status "Open"
2. Tap **"👤 Assign to Me"** button

**Expected Results:**
✅ Loading spinner appears
✅ Success alert: "Incident assigned to you"
✅ Screen refreshes
✅ Status changes to "In Progress" (or "Assigned" depending on backend logic)
✅ New event in timeline: "Incident assigned to..."

---

### Test 3.5: Pull to Refresh on Detail

**Steps:**
1. While on Incident Detail screen, pull down
2. Release

**Expected Results:**
✅ Loading spinner appears
✅ All data refreshes (useful if another admin made changes)

---

## 🚫 **PHASE 2: False Reporting Testing (Backend API)**

**Note:** These tests require API testing tools like **Postman**, **curl**, or **Thunder Client** (VS Code extension).

### Setup for API Testing

**Get Your JWT Token:**
1. Login via the mobile app OR
2. Use login API:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourschool.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Copy the token** for use in subsequent requests.

---

### Test 4.1: Get Incident Detail (API)

```bash
curl -X GET http://localhost:3001/api/admin/incidents/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "incident": {
    "id": 1,
    "category": "Bullying",
    "description": "...",
    "status": "open",
    "ai_meta": { "severity": "medium", "tags": [...] },
    "flagged_as_false": false,
    ...
  },
  "timeline": [ ... ],
  "notes": [ ... ],
  "aiRecommendation": { ... },
  "disputes": [],
  "reporterReputation": null
}
```

---

### Test 4.2: Flag Incident as False Report

```bash
curl -X POST http://localhost:3001/api/admin/incidents/1/flag-false \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Duplicate report",
    "notes": "This is a duplicate of incident #5"
  }'
```

**Expected Response:**
```json
{
  "message": "Incident flagged as false report",
  "incident": {
    "id": 1,
    "flagged_as_false": true,
    "false_report_reason": "Duplicate report",
    ...
  }
}
```

**Verify in Mobile App:**
1. View this incident in the mobile app
2. Should now show **yellow warning banner**:
   - "⚠️ Flagged as False Report"
   - "Reason: Duplicate report"

---

### Test 4.3: Confirm False Report (Super Admin Only)

**Note:** Your account must have `role = 'super_admin'` in the database.

```bash
curl -X POST http://localhost:3001/api/admin/incidents/1/confirm-false \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "finalNotes": "Confirmed after investigation"
  }'
```

**Expected Response:**
```json
{
  "message": "Incident confirmed as false report",
  "incident": {
    "false_report_confirmed": true,
    "status": "closed",
    ...
  }
}
```

**Verify:**
1. Incident status changes to "Closed"
2. Action buttons disappear in mobile app
3. Warning banner shows "✓ Confirmed by Super Admin"

**If Not Super Admin:**
```json
{
  "error": "Insufficient permissions. Super Admin role required."
}
```

---

### Test 4.4: Restore False Report (Overturn)

```bash
curl -X POST http://localhost:3001/api/admin/incidents/1/restore \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Upon further review, report is legitimate"
  }'
```

**Expected Response:**
```json
{
  "message": "Incident restored successfully",
  "incident": {
    "flagged_as_false": false,
    "false_report_confirmed": false,
    "status": "open",
    ...
  }
}
```

**Verify:**
1. Warning banner disappears
2. Status reverts to "Open"
3. Action buttons reappear

---

### Test 4.5: Update Status via API

```bash
curl -X PUT http://localhost:3001/api/admin/incidents/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Investigation started"
  }'
```

**Expected Response:**
```json
{
  "message": "Status updated successfully",
  "incident": {
    "status": "in_progress",
    ...
  }
}
```

**Valid Statuses:**
- `open`
- `in_progress`
- `resolved`
- `closed`

---

### Test 4.6: Get Reporter History

**Note:** You need a `reporter_fingerprint` from an incident. Check the database:

```sql
SELECT id, reporter_fingerprint FROM incidents WHERE reporter_fingerprint IS NOT NULL LIMIT 1;
```

Then:

```bash
curl -X GET http://localhost:3001/api/admin/reporter-history/abc123fingerprint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "reputation": {
    "total_reports": 5,
    "false_reports": 1,
    "verified_reports": 4,
    "reputation_score": 0.85,
    "is_blocked": false
  },
  "incidents": [
    { "id": 1, "category": "Bullying", "status": "resolved", ... },
    ...
  ],
  "isBlocked": false,
  "blockInfo": null,
  "stats": {
    "totalReports": 5,
    "flaggedCount": 1,
    "confirmedFalseCount": 0,
    "byCategory": { "Bullying": 3, "Physical": 2 }
  }
}
```

---

### Test 4.7: Block Reporter

```bash
curl -X POST http://localhost:3001/api/admin/block-reporter \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fingerprint": "abc123fingerprint",
    "reason": "Repeated false reports"
  }'
```

**Expected Response:**
```json
{
  "message": "Reporter blocked successfully",
  "block": {
    "id": 1,
    "fingerprint": "abc123fingerprint",
    "reason": "Repeated false reports",
    ...
  }
}
```

**Verify:**
```bash
# Get reporter history again
curl -X GET http://localhost:3001/api/admin/reporter-history/abc123fingerprint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should show:
```json
{
  "isBlocked": true,
  "blockInfo": {
    "reason": "Repeated false reports",
    "blocked_at": "2025-11-22T..."
  },
  ...
}
```

---

### Test 4.8: Unblock Reporter

```bash
curl -X POST http://localhost:3001/api/admin/unblock-reporter \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fingerprint": "abc123fingerprint"
  }'
```

**Expected Response:**
```json
{
  "message": "Reporter unblocked successfully"
}
```

---

## 🐛 **Common Issues & Troubleshooting**

### Issue 1: "Session expired. Please log in again"

**Cause:** JWT token expired (7 days default)
**Solution:** Logout and login again

---

### Issue 2: "Incident not found"

**Causes:**
1. Incident belongs to different institution (tenant isolation working!)
2. Incident ID doesn't exist
3. Database connection issue

**Solution:** Check that the incident belongs to your institution

---

### Issue 3: Mobile app won't connect to backend

**Check:**
1. Backend server is running: `npm run dev` in `services/backend`
2. Backend accessible: `curl http://localhost:3001/health`
3. If testing on physical device:
   - Backend must be on same network
   - Update API_BASE_URL in `staff-app/api/client.js`
   - Or use ngrok/tunneling

**For Physical Device:**
```javascript
// In services/staff-app/api/client.js
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3001';
// e.g., 'http://192.168.1.100:3001'
```

---

### Issue 4: Database errors

**Check migrations:**
```bash
cd services/backend
npm run migrate
```

Should show:
```
✅ Migrations completed! Executed: X, Skipped: Y
```

---

## 📊 **Database Verification Queries**

### Check if migrations ran:

```sql
SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 5;
```

Should include:
- `021_push_notifications.sql`
- `022_false_reports.sql`
- `023_reporter_notifications.sql`

---

### View incidents with false report flags:

```sql
SELECT
  id,
  category,
  status,
  flagged_as_false,
  false_report_reason,
  false_report_confirmed
FROM incidents
WHERE flagged_as_false = true;
```

---

### Check reporter reputation:

```sql
SELECT
  reporter_fingerprint,
  total_reports,
  false_reports,
  verified_reports,
  reputation_score,
  is_blocked
FROM reporter_reputation;
```

---

### View blocked reporters:

```sql
SELECT
  fingerprint,
  reason,
  blocked_at,
  is_active
FROM blocked_reporters
WHERE is_active = true;
```

---

## ✅ **Complete Test Checklist**

Print this and check off as you test:

**Phase 1 - Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Auto-login on app restart
- [ ] View profile screen
- [ ] Logout successfully

**Phase 1 - Incidents List:**
- [ ] View all incidents
- [ ] Filter by "All"
- [ ] Filter by "Assigned to Me"
- [ ] Filter by "Open"
- [ ] Filter by "In Progress"
- [ ] Filter by "Resolved"
- [ ] Pull to refresh

**Phase 2 - Incident Detail:**
- [ ] View incident details
- [ ] See AI analysis section
- [ ] See timeline events
- [ ] See notes section
- [ ] Add a new note
- [ ] Change status to "In Progress"
- [ ] Change status to "Resolved"
- [ ] Assign incident to me
- [ ] Pull to refresh detail

**Phase 2 - False Reporting (API):**
- [ ] Flag incident as false
- [ ] Confirm false report (super admin)
- [ ] Restore false report
- [ ] View reporter history
- [ ] Block reporter
- [ ] Unblock reporter

---

## 🎯 **Next Steps**

After successful testing of Phase 2:

1. **Report any bugs** you find
2. **Suggest UI improvements**
3. **Ready for Phase 3-6?** Let me know and I'll continue building:
   - Phase 3: Web admin false reporting UI + Email/SMS notifications
   - Phase 4: Push notifications + Tracking portal
   - Phase 5: Disputes + Advanced blocking
   - Phase 6: Final testing + deployment

---

## 📞 **Need Help?**

If you encounter issues:
1. Check backend logs: Look at terminal running `npm run dev`
2. Check mobile logs: Look at Expo terminal
3. Verify database state with SQL queries above
4. Check network connectivity (backend reachable?)

**Happy Testing! 🚀**
