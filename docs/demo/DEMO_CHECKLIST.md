# Pre-Demo System Checklist

## 24 Hours Before Demo

### Environment Setup
- [ ] Verify PWA dev server is running on port 3000
- [ ] Verify backend server is running on port 3001
- [ ] Test database connectivity (PostgreSQL)
- [ ] Clear any previous demo data
- [ ] Reset demo mode flags in localStorage

### System Health
- [ ] Run `npm run lint` on PWA - no errors
- [ ] Test all demo pages load without errors
- [ ] Verify API endpoints responding correctly
- [ ] Check browser console for warnings/errors
- [ ] Test on target browser (Chrome/Firefox/Safari)

### Demo Data
- [ ] Verify DEMO_DATA in `lib/demo.ts` is populated
- [ ] Test demo school slug: `demo-school`
- [ ] Confirm demo incidents are loading
- [ ] Verify heatmap data displays correctly
- [ ] Check safety score calculations

### Features Testing
- [ ] Kiosk page loads at `/kiosk/demo-school?demo=true`
- [ ] Admin demo hub loads at `/admin/demo`
- [ ] All demo tiles are clickable
- [ ] Demo banner appears when demo mode active
- [ ] Guided tour initiates on `/admin/demo?tour=true`

---

## 1 Hour Before Demo

### Technical Setup
- [ ] Close unnecessary browser tabs and applications
- [ ] Clear browser cache and cookies
- [ ] Disable browser extensions that might interfere
- [ ] Set browser zoom to 100%
- [ ] Turn off notifications and "Do Not Disturb" mode
- [ ] Charge laptop to 100% or plug in

### Screen Sharing Setup
- [ ] Test screen sharing in video conferencing tool
- [ ] Set appropriate screen resolution (1920x1080 recommended)
- [ ] Close sensitive/personal information
- [ ] Prepare presenter display mode (if dual monitors)
- [ ] Test audio quality

### Browser Tabs Preparation
Prepare and arrange these tabs in order:
1. [ ] Admin Demo Hub: `http://localhost:3000/admin/demo`
2. [ ] Kiosk: `http://localhost:3000/kiosk/demo-school?demo=true`
3. [ ] Presentation notes (this runbook)
4. [ ] Backup: All demo pages as bookmarks

### Demo Mode Activation
- [ ] Enable demo mode: Set localStorage `demo_mode = "true"`
- [ ] Verify demo banner appears
- [ ] Test quick toggle between demo/production
- [ ] Confirm no real data is visible

### Functionality Tests
- [ ] **Kiosk Test:**
  - [ ] Select category
  - [ ] Enter description
  - [ ] Toggle offline mode
  - [ ] Attach sample image
  - [ ] Submit report
  - [ ] Verify success message

- [ ] **Triage Test:**
  - [ ] Open triage demo page
  - [ ] View AI routing suggestion
  - [ ] Confirm assignment
  - [ ] Check timeline update

- [ ] **Heatmap Test:**
  - [ ] Heatmap renders correctly
  - [ ] Location details show on click
  - [ ] Color intensity appropriate

- [ ] **Safety Score Test:**
  - [ ] Score displays correctly
  - [ ] Charts render properly
  - [ ] Component breakdown visible

- [ ] **Micro-Guides Test:**
  - [ ] Guides list loads
  - [ ] Toggle enable/disable works
  - [ ] Preview mode displays correctly
  - [ ] Generate new guide button works

- [ ] **Guided Tour Test:**
  - [ ] Tour starts automatically with `?tour=true`
  - [ ] All tour steps display correctly
  - [ ] Navigation works (Next/Back/Skip)
  - [ ] Tour completes successfully

### Network & Performance
- [ ] Test internet speed (minimum 5 Mbps for smooth demo)
- [ ] Verify VPN is off (unless required)
- [ ] Close bandwidth-heavy applications
- [ ] Test page load times (all under 2 seconds)

---

## 15 Minutes Before Demo

### Final Checks
- [ ] Restart dev servers for clean state
- [ ] Clear browser localStorage and start fresh
- [ ] Visit each demo page once to "warm up" cache
- [ ] Test microphone and camera (if using video)
- [ ] Have water nearby
- [ ] Silence mobile phone

### Materials Ready
- [ ] Demo script/runbook open
- [ ] Common Q&A sheet accessible
- [ ] Pricing sheet ready (if applicable)
- [ ] Next steps document prepared
- [ ] Case studies/testimonials bookmarked

### Backup Plans
- [ ] Screenshots of all key pages (in case of technical failure)
- [ ] Pre-recorded demo video link ready
- [ ] Alternative demo environment URL (staging/production demo)
- [ ] Technical support contact ready

### Mental Preparation
- [ ] Review key talking points
- [ ] Practice elevator pitch (30 seconds)
- [ ] Prepare for common objections
- [ ] Review prospect's specific needs/pain points

---

## During Demo Checklist

### Introduction (First 2 minutes)
- [ ] Welcome and introduce yourself
- [ ] Confirm attendees can see screen
- [ ] Set expectations (duration, format, Q&A)
- [ ] Ask about their current safety reporting process
- [ ] Ask what they hope to learn from demo

