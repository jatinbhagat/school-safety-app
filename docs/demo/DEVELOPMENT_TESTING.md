# Development & Testing Instructions
## Complete Step-by-Step Guide to Access and Test the Demo Suite

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git
- Modern web browser (Chrome, Firefox, or Safari)
- Terminal/command line access

---

## Part 1: Initial Setup

### Step 1: Navigate to PWA Directory
```bash
cd /home/user/school-safety-app/services/pwa
```

### Step 2: Install Dependencies
```bash
npm install
```

Expected packages to be installed:
- react-joyride (for guided tours)
- recharts (for charts and graphs)
- All existing Next.js dependencies

### Step 3: Start Development Server
```bash
npm run dev
```

You should see:
```
> school-safety-pwa@0.1.0 dev
> next dev -p 3000

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Keep this terminal window open. The server must be running for all tests.

---

## Part 2: Accessing the Demo Suite

### Option A: Direct URL Access

1. **Admin Demo Hub (Main Entry Point)**
   ```
   http://localhost:3000/admin/demo
   ```
   This is your command center for all demo features.

2. **With Demo Mode Pre-Enabled**
   ```
   http://localhost:3000/admin/demo?demo=true
   ```

3. **With Guided Tour Auto-Start**
   ```
   http://localhost:3000/admin/demo?tour=true&demo=true
   ```

### Option B: Manual Demo Mode Activation

1. Open browser and navigate to any page:
   ```
   http://localhost:3000
   ```

2. Open browser console (F12 or Ctrl+Shift+J / Cmd+Option+J)

3. Run this command:
   ```javascript
   localStorage.setItem('demo_mode', 'true');
   window.location.reload();
   ```

4. Purple demo banner should appear at the top

5. Navigate to:
   ```
   http://localhost:3000/admin/demo
   ```

---

## Part 3: Complete Demo Walkthrough

### 3.1: Admin Demo Hub

**URL:** `http://localhost:3000/admin/demo`

**What to Look For:**
- [ ] Page title: "🎭 Demo Command Center"
- [ ] 7 colorful demo tiles displayed in grid
- [ ] "▶️ Run Full Demo" button in header
- [ ] "← Back to Admin" button
- [ ] Footer with Quick Start Guide

**Interactive Test:**
1. Hover over each tile - should show pointer cursor
2. Click "Kiosk Walkthrough" tile
3. Verify you're redirected to kiosk with `?demo=true` parameter
4. Click browser back button to return to demo hub

---

### 3.2: Kiosk Demo Flow

**URL:** `http://localhost:3000/kiosk/demo-school?demo=true`

**What to Look For:**
- [ ] Purple demo banner at top
- [ ] Yellow "Demo Tools" section below header
- [ ] Two demo buttons: "Simulate Offline" and "Attach Sample Image"
- [ ] 8 colorful category buttons
- [ ] Online/Offline status badge

**Interactive Test - Basic Report:**
1. Click "Bullying" category button
2. Modal should open
3. Enter description: "Test bullying incident in cafeteria"
4. Click "Submit Report"
5. Wait for success message
6. Success message should include: "💡 In demo mode - check Admin Dashboard"

**Interactive Test - Offline Mode:**
1. Click "📴 Simulate Offline" button
2. Button should change to "📡 Go Online"
3. Status badge should show red dot and "Offline"
4. Submit a report while offline
5. Success message should say "will be sent when connection is restored"
6. Click "📡 Go Online"
7. Status returns to green "Online"

**Interactive Test - Image Attachment:**
1. Open category modal
2. Click "📎 Attach Sample Image" button
3. Yellow box appears: "📷 Sample image attached"
4. Click ✕ to remove attachment
5. Attachment preview disappears

---

### 3.3: Incident Triage & Routing

**URL:** `http://localhost:3000/admin/triage-demo?demo=true`

**What to Look For:**
- [ ] Left sidebar with 3 demo incidents
- [ ] Main panel showing incident details
- [ ] Blue "AI Routing Suggestion" card with 87% confidence
- [ ] Alternative routing options
- [ ] Incident timeline at bottom

**Interactive Test:**
1. Click different incidents in sidebar
2. Details panel should update
3. Note the AI suggestion: "School Counselor" with rationale
4. Click "Confirm Assignment" button
5. Modal appears asking for confirmation
6. Click "Confirm Assignment" in modal
7. Alert shows: "✅ Assignment Confirmed!"
8. Timeline updates with new entry (green dot)
9. Button changes to "✓ Assigned"

