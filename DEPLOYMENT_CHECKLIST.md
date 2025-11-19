# 📋 AWS Deployment Checklist

Use this checklist to track your deployment progress.

---

## Pre-Deployment

- [ ] Have AWS account created and verified
- [ ] Have access to AWS Console
- [ ] Have GitHub repository access
- [ ] Have saved all passwords in secure location (e.g., LastPass, 1Password)
- [ ] Have reviewed estimated costs
- [ ] Have allocated 1-2 hours for deployment

---

## Phase 1: AWS Account Setup

- [ ] AWS account created
- [ ] Billing information added
- [ ] IAM user created (recommended over root account)
- [ ] MFA (multi-factor authentication) enabled
- [ ] Billing alerts configured ($10, $50, $100 thresholds)

---

## Phase 2: Database Setup (RDS)

- [ ] RDS PostgreSQL database created
- [ ] Instance type selected (t3.micro for testing, t3.small for production)
- [ ] Master password saved securely
- [ ] Database endpoint URL saved
- [ ] Security group created and configured
- [ ] Database is in "Available" status
- [ ] Connection tested (optional, requires PostgreSQL client)
- [ ] Automated backups enabled
- [ ] Backup retention period set (7 days recommended)

**Save these values:**
```
Database Endpoint: ________________________________
Master Username: postgres
Master Password: ________________________________
Database Name: school_safety
Port: 5432
```

---

## Phase 3: File Storage (S3)

- [ ] S3 bucket created
- [ ] Bucket name saved (must be globally unique)
- [ ] CORS policy configured
- [ ] Bucket region matches backend region
- [ ] Versioning enabled (recommended)

**Save these values:**
```
Bucket Name: ________________________________
Region: ________________________________
```

---

## Phase 4: Backend API (Elastic Beanstalk)

- [ ] Elastic Beanstalk application created
- [ ] Node.js platform selected (version 20.x)
- [ ] Backend code uploaded (zip file)
- [ ] Environment created successfully
- [ ] Environment is "Green" status
- [ ] Environment URL accessible
- [ ] Environment variables configured:
  - [ ] DATABASE_URL
  - [ ] PORT (8080)
  - [ ] NODE_ENV (production)
  - [ ] S3_BUCKET
  - [ ] AWS_REGION
- [ ] Health check endpoint responding (`/health`)
- [ ] Auto-scaling configured (min: 1, max: 4)
- [ ] Enhanced monitoring enabled

**Save these values:**
```
Backend URL: ________________________________
Environment Name: ________________________________
```

---

## Phase 5: Web App (AWS Amplify)

- [ ] Amplify app created
- [ ] GitHub repository connected
- [ ] Main branch selected
- [ ] Build settings configured (amplify.yml)
- [ ] App root set to `services/pwa`
- [ ] Environment variables configured:
  - [ ] NEXT_PUBLIC_API_URL
- [ ] First deployment successful
- [ ] App URL accessible
- [ ] Can load homepage
- [ ] Can connect to backend API

**Save these values:**
```
Web App URL: ________________________________
App ID: ________________________________
```

---

## Phase 6: Security & Access

- [ ] Database security group allows only backend access
- [ ] Backend security group allows HTTPS traffic
- [ ] S3 bucket has proper CORS policy
- [ ] IAM roles configured for backend to access S3
- [ ] No AWS credentials hardcoded in code
- [ ] Environment variables secured

---

## Phase 7: Domain & SSL (Optional)

- [ ] Domain name purchased
- [ ] Domain DNS configured in Route 53
- [ ] SSL certificate requested (AWS Certificate Manager)
- [ ] SSL certificate validated
- [ ] Custom domain added to Amplify app
- [ ] Custom domain added to backend (optional)
- [ ] DNS propagation complete (24-48 hours)

**Save these values:**
```
Custom Domain (Web): ________________________________
Custom Domain (API): ________________________________
```

---

## Phase 8: Monitoring & Alerts

- [ ] CloudWatch dashboard created
- [ ] Log groups configured for:
  - [ ] Backend logs
  - [ ] Database logs
  - [ ] Amplify build logs
