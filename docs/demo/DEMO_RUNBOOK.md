# Demo Runbook: School Safety App
## 12-Minute Presenter Script

**Target Audience:** School administrators, safety coordinators, district leadership

**Objective:** Demonstrate the complete safety reporting workflow from student report to admin response

---

## Pre-Demo Setup (5 minutes before)

### Checklist
- [ ] Open Admin Demo Hub: `http://localhost:3000/admin/demo`
- [ ] Enable demo mode via localStorage or query param
- [ ] Prepare two browser windows/tabs:
  - Tab 1: Kiosk (`/kiosk/demo-school?demo=true`)
  - Tab 2: Admin Dashboard (`/admin/demo`)
- [ ] Test internet connectivity
- [ ] Clear previous demo data if needed
- [ ] Have presentation notes ready

---

## Demo Script (12 minutes)

### INTRODUCTION (1 minute)
**Script:**
> "Thank you for joining today's demonstration of our School Safety App. Over the next 12 minutes, I'll walk you through our complete safety reporting system, from a student's anonymous report to the administrative response. This system combines cutting-edge AI technology with privacy-first design to help schools respond faster and smarter to safety concerns."

**Action:** Show Admin Demo Hub

---

### PART 1: Student Kiosk Experience (3 minutes)

**Script:**
> "Let's start where everything begins - the student-facing kiosk. This is what students see when they want to report a safety concern."

**Actions:**
1. Switch to Kiosk tab
2. Point out key features:
   - Anonymous reporting (no login required)
   - Simple category selection
   - Clean, non-intimidating interface
   - Online/Offline status indicator

**Script:**
> "Notice the offline/online indicator. Our system works even without internet connectivity - reports are queued locally and automatically sync when connection is restored."

**Demonstration:**
1. Click "Simulate Offline" button
2. Select category: "Bullying"
3. Add description: "Student being bullied in cafeteria during lunch"
4. Click "Attach Sample Image" to show file attachment capability
5. Submit report

**Script:**
> "The report is now safely queued. When connectivity returns, it will automatically sync to our backend. This ensures no report is ever lost, even during network outages."

6. Click "Go Online"
7. Show success message

---

### PART 2: AI-Powered Triage (3 minutes)

**Script:**
> "Now let's see what happens on the administrative side. Within seconds of receiving a report, our AI analyzes it and provides intelligent routing suggestions."

**Actions:**
1. Switch to Admin Demo Hub
2. Click "Incident Triage & Routing" tile

**Script:**
> "Here's our AI triage dashboard. Notice several key elements:"

**Point out:**
- Recent incidents list with severity badges
- Incident details panel
- AI routing suggestion with confidence score
- Alternative routing options
- Incident timeline

**Script:**
> "The AI has analyzed this bullying report and recommends routing it to a School Counselor with 87% confidence. The rationale explains why: this incident involves emotional distress and requires counseling support."

**Demonstration:**
1. Click "Confirm Assignment"
2. Show modal confirmation
3. Confirm the assignment
4. Point out updated timeline

**Script:**
> "With one click, the incident is assigned, the timeline is updated, and the counselor receives a notification. What used to take 15-20 minutes now happens in seconds."

---

### PART 3: Data Visualization & Analytics (2 minutes)

**Script:**
> "Let's look at how administrators can identify patterns and trends."

**Actions:**
1. Return to Demo Hub
2. Click "Heatmap & Trends"

**Script:**
> "This heatmap shows incident frequency across different school locations. The color intensity indicates hotspots - areas requiring increased attention."

**Point out:**
- Cafeteria (highest incidents)
- Parking lot (needs attention)
- Library (low incidents - best practices)
- Key insights panel

**Actions:**
1. Return to Demo Hub
2. Click "Safety Score"

**Script:**
> "Our Safety Score Dashboard provides a comprehensive view of your school's safety metrics. The overall score of 72 is calculated from five weighted components."

**Point out:**
- Overall score with trend indicator
- Component breakdown chart
- 6-month historical trend
- Specific recommendations

---

### PART 4: Preventive Tools (2 minutes)

**Script:**
> "Beyond reactive response, our system includes preventive education tools."

**Actions:**
1. Return to Demo Hub
2. Click "Micro-Guides"

**Script:**
> "Micro-guides are bite-sized educational content that rotates on the kiosk screen. They proactively educate students about resources, policies, and how to help others."

**Demonstration:**
1. Click preview mode on a guide
2. Show kiosk preview
3. Point out AI generation capability

**Script:**
> "You can create guides manually or use AI to generate content based on your incident patterns and school policies."

---

### PART 5: One-Click Demo & Guided Tour (1 minute)

**Script:**
> "Everything we just walked through can be automated with our One-Click Full Demo feature."

**Actions:**
1. Return to Demo Hub
2. Point out "Run Full Demo" button
3. Point out "Full Guided Tour" tile

**Script:**
> "The guided tour uses interactive tooltips to walk through every feature at your own pace. Perfect for training new staff or familiarizing yourself with the system."

---

### CONCLUSION & Q&A (1 minute)

**Script:**
> "To summarize what you've seen today:
> - Anonymous, offline-capable student reporting
> - AI-powered intelligent incident routing
> - Real-time analytics and pattern detection
> - Proactive prevention through education
> - All while maintaining complete privacy and compliance
>
> The demo environment is completely isolated from production - no real data is affected. Everything you've seen runs behind a simple demo mode toggle.
>
> I'm happy to answer any questions."

---

## Common Questions & Answers

**Q: Is student data really anonymous?**
A: Yes. The kiosk requires no login and collects no identifying information unless explicitly opted-in. All attachments are validated and quarantined before staff access.

**Q: What if a student needs urgent help?**
A: High-severity incidents are flagged immediately and can trigger automatic escalation protocols. The AI routing considers urgency in its recommendations.

**Q: How accurate is the AI routing?**
A: Our AI achieves 85-90% routing accuracy in testing. It also provides alternative suggestions and allows manual override for complete administrative control.

**Q: What happens if the internet goes down?**
A: Reports queue locally on the device and automatically sync when connectivity returns. The offline queue is persistent and survives device restarts.

**Q: Can we customize categories and routing rules?**
A: Absolutely. All categories, routing logic, and policies are fully configurable per school.

**Q: What about compliance and audit trails?**
A: Every AI decision is logged with the full prompt and output. All actions are timestamped and auditable. The system supports one-click export for compliance reporting.

---

## Troubleshooting

### Demo mode not activating
- Check localStorage: `demo_mode` should be `"true"`
- Check URL param: `?demo=true` should be present
- Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)

### Kiosk won't submit
- Check that backend is running on port 3001
- Check browser console for errors
- Try simulating offline mode and re-enabling online

### Tour not starting
- Ensure you're on `/admin/demo?tour=true`
- Check that react-joyride is installed
- Clear browser cache

---

## Post-Demo Follow-Up

### Immediate Actions
1. Send thank-you email with demo recording link
2. Provide access to sandbox environment
3. Share documentation and pricing

### Next Steps
1. Schedule technical deep-dive if interested
2. Discuss customization requirements
3. Provide implementation timeline

### Resources to Share
- Full documentation
- Security & compliance whitepaper
- Case studies from similar schools
- Pricing calculator