---

### 3.4: Heatmap & Trends

**URL:** `http://localhost:3000/admin/heatmap-demo?demo=true`

**What to Look For:**
- [ ] 3 stat cards showing totals
- [ ] Grid of 8 colored location cells
- [ ] Color legend with 5 levels (green to red)
- [ ] Key insights section at bottom

**Interactive Test:**
1. Find "Cafeteria" cell (should be red - highest incidents)
2. Click on it
3. Details card appears below grid
4. Shows: Name, Incidents count, Severity, Recommended Action
5. Click ✕ to close details
6. Click on "Library" cell (should be green - low incidents)
7. Details show different recommendation for low-severity

**Visual Check:**
- Cafeteria should be RED (12 incidents)
- Parking Lot should be ORANGE/RED (9 incidents)
- Library should be GREEN (3 incidents)
- Colors should match legend

---

### 3.5: Safety Score Dashboard

**URL:** `http://localhost:3000/admin/safety-score-demo?demo=true`

**What to Look For:**
- [ ] Large "72" score with grade "C"
- [ ] Green upward arrow showing "improving"
- [ ] Bar chart showing 5 components
- [ ] Line chart showing 6-month trend
- [ ] Yellow recommendations section at bottom

**Interactive Test:**
1. Hover over bars in component chart - tooltips should appear
2. Scroll to component list below chart
3. Verify 5 progress bars match chart values
4. Check line chart shows upward trend
5. Review 3 recommendations (HIGH, MEDIUM, LOW priority)

**Data Verification:**
- Overall Score: 72
- Previous Score: 68 (improvement of +4)
- Response Time: 85/100 (highest)
- Student Engagement: 60/100 (lowest - HIGH priority recommendation)

---

### 3.6: Micro-Guides Management

**URL:** `http://localhost:3000/admin/micro-guides-demo?demo=true`

**What to Look For:**
- [ ] Left sidebar with 3 guides
- [ ] Toggle switches next to each guide (green = enabled)
- [ ] Right panel for editing/previewing
- [ ] "✨ Generate New Guide (AI)" button
- [ ] "👁️ Preview Mode" toggle button

**Interactive Test - Preview:**
1. Click first guide in list
2. Guide highlights with gray background
3. Click "👁️ Preview Mode" button
4. Kiosk mockup appears showing guide as yellow card
5. Note displays: "This card rotates every 20-30 seconds"
6. Click "📝 Edit Mode" to return

**Interactive Test - Editing:**
1. Select a guide
2. Ensure in Edit Mode
3. Change title to: "Updated Guide Title"
4. Modify content text
5. Change priority number
6. Click "💾 Save"
7. Alert confirms: "Micro-guide saved successfully!"

**Interactive Test - Toggle:**
1. Toggle first guide off (switch turns gray)
2. Header count changes from "3/3" to "2/3"
3. Toggle back on
4. Count returns to "3/3"

**Interactive Test - AI Generation:**
1. Click "✨ Generate New Guide (AI)"
2. New guide appears in list with placeholder content
3. Guide auto-selected in edit mode
4. Alert shows: "✨ AI Micro-Guide Generated!"

---

### 3.7: Guided Tour

**URL:** `http://localhost:3000/admin/demo?tour=true&demo=true`

**What to Look For:**
- [ ] Tour starts automatically within 1 second
- [ ] First tooltip appears in center with welcome message
- [ ] "Next →" and "Skip Tour" buttons visible
- [ ] Purple theme matching branding

**Interactive Test:**
1. Read welcome message
2. Click "Next →"
3. Tour highlights "Demo Command Center" section
4. Click "Next →" through all 7 steps
5. Each step highlights different element:
   - Demo tiles grid
   - Kiosk tile
   - Triage tile
   - Heatmap tile
   - Safety Score tile
   - Run Demo button
   - Final completion message
6. Click "Finish" on last step
7. Tour closes

**Test Skip Feature:**
1. Reload page with `?tour=true`
2. Click "Skip Tour" on first step
3. Tour closes immediately

**Test Navigation:**
1. Start tour
2. Click "Next →" twice
3. Click "← Back"
4. Should return to previous step

---

### 3.8: One-Click Demo Runner

**URL:** `http://localhost:3000/admin/demo`

