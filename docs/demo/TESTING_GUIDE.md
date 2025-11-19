# Demo Suite Testing Guide
## Complete Step-by-Step Testing Instructions

---

## Prerequisites

### 1. Environment Setup
```bash
# Navigate to PWA directory
cd /home/user/school-safety-app/services/pwa

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Expected output:
```
> school-safety-pwa@0.1.0 dev
> next dev -p 3000

ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 2. Backend Setup (Optional but recommended)
```bash
# In a separate terminal
cd /home/user/school-safety-app/services/backend

# Install and start backend (if available)
npm install
npm run dev
```

---

## Test Suite 1: Demo Mode Activation

### Test 1.1: Enable Demo Mode via Query Parameter
**Steps:**
1. Open browser: `http://localhost:3000/kiosk/demo-school?demo=true`
2. Look for demo banner at top of page

**Expected Result:**
- Purple banner with "🎭 Demo Mode Active" appears at top
- Banner has close button (✕)

**Pass/Fail:** ___

---

### Test 1.2: Enable Demo Mode via LocalStorage
**Steps:**
1. Open browser console (F12)
2. Run: `localStorage.setItem('demo_mode', 'true')`
3. Reload page
4. Check for demo banner

**Expected Result:**
- Demo banner appears
- Banner persists across page reloads

**Pass/Fail:** ___

---

### Test 1.3: Disable Demo Mode
**Steps:**
1. Click ✕ button on demo banner
2. Observe banner disappears
3. Check console: `localStorage.getItem('demo_mode')`

**Expected Result:**
- Banner disappears immediately
- localStorage item removed (returns `null`)

**Pass/Fail:** ___

---

## Test Suite 2: Admin Demo Hub

### Test 2.1: Demo Hub Loads
**Steps:**
1. Navigate to: `http://localhost:3000/admin/demo`
2. Observe page contents

**Expected Result:**
- Page title: "🎭 Demo Command Center"
- 7 demo tiles visible (Kiosk, Triage, Heatmap, Safety Score, Micro-Guides, Full Tour, Demo Reset)
- "Run Full Demo" button present
- Quick Start Guide footer present

**Pass/Fail:** ___

---

### Test 2.2: Demo Tiles Navigation
**Steps:**
1. Click "Kiosk Walkthrough" tile
2. Verify navigation to kiosk page with `?demo=true`
3. Return to demo hub
4. Repeat for each tile

**Tiles to Test:**
- [ ] Kiosk Walkthrough → `/kiosk/demo-school?demo=true`
- [ ] Incident Triage & Routing → `/admin/triage-demo?demo=true`
- [ ] Heatmap & Trends → `/admin/heatmap-demo?demo=true`
- [ ] Safety Score → `/admin/safety-score-demo?demo=true`
- [ ] Micro-Guides → `/admin/micro-guides-demo?demo=true`
- [ ] Full Guided Tour → `/admin/demo?tour=true&demo=true`

**Pass/Fail:** ___

---

### Test 2.3: Demo Reset
**Steps:**
1. Click "Demo Reset" tile
2. Observe confirmation modal appears
3. Click "Cancel" - modal closes
4. Click "Demo Reset" again
5. Click "Reset" button

**Expected Result:**
- Modal displays warning about clearing data
- Cancel button closes modal without action
- Reset button clears localStorage demo items
- Success alert appears

**Pass/Fail:** ___

---

## Test Suite 3: Kiosk Demo Flow

### Test 3.1: Basic Kiosk Functionality
**Steps:**
1. Navigate to: `http://localhost:3000/kiosk/demo-school?demo=true`
2. Observe demo controls section
3. Click "Bullying" category
4. Enter description: "Test incident"
5. Click "Submit Report"

**Expected Result:**
- Demo banner at top
- Yellow "Demo Tools" section visible
- Category modal opens
- Report submits successfully
- Success message with demo note appears

**Pass/Fail:** ___

---

### Test 3.2: Simulate Offline Mode
**Steps:**
1. On kiosk page, click "📴 Simulate Offline"
2. Observe button changes to "📡 Go Online"
3. Status badge changes to "Offline" (red dot)
4. Submit a report while "offline"
5. Check success message

**Expected Result:**
- Button text toggles correctly
- Online status indicator updates
- Report submits to queue
- Success message says "will be sent when connection is restored"

**Pass/Fail:** ___

---

### Test 3.3: Attach Sample Image
**Steps:**
1. Click "📎 Attach Sample Image"
2. Observe attachment preview appears
3. Click ✕ to remove attachment
4. Re-attach and submit report with attachment

**Expected Result:**
- "📷 Sample image attached" message appears
- Remove button clears attachment
- Submission includes attachment reference

**Pass/Fail:** ___

---

## Test Suite 4: Guided Tour

### Test 4.1: Tour Auto-Start
**Steps:**
1. Navigate to: `http://localhost:3000/admin/demo?tour=true`
2. Wait for tour to start (within 1 second)

**Expected Result:**
- Tour tooltip appears in center of screen
- Welcome message displays
- "Next →" button visible
- Tour has 7+ steps

**Pass/Fail:** ___

---