- [ ] Alarms configured for:
  - [ ] High CPU usage (>80%)
  - [ ] High memory usage (>80%)
  - [ ] Backend errors (>10 per minute)
  - [ ] Database connections (>80% of max)
- [ ] SNS topic created for alerts
- [ ] Email subscribed to alerts
- [ ] Billing alerts configured

---

## Phase 9: Backups & Disaster Recovery

- [ ] RDS automated backups enabled
- [ ] Backup retention period set (7-30 days)
- [ ] S3 versioning enabled
- [ ] Database snapshot created manually
- [ ] Backup restoration tested (recommended)
- [ ] Disaster recovery plan documented

---

## Phase 10: Testing & Validation

- [ ] Can access web app
- [ ] Can submit anonymous report
- [ ] Report saves to database
- [ ] Can view analytics dashboard
- [ ] Staff app can connect (if deployed)
- [ ] Email notifications working (if configured)
- [ ] All features tested end-to-end
- [ ] Performance is acceptable (<3s page load)
- [ ] Mobile responsiveness verified

---

## Phase 11: Documentation

- [ ] All URLs documented
- [ ] All credentials saved in password manager
- [ ] Environment variables documented
- [ ] Architecture diagram created (optional)
- [ ] Deployment runbook created
- [ ] Team trained on production system
- [ ] Support contacts documented

**Create a file named `PRODUCTION_INFO.md` with:**
```markdown
# Production Environment Info

## URLs
- Web App: [URL]
- Backend API: [URL]
- Database: [Endpoint]

## AWS Resources
- RDS Instance ID: [ID]
- Elastic Beanstalk Environment: [Name]
- Amplify App ID: [ID]
- S3 Bucket: [Name]

## Access
- AWS Account ID: [ID]
- Region: [Region]
- IAM Users: [List]

## Support
- AWS Support Plan: [Basic/Developer/Business]
- Emergency Contact: [Email/Phone]
```

---

## Phase 12: Post-Deployment

- [ ] Monitoring set up and verified
- [ ] Costs reviewed after first week
- [ ] Costs reviewed after first month
- [ ] Performance optimizations identified
- [ ] Security audit completed
- [ ] SSL certificate expiry reminder set
- [ ] Monthly maintenance calendar created

---

## Ongoing Maintenance (Monthly)

- [ ] Review AWS billing
- [ ] Check CloudWatch for errors
- [ ] Review database backups
- [ ] Update dependencies (coordinate with dev team)
- [ ] Review and optimize costs
- [ ] Check security advisories
- [ ] Test backup restoration

---

## Emergency Contacts

```
AWS Support: https://console.aws.amazon.com/support
Emergency Phone: 1-877-222-6318 (US) or regional number
Development Team: ________________________________
DevOps Engineer: ________________________________
```

---

## Common Issues & Solutions

### Issue: Backend not responding
**Check:**
- [ ] Elastic Beanstalk environment status
- [ ] CloudWatch logs for errors
- [ ] Database connection
- [ ] Security group rules

### Issue: High costs
**Check:**
- [ ] Instance sizes (downgrade if possible)
- [ ] Unused resources (delete test environments)
- [ ] Data transfer costs
- [ ] Reserved instances for savings

### Issue: Database connection errors
**Check:**
- [ ] DATABASE_URL environment variable
- [ ] Security group allows backend IP
- [ ] Database is running
- [ ] Credentials are correct

---

## Rollback Plan

If deployment fails:
1. [ ] Note the error messages
2. [ ] Check CloudWatch logs
3. [ ] Restore previous Elastic Beanstalk environment
4. [ ] Or deploy previous Amplify build
5. [ ] Contact development team
6. [ ] Review what went wrong
7. [ ] Fix issues before trying again

---

## Success Criteria

✅ All checklist items completed
✅ Web app is accessible and functional
✅ Backend API is responding
✅ Database is accepting connections
✅ No critical errors in logs
✅ Costs are within budget
✅ Team is trained
✅ Monitoring is active

---

## 🎉 Deployment Complete!

Once all items are checked:
1. Announce to team
2. Share production URLs
3. Create training materials
4. Schedule first review meeting (1 week)
5. Celebrate! 🎊

---

**Date Deployed:** _______________
**Deployed By:** _______________
**Production Go-Live Date:** _______________