**Interactive Test:**
1. Click "▶️ Run Full Demo" button
2. One of two things happens:

   **Option A (if backend running):**
   - New tab opens with kiosk
   - Alert appears with instructions
   - Current tab may navigate to tour

   **Option B (no backend):**
   - Alert appears with manual instructions:
     ```
     Demo Mode Activated!

     1. Use the kiosk tab to submit a demo report
     2. Return here to see it in the admin dashboard
     3. Explore each demo tile for specific features
     ```
   - May attempt to open kiosk in new tab

3. If new kiosk tab opened, submit a report there
4. Return to admin demo hub
5. Explore other tiles to see the ecosystem

---

### 3.9: Demo Reset

**URL:** `http://localhost:3000/admin/demo`

**Interactive Test:**
1. Scroll to "Demo Reset" tile (gray, with 🔄 icon)
2. Click "Reset Demo" button
3. Confirmation modal appears
4. Read warning message
5. Click "Cancel" - modal closes
6. Click "Reset Demo" again
7. Click "Reset" button in modal
8. Brief loading state ("Resetting...")
9. Success alert: "Demo data has been reset successfully!"
10. Open browser console and verify:
    ```javascript
    localStorage.getItem('demo_offline_mode') // null
    localStorage.getItem('demo_incidents') // null
    localStorage.getItem('demo_tour_completed') // null
    ```

---

## Part 4: Mobile/Responsive Testing

### Test on Mobile View

1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" icon (or Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar
4. Navigate to kiosk: `http://localhost:3000/kiosk/demo-school?demo=true`

**What to Check:**
- [ ] Category buttons stack nicely
- [ ] Demo tools section readable
- [ ] Modal fills screen appropriately
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough (44px minimum)

### Test on Tablet View

1. In DevTools, select "iPad" or "iPad Pro"
2. Navigate to demo hub: `http://localhost:3000/admin/demo`

**What to Check:**
- [ ] Tiles arrange in 2-column grid
- [ ] All text is readable
- [ ] Buttons are accessible
- [ ] No layout breaks

---

## Part 5: Cross-Browser Testing

### Google Chrome
```bash
# Already tested above
```
**Status:** ✅ Primary development browser

### Firefox
1. Open Firefox
2. Navigate to `http://localhost:3000/admin/demo`
3. Test key features:
   - [ ] Tour works
   - [ ] Charts render (recharts)
   - [ ] Modals display correctly
   - [ ] Demo mode toggle works

### Safari (Mac only)
1. Open Safari
2. Enable Developer menu: Preferences → Advanced → Show Develop menu
3. Navigate to demo hub
4. Test localStorage functionality
5. Verify tour and charts work

---

## Part 6: Performance Testing

### Page Load Times

**Test with Network Tab:**
1. Open DevTools → Network tab
2. Hard refresh each page (Ctrl+Shift+R)
3. Check "Load" time at bottom

**Target Times:**
- Demo Hub: < 2 seconds
- Kiosk: < 1.5 seconds
- Triage/Heatmap/Safety Score: < 2.5 seconds
- Micro-Guides: < 2 seconds

**If Slow:**
- Check if backend is responding slowly
- Clear browser cache
- Disable browser extensions
- Check for console errors

### Bundle Size Check

1. Open DevTools → Network tab
2. Filter by "JS"
3. Look for main bundle size

**Expected:**
- Main bundle: ~400-600 KB
- recharts: ~200 KB (loaded on-demand)
- react-joyride: ~50 KB

---

## Part 7: Error Scenarios

### Test 7.1: Backend Not Running

**Setup:**
1. Stop backend server (if running)
2. Navigate to kiosk

**Expected Behavior:**
- Kiosk still loads
- Demo mode still works
- Reports queue in localStorage (offline mode)
- No crashes or blank pages

### Test 7.2: Demo Mode Disabled

**Setup:**
1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/admin/demo` without `?demo=true`

**Expected Behavior:**
- Page works normally
- No demo banner
- All tiles functional
- Can still enable demo mode manually

### Test 7.3: Invalid Routes

**Test:**
1. Navigate to `http://localhost:3000/admin/invalid-demo`

**Expected:**
- 404 page or graceful error
- Not a crash

---

## Part 8: Data Persistence

### Test LocalStorage Persistence

1. Enable demo mode
2. Submit a kiosk report in offline mode
3. Close browser completely
4. Reopen browser
5. Return to kiosk page