### Test 4.2: Tour Navigation
**Steps:**
1. Click "Next →" through all tour steps
2. Try "← Back" button
3. Observe tour highlighting different elements

**Expected Result:**
- Each step focuses on correct element
- Back button works
- Progress indicator shows current step
- Tour can be completed or skipped

**Pass/Fail:** ___

---

### Test 4.3: Tour Completion
**Steps:**
1. Complete tour by clicking through all steps
2. Check localStorage: `localStorage.getItem('demo_tour_completed')`

**Expected Result:**
- Tour closes on final step
- localStorage marks tour as completed: `"true"`

**Pass/Fail:** ___

---

## Test Suite 5: Triage Demo

### Test 5.1: Triage Page Loads
**Steps:**
1. Navigate to: `http://localhost:3000/admin/triage-demo?demo=true`
2. Observe all sections

**Expected Result:**
- Incident list sidebar (3 incidents)
- Incident details panel
- AI routing suggestion card (blue)
- Timeline section
- All demo data loads from DEMO_DATA

**Pass/Fail:** ___

---

### Test 5.2: Incident Selection
**Steps:**
1. Click different incidents in sidebar
2. Observe details panel updates

**Expected Result:**
- Selected incident highlights (gray background)
- Details update dynamically
- AI suggestion remains consistent
- Timeline updates

**Pass/Fail:** ___

---

### Test 5.3: Assignment Confirmation
**Steps:**
1. Click "Confirm Assignment" button
2. Review modal details
3. Click "Confirm Assignment" in modal
4. Observe timeline update

**Expected Result:**
- Modal displays incident details and rationale
- Confirmation adds new timeline entry
- Timeline shows "Assigned to [Role]" with green dot
- Success alert displays
- Button changes to "✓ Assigned"

**Pass/Fail:** ___

---

## Test Suite 6: Heatmap Demo

### Test 6.1: Heatmap Renders
**Steps:**
1. Navigate to: `http://localhost:3000/admin/heatmap-demo?demo=true`
2. Observe heatmap grid

**Expected Result:**
- Stats cards show total incidents, locations, highest activity
- Grid displays 8 locations with color coding
- Legend shows 5 intensity levels
- Colors range from green (low) to red (high)

**Pass/Fail:** ___

---

### Test 6.2: Location Interaction
**Steps:**
1. Click on "Cafeteria" cell (should be red/highest)
2. Observe details card appears
3. Click on "Library" cell (should be green/low)
4. Close details by clicking ✕

**Expected Result:**
- Details card shows location name, incident count, severity
- Recommended action changes based on severity
- Close button removes details card

**Pass/Fail:** ___

---

### Test 6.3: Insights Display
**Steps:**
1. Scroll to bottom
2. Read "Key Insights" section

**Expected Result:**
- 4 bullet points with actionable insights
- Insights reference specific locations (Cafeteria, Parking, Library)
- Formatting is clean and readable

**Pass/Fail:** ___

---

## Test Suite 7: Safety Score Demo

### Test 7.1: Score Dashboard Loads
**Steps:**
1. Navigate to: `http://localhost:3000/admin/safety-score-demo?demo=true`
2. Observe score card and charts

**Expected Result:**
- Overall score: 72 with grade "C"
- Trend indicator shows "improving" (green arrow)
- Previous score: 68
- Component breakdown bar chart renders
- 6-month trend line chart renders

**Pass/Fail:** ___

---

### Test 7.2: Component Breakdown
**Steps:**
1. Hover over bars in component chart
2. Scroll to component list below chart
3. Verify 5 components with progress bars

**Expected Result:**
- Chart tooltip shows scores on hover
- 5 components: Response Time, Incident Resolution, Prevention Programs, Student Engagement, Staff Training
- Progress bars match chart values
- Color coding: green (80+), orange (60-80), red (<60)

**Pass/Fail:** ___

---

### Test 7.3: Recommendations
**Steps:**
1. Scroll to recommendations section
2. Review priority badges

**Expected Result:**
- 3 recommendations with different priorities (HIGH, MEDIUM, LOW)
- Color coding: red (high), orange (medium), green (low)
- Each has actionable suggestion

**Pass/Fail:** ___

---

## Test Suite 8: Micro-Guides Demo

### Test 8.1: Guides Management
**Steps:**
1. Navigate to: `http://localhost:3000/admin/micro-guides-demo?demo=true`
2. Observe guides list (3 guides initially)
3. Toggle first guide off/on using switch

**Expected Result:**
- Header shows "Active Guides (3/3)"
- Toggle switch changes color (gray/green)
- Active count updates when toggling
- Guide selection highlights item

**Pass/Fail:** ___

---

### Test 8.2: Guide Preview
**Steps:**
1. Select a guide from list
2. Click "👁️ Preview Mode" button
3. Observe kiosk preview

**Expected Result:**
- Kiosk mockup displays in center
- Guide shown as yellow card with icon
- Title and content match selected guide
- Rotation note appears below

**Pass/Fail:** ___

---

### Test 8.3: Guide Editing
**Steps:**
1. Click "📝 Edit Mode"
2. Change guide title
3. Modify content
4. Click "💾 Save"