### Demo Flow
- [ ] Follow script in DEMO_RUNBOOK.md
- [ ] Pause for questions after each section
- [ ] Watch time - keep to 12-minute demo core
- [ ] Note questions for follow-up
- [ ] Adjust pace based on audience engagement

### Engagement Tactics
- [ ] Use attendee's school name in examples
- [ ] Ask "Does this address your concern about [X]?"
- [ ] Invite questions throughout (not just at end)
- [ ] Reference specific challenges they mentioned

### Red Flags to Watch For
- [ ] Attendee multitasking (camera off, delayed responses)
- [ ] Frequent "that's nice" without follow-up questions
- [ ] Asking about price before seeing value
- [ ] Decision-maker not present

### Recovery Procedures
If something breaks during demo:
- [ ] Stay calm and acknowledge: "Let me reload this quickly"
- [ ] Use backup screenshots
- [ ] Continue narrative without showing screen
- [ ] Offer to reschedule if major technical issue
- [ ] Send recording afterward

---

## Post-Demo Checklist

### Immediate (Within 5 minutes)
- [ ] Thank attendees for their time
- [ ] Confirm you'll send follow-up email within 2 hours
- [ ] Ask for preferred next steps
- [ ] Get commitment for follow-up meeting (if interested)
- [ ] Confirm email addresses for materials

### Within 2 Hours
- [ ] Send follow-up email with resources
- [ ] Include demo recording link
- [ ] Provide sandbox access credentials
- [ ] Send relevant case studies
- [ ] Schedule follow-up meeting (if committed)

### Within 24 Hours
- [ ] Log demo notes in CRM
- [ ] Update opportunity status
- [ ] Send internal debrief to team
- [ ] Identify any product feedback
- [ ] Queue up next touch point

### Review & Improve
- [ ] What went well?
- [ ] What could be improved?
- [ ] Were there unexpected questions?
- [ ] Should demo script be updated?
- [ ] Were there technical issues?

---

## Emergency Contacts

### Technical Support
- **Dev Team Lead:** [Name] - [Phone] - [Email]
- **DevOps:** [Name] - [Phone] - [Email]
- **Backup Presenter:** [Name] - [Phone]

### Escalation Path
1. Try backup demo environment
2. Use screenshots + verbal explanation
3. Offer to reschedule (within same week)
4. Send pre-recorded demo video

---

## Common Technical Issues & Solutions

### Issue: Demo mode not activating
**Solution:**
```javascript
// Open browser console and run:
localStorage.setItem('demo_mode', 'true');
window.location.reload();
```

### Issue: Kiosk won't submit
**Solution:**
- Check Network tab for failed API calls
- Verify backend is running: `curl http://localhost:3001/health`
- Use "simulate offline" mode as workaround

### Issue: Tour won't start
**Solution:**
- Verify URL has `?tour=true` parameter
- Check browser console for react-joyride errors
- Manually trigger: Click "Full Guided Tour" tile

### Issue: Charts not rendering
**Solution:**
- Hard refresh page (Ctrl+Shift+R)
- Check that recharts loaded: Look for "recharts" in Network tab
- Use Safari/Firefox as backup browser

### Issue: Slow page loads
**Solution:**
- Close other applications
- Reduce screen resolution
- Use Chrome's "Throttling" to simulate normal speed
- Explain: "This is running locally; production is much faster"

---

## Success Metrics

### Demo Quality Indicators
- [ ] Completed in 12-15 minutes
- [ ] No technical issues or recovered smoothly
- [ ] Asked at least 3 questions during demo
- [ ] Discussed specific use cases for their school
- [ ] Scheduled follow-up meeting

### Engagement Signals
- ✅ **Strong Interest:**
  - Asked about pricing/timeline
  - Requested technical deep-dive
  - Mentioned budget cycle
  - Asked about other customers

- ⚠️ **Lukewarm Interest:**
  - Polite but few questions
  - "We'll discuss internally"
  - Asked for materials only
  - No follow-up commitment

- ❌ **Low Interest:**
  - Multitasking during demo
  - Left early
  - "Not right now" with no future date
  - Didn't respond to follow-up

---

## Pre-Demo Self-Test Script

Run this before every demo:

```bash
# 1. Check services are running
curl http://localhost:3000 # Should return 200
curl http://localhost:3001/health # Should return healthy

# 2. Enable demo mode
# Open browser console and run:
localStorage.setItem('demo_mode', 'true');

# 3. Test all demo pages load:
# - http://localhost:3000/admin/demo
# - http://localhost:3000/kiosk/demo-school?demo=true
# - http://localhost:3000/admin/triage-demo?demo=true
# - http://localhost:3000/admin/heatmap-demo?demo=true
# - http://localhost:3000/admin/safety-score-demo?demo=true
# - http://localhost:3000/admin/micro-guides-demo?demo=true

# 4. Test tour
# - http://localhost:3000/admin/demo?tour=true&demo=true

# 5. Check console for errors (should be 0)
```

All green? You're ready to demo! 🚀