**Expected:**
- Demo mode still active (if you didn't clear localStorage)
- Offline queue persists
- Tour completion state persists

### Test Session Flow

1. Start guided tour
2. Complete halfway
3. Refresh page
4. Navigate to `/admin/demo?tour=true`

**Expected:**
- Tour restarts from beginning (by design)
- Tour completion flag cleared on refresh

---

## Part 9: Console Checks

Throughout all testing, keep browser console open (F12).

**Should NOT see:**
- ❌ Red errors
- ❌ Failed network requests (except expected ones when backend off)
- ❌ React warnings about keys or hooks

**Should see (acceptable):**
- ⚠️ Warnings about deprecated dependencies (from packages)
- ℹ️ Info logs from demo functions
- ✅ Success logs from demo actions

---

## Part 10: Acceptance Criteria Checklist

Before considering testing complete, verify:

### Functionality
- [ ] All 7 demo tiles navigate correctly
- [ ] Guided tour completes without errors
- [ ] Kiosk submits reports in both online and offline modes
- [ ] Triage page allows assignment confirmation
- [ ] Heatmap displays and allows location selection
- [ ] Safety score charts render correctly
- [ ] Micro-guides can be toggled, edited, and previewed
- [ ] Demo reset clears localStorage
- [ ] Demo mode banner appears and can be dismissed

### User Experience
- [ ] No confusing error messages
- [ ] Loading states are clear
- [ ] Buttons provide visual feedback (hover, click)
- [ ] Modals can be closed with ✕ or Cancel
- [ ] Navigation feels natural and intuitive
- [ ] Demo mode is obviously indicated

### Performance
- [ ] All pages load in < 3 seconds
- [ ] No lag when clicking buttons
- [ ] Charts render smoothly
- [ ] Tour navigation is responsive

### Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari (if available)
- [ ] Responsive on mobile sizes
- [ ] Responsive on tablet sizes

### Code Quality
- [ ] No console errors
- [ ] TypeScript types compile without errors
- [ ] Follows existing code structure
- [ ] Demo logic isolated from production

---

## Troubleshooting Common Issues

### Issue: "Cannot GET /admin/demo"

**Solution:**
```bash
# Ensure you're in PWA directory
cd services/pwa

# Restart dev server
npm run dev
```

### Issue: Demo banner doesn't appear

**Solution:**
```javascript
// Open console and check:
localStorage.getItem('demo_mode') // Should return "true"

// If null, set it:
localStorage.setItem('demo_mode', 'true');
window.location.reload();
```

### Issue: Charts don't render

**Solution:**
```bash
# Ensure recharts is installed
npm list recharts

# If not found, install:
npm install recharts

# Restart dev server
```

### Issue: Tour doesn't start

**Solution:**
```bash
# Check react-joyride is installed
npm list react-joyride

# If not found:
npm install react-joyride

# Clear cache and reload
```

### Issue: Kiosk offline mode doesn't work

**Solution:**
```javascript
// Check localStorage:
localStorage.getItem('demo_offline_mode')

// Should toggle between "true" and "false"
// If stuck, clear it:
localStorage.removeItem('demo_offline_mode');
```

---

## Quick Test Script

Run this complete test in under 5 minutes:

1. ✅ Open `http://localhost:3000/admin/demo`
2. ✅ Click "Full Guided Tour" → Complete tour
3. ✅ Click "Kiosk Walkthrough" → Submit report
4. ✅ Return to demo hub → Click "Triage & Routing"
5. ✅ Confirm assignment
6. ✅ Return → Click "Heatmap" → Click location
7. ✅ Return → Click "Safety Score" → View charts
8. ✅ Return → Click "Micro-Guides" → Toggle guide
9. ✅ Return → Click "Demo Reset" → Confirm
10. ✅ Verify localStorage cleared

If all steps complete without errors: **✅ TESTS PASS**

---

## Reporting Issues

If you find bugs:

1. Note the exact URL where error occurred
2. Copy error message from console (if any)
3. Describe steps to reproduce
4. Note browser and version
5. Include screenshot if helpful

Create an issue in GitHub or document in test results.

---

## Success Criteria

**Demo suite is ready for production when:**
- All 10 parts of this testing guide pass
- No console errors during normal flow
- Works in Chrome, Firefox, and Safari
- Responsive on mobile and tablet
- All documentation is accurate
- Performance targets met

**Current Status:** ___ (to be filled after testing)

**Tester Name:** _______________
**Date:** _______________
**Time Spent:** _______________ minutes