**Expected Result:**
- Form fields populated with guide data
- Changes update in form
- Save button shows success alert
- Priority and status dropdowns work

**Pass/Fail:** ___

---

### Test 8.4: AI Guide Generation
**Steps:**
1. Click "✨ Generate New Guide (AI)"
2. Wait for new guide to appear
3. Observe alert message

**Expected Result:**
- New guide added to list
- Guide auto-selected and in edit mode
- Alert shows "AI Micro-Guide Generated"
- New guide has placeholder content

**Pass/Fail:** ___

---

## Test Suite 9: One-Click Demo Runner

### Test 9.1: Run Full Demo
**Steps:**
1. Navigate to: `http://localhost:3000/admin/demo`
2. Click "▶️ Run Full Demo" button
3. Observe browser behavior

**Expected Result:**
- New tab opens with kiosk
- Alert with instructions appears (if auto-open fails)
- Demo mode enabled in localStorage
- Current tab stays on demo hub or navigates to tour

**Pass/Fail:** ___

---

### Test 9.2: Demo API Endpoint
**Steps:**
1. Open browser console
2. Run:
```javascript
fetch('/api/demo-run', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

**Expected Result:**
- Response includes: `{success: true, message: "...", data: {...}}`
- Data includes demo school info
- No errors in console

**Pass/Fail:** ___

---

## Test Suite 10: Cross-Browser Testing

### Test 10.1: Chrome
**Steps:**
1. Test all features in Google Chrome
2. Check for console errors

**Result:** ___

---

### Test 10.2: Firefox
**Steps:**
1. Test key features in Firefox
2. Verify charts render correctly

**Result:** ___

---

### Test 10.3: Safari (if available)
**Steps:**
1. Test on Safari
2. Check localStorage functionality

**Result:** ___

---

## Test Suite 11: Mobile Responsiveness

### Test 11.1: Kiosk on Mobile
**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone or Android device
4. Navigate to kiosk page

**Expected Result:**
- Layout adjusts to mobile screen
- Buttons are touch-friendly
- No horizontal scrolling
- Demo controls stack vertically

**Pass/Fail:** ___

---

### Test 11.2: Admin Hub on Tablet
**Steps:**
1. Set device to iPad size in DevTools
2. Navigate to demo hub
3. Test tile interaction

**Expected Result:**
- Tiles responsive grid (2 columns on tablet)
- Touch targets adequate
- No layout breaks

**Pass/Fail:** ___

---

## Test Suite 12: Performance

### Test 12.1: Page Load Times
**Steps:**
1. Open DevTools Network tab
2. Hard refresh each demo page (Ctrl+Shift+R)
3. Note load time

**Expected Results:**
- Each page loads under 3 seconds
- No failed requests
- All resources load successfully

**Load Times:**
- Demo Hub: ___ ms
- Kiosk: ___ ms
- Triage: ___ ms
- Heatmap: ___ ms
- Safety Score: ___ ms
- Micro-Guides: ___ ms

---

### Test 12.2: Bundle Size
**Steps:**
1. Check Network tab for JavaScript bundle sizes
2. Verify recharts and react-joyride loaded

**Expected Result:**
- Main bundle under 500KB
- Charts library loads on-demand
- No duplicate libraries

**Pass/Fail:** ___

---

## Integration Testing Scenarios

### Scenario 1: Complete Demo Flow
**Steps:**
1. Start at `/admin/demo`
2. Click "Run Full Demo"
3. In kiosk tab: Submit report
4. Return to admin: View in triage
5. Confirm assignment
6. Check all analytics pages

**Expected Result:**
- Seamless flow between all pages
- Data consistency across views
- Demo mode persists throughout

**Pass/Fail:** ___

---

### Scenario 2: First-Time User Experience
**Steps:**
1. Clear all localStorage
2. Navigate to `/admin/demo?tour=true`
3. Complete guided tour
4. Explore each demo tile

**Expected Result:**
- Tour provides clear guidance
- No confusion about navigation
- All features self-explanatory

**Pass/Fail:** ___

---

## Accessibility Testing

### Test A11y-1: Keyboard Navigation
**Steps:**
1. Navigate demo hub using only Tab key
2. Activate tiles with Enter/Space
3. Navigate tour with keyboard

**Expected Result:**
- All interactive elements focusable
- Focus visible
- Logical tab order

**Pass/Fail:** ___

---

### Test A11y-2: Screen Reader (Optional)
**Steps:**
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate through demo pages

**Expected Result:**
- Headings announced correctly
- Buttons have descriptive labels
- Images have alt text

**Pass/Fail:** ___

---

## Summary

### Test Results
- **Total Tests:** 40+
- **Passed:** ___
- **Failed:** ___
- **Skipped:** ___

### Critical Issues Found
1. ___
2. ___
3. ___

### Minor Issues Found
1. ___
2. ___
3. ___

### Recommendations
1. ___
2. ___
3. ___

---

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Environment:** Development / Staging / Production
**Browser(s):** ___________________
**Status:** ✅ Ready for Demo / ⚠️ Needs Fixes / ❌ Not Ready
