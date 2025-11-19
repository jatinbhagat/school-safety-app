# 📋 Azure Deployment Checklist

Use this checklist to track your Azure deployment progress.

---

## Pre-Deployment

- [ ] Have Azure account created and verified
- [ ] Have access to Azure Portal
- [ ] Have GitHub repository access
- [ ] Have saved all passwords in secure location (e.g., LastPass, 1Password, Azure Key Vault)
- [ ] Have reviewed estimated costs
- [ ] Have allocated 1-2 hours for deployment
- [ ] Have $200 free credit activated (new accounts)

---

## Phase 1: Azure Account Setup

- [ ] Azure account created
- [ ] Billing information added
- [ ] Free credit activated ($200 for 30 days)
- [ ] Subscription created/selected
- [ ] Azure CLI installed locally (optional)
- [ ] MFA (multi-factor authentication) enabled
- [ ] Cost alerts configured ($10, $30, $50 thresholds)
- [ ] Budget set ($50/month recommended)

---

## Phase 2: Resource Group Setup

- [ ] Resource group created
- [ ] Location/region selected (e.g., East US, West Europe)
- [ ] Tags applied (Environment, Project, Owner)
- [ ] Resource group documented

**Save these values:**
```
Resource Group Name: ________________________________
Region: ________________________________
```

---

## Phase 3: Database Setup (PostgreSQL)

- [ ] PostgreSQL Flexible Server created
- [ ] Server name is globally unique
- [ ] PostgreSQL version 15 selected
- [ ] Compute tier selected:
  - [ ] Burstable B1ms (development/free tier)
  - [ ] Burstable B2s (production)
  - [ ] General Purpose (high performance)
- [ ] Storage size configured (32-128 GB)
- [ ] Admin username set
- [ ] Strong admin password created and saved
- [ ] Database created (e.g., `school_safety`)
- [ ] Firewall rules configured
- [ ] "Allow Azure services" enabled
- [ ] Current client IP added to firewall
- [ ] SSL/TLS enforced
- [ ] Automated backups enabled
- [ ] Backup retention period set (7-30 days)
- [ ] Connection string tested
- [ ] High availability configured (production only)
- [ ] Geo-redundant backup enabled (production only)

**Save these values:**
```
Server Name: ________________________________.postgres.database.azure.com
Admin Username: ________________________________
Admin Password: ________________________________
Database Name: ________________________________
Connection String: ________________________________
```

---

## Phase 4: Storage Account Setup

- [ ] Storage account created
- [ ] Account name is globally unique (lowercase, no hyphens)
- [ ] Standard performance tier selected
- [ ] LRS (Locally Redundant Storage) selected
- [ ] Blob container created (`uploads`)
- [ ] Public access level set to "Blob"
- [ ] CORS policy configured
- [ ] Access key retrieved and saved
- [ ] Versioning enabled (production)
- [ ] Lifecycle management configured (optional)
- [ ] Soft delete enabled (production)

**Save these values:**
```
Storage Account Name: ________________________________
Container Name: ________________________________
Access Key: ________________________________
```

---

## Phase 5: App Service (Backend) Setup

- [ ] App Service Plan created
- [ ] Plan tier selected:
  - [ ] F1 Free (development)
  - [ ] B1 Basic (production - $13/month)
  - [ ] S1 Standard (high traffic - $70/month)
- [ ] Linux OS selected
- [ ] App Service (Web App) created
- [ ] App name is globally unique
- [ ] Node.js 22 LTS runtime selected
- [ ] Startup command configured: `node dist/server.js`
- [ ] Environment variables configured:
  - [ ] DATABASE_URL
  - [ ] PORT (8080)
  - [ ] NODE_ENV (production)
  - [ ] AZURE_STORAGE_ACCOUNT_NAME
  - [ ] AZURE_STORAGE_ACCOUNT_KEY
  - [ ] AZURE_STORAGE_CONTAINER_NAME
  - [ ] APPINSIGHTS_INSTRUMENTATIONKEY
  - [ ] WEBSITES_PORT (8080)
- [ ] Health check endpoint configured (`/health`)
- [ ] Always On enabled (B1 tier and above)
- [ ] HTTPS only enforced
- [ ] Deployment source configured (GitHub/Local Git/ZIP)
- [ ] Application Insights enabled
- [ ] Logs enabled (Application logs, Web server logs)
- [ ] Auto-scaling configured (production)

**Save these values:**
```
App Service Name: ________________________________
Backend URL: https://________________________________.azurewebsites.net
```

---

## Phase 6: Static Web App (Frontend) Setup

- [ ] Static Web App created
- [ ] App name selected
- [ ] Plan tier selected:
  - [ ] Free (100 GB bandwidth/month)
  - [ ] Standard ($9/month - SLA, custom auth)
- [ ] GitHub repository connected
- [ ] Branch selected (main/develop)
- [ ] Build preset: Next.js
- [ ] App location: `/services/pwa`
- [ ] Output location: `.next`
- [ ] Environment variables configured:
  - [ ] NEXT_PUBLIC_API_URL
  - [ ] NEXT_PUBLIC_APP_NAME (optional)
- [ ] `staticwebapp.config.json` added to repository
- [ ] GitHub Actions workflow auto-created
- [ ] First deployment successful
- [ ] Custom domain configured (optional)
- [ ] SSL certificate provisioned (automatic)

**Save these values:**
```
Static Web App Name: ________________________________
PWA URL: https://________________________________.azurestaticapps.net
Deployment Token: ________________________________ (for CI/CD)
```

---

## Phase 7: Application Insights Setup

- [ ] Application Insights resource created
- [ ] Connected to App Service (backend)
- [ ] Instrumentation key retrieved
- [ ] Live metrics enabled
- [ ] Custom dashboard created
- [ ] Alerts configured:
  - [ ] High response time (> 2s avg)
  - [ ] High error rate (> 5% failed requests)
  - [ ] Server exceptions
  - [ ] Dependency failures
- [ ] Availability tests configured (optional)
- [ ] Daily data cap set (to control costs)

**Save these values:**
```
Application Insights Name: ________________________________
Instrumentation Key: ________________________________
```

---

## Phase 8: Security Configuration

- [ ] Azure Key Vault created (optional but recommended)
- [ ] Secrets migrated to Key Vault:
  - [ ] Database password
  - [ ] Storage account key
  - [ ] Application Insights key
- [ ] Managed Identity enabled for App Service
- [ ] Key Vault access policies configured
- [ ] App Service using Key Vault references
- [ ] HTTPS-only enforced on all services
- [ ] CORS configured on backend
- [ ] Firewall rules minimized (least privilege)
- [ ] Private endpoints configured (production)
- [ ] Network security groups configured (production)

---

## Phase 9: Deployment & CI/CD

- [ ] Backend code deployed successfully
- [ ] Frontend code deployed successfully
- [ ] GitHub Actions workflow configured
- [ ] Azure Pipelines configured (alternative)
- [ ] Deployment secrets added to GitHub/Azure DevOps:
  - [ ] AZURE_STATIC_WEB_APPS_API_TOKEN
  - [ ] AZURE_WEBAPP_PUBLISH_PROFILE
  - [ ] AZURE_SUBSCRIPTION_ID
- [ ] Deployment slots configured (production)
- [ ] Auto-deployment on push to main enabled
- [ ] Deployment notifications configured (optional)

---

## Phase 10: Testing & Validation

- [ ] Can access PWA URL (Static Web App)
- [ ] Can access backend URL
- [ ] Health check endpoint returns 200 OK: `/health`
- [ ] Can submit anonymous report from PWA
- [ ] Report saves to PostgreSQL database
- [ ] Files upload to Blob Storage
- [ ] Can view analytics dashboard
- [ ] Staff app can connect (if deployed)
- [ ] Email notifications working (if configured)
- [ ] All features tested end-to-end
- [ ] Performance is acceptable (<3s page load)
- [ ] Mobile responsiveness verified
- [ ] SSL/HTTPS working on all endpoints
- [ ] CORS working correctly
- [ ] Error handling working correctly

---

## Phase 11: Monitoring & Alerts

- [ ] Application Insights collecting data
- [ ] Can view request telemetry
- [ ] Can view dependency calls (database, storage)
- [ ] Can view exceptions and errors
- [ ] Live metrics streaming working
- [ ] Custom metrics configured (optional)
- [ ] Alerts firing correctly (test by triggering condition)
- [ ] Alert recipients configured
- [ ] Notification channels configured (email, Teams, SMS)
- [ ] Log Analytics workspace connected
- [ ] Custom queries saved for troubleshooting

---

## Phase 12: Cost Management

- [ ] Budgets configured
- [ ] Cost alerts set up:
  - [ ] $10 warning (check for issues)
  - [ ] $30 review (investigate usage)
  - [ ] $50 critical (immediate action)
- [ ] Cost Analysis reviewed
- [ ] Understand current monthly burn rate
- [ ] Identified cost optimization opportunities
- [ ] Free tier resources identified
- [ ] Unnecessary resources deleted (dev/test)
- [ ] Resource tags applied for cost tracking

**Current Estimated Monthly Cost:**
```
Database: $______
App Service: $______
Storage: $______
Static Web App: $______
Application Insights: $______
Other: $______
Total: $______/month
```

---

## Phase 13: Backup & Disaster Recovery

- [ ] PostgreSQL automated backups enabled
- [ ] Backup retention period set (7-30 days)
- [ ] Geo-redundant backup enabled (production)
- [ ] Point-in-time restore tested
- [ ] Blob storage versioning enabled
- [ ] Blob soft delete enabled (production)
- [ ] Disaster recovery plan documented
- [ ] Recovery Time Objective (RTO) defined
- [ ] Recovery Point Objective (RPO) defined
- [ ] Backup restore procedure tested

---

## Phase 14: Documentation

- [ ] All URLs documented
- [ ] All credentials saved in password manager or Key Vault
- [ ] Environment variables documented
- [ ] Architecture diagram created
- [ ] Deployment runbook created
- [ ] Troubleshooting guide created
- [ ] Team trained on production system
- [ ] Support contacts documented
- [ ] Escalation procedure documented

**Create a file named `PRODUCTION_INFO.md` with:**
```markdown
# Azure Production Environment Info

## URLs
- PWA: https://________________________________.azurestaticapps.net
- Backend API: https://________________________________.azurewebsites.net
- Health Check: https://________________________________.azurewebsites.net/health

## Azure Resources
- Resource Group: ________________________________
- Region: ________________________________
- PostgreSQL Server: ________________________________.postgres.database.azure.com
- Storage Account: ________________________________
- App Service: ________________________________
- Static Web App: ________________________________
- Application Insights: ________________________________

## Access
- Azure Subscription ID: ________________________________
- GitHub Repository: ________________________________
- Key Vault (if used): ________________________________

## Costs
- Estimated Monthly: $________________________________
- Budget Limit: $________________________________

## Support
- Azure Support Plan: [Basic/Developer/Standard/Professional]
- Emergency Contact: ________________________________
- On-Call Engineer: ________________________________

## Backup Schedule
- Database: Automated daily, retained for ____ days
- Last Manual Backup: ________________________________
- Last Restore Test: ________________________________
```

---

## Phase 15: Post-Deployment Tasks

### Week 1
- [ ] Monitor Application Insights daily
- [ ] Check for errors in logs
- [ ] Review performance metrics
- [ ] Test all features thoroughly
- [ ] Document any issues
- [ ] Review costs daily
- [ ] Ensure backups are running
- [ ] Verify monitoring alerts work

### Month 1
- [ ] Review first month's actual costs vs. estimate
- [ ] Optimize resource sizes based on actual usage
- [ ] Review Application Insights for patterns
- [ ] Test backup restoration procedure
- [ ] Update documentation with lessons learned
- [ ] Schedule monthly review meeting
- [ ] Plan for scaling if needed
- [ ] Review security audit logs

### Quarterly
- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Disaster recovery drill
- [ ] Update dependencies (Node.js, packages)
- [ ] Review and update documentation
- [ ] Team training refresh
- [ ] Stakeholder review meeting

---

## Emergency Contacts

```
Azure Support: https://portal.azure.com/#blade/Microsoft_Azure_Support
Support Phone: See Azure Portal → Help + Support
GitHub Issues: https://github.com/YOUR_USERNAME/school-safety-app/issues
Development Team: ________________________________
DevOps Engineer: ________________________________
Project Manager: ________________________________
```

---

## Common Issues & Quick Solutions

### Issue: Backend not responding (502 Bad Gateway)
**Quick Check:**
- [ ] App Service is running (Portal → Overview → Status)
- [ ] Check logs (Portal → Log Stream)
- [ ] Verify environment variables are set
- [ ] Check health endpoint: `curl https://your-app.azurewebsites.net/health`
- [ ] Restart App Service if needed

### Issue: Database connection errors
**Quick Check:**
- [ ] DATABASE_URL is correct in App Service settings
- [ ] PostgreSQL firewall allows App Service IP
- [ ] Database server is running
- [ ] Connection string includes `?sslmode=require`
- [ ] Credentials are correct

### Issue: PWA not loading or build failing
**Quick Check:**
- [ ] Check GitHub Actions workflow status
- [ ] Verify `staticwebapp.config.json` exists
- [ ] NEXT_PUBLIC_API_URL is set correctly
- [ ] Check Static Web App build logs
- [ ] Trigger manual redeploy if needed

### Issue: High costs
**Quick Check:**
- [ ] Review Cost Analysis for breakdown
- [ ] Check for unexpected resources
- [ ] Look for oversized instances
- [ ] Review Application Insights data ingestion
- [ ] Check for excessive storage or bandwidth usage
- [ ] Consider downgrading to lower tiers
- [ ] Delete unused dev/test resources

### Issue: Files not uploading
**Quick Check:**
- [ ] Blob storage container exists
- [ ] CORS is configured correctly
- [ ] Storage account key is correct in App Service
- [ ] Container public access level is correct
- [ ] Check App Service logs for errors

---

## Rollback Plan

If deployment fails or critical issues arise:

1. **Backend Rollback:**
   - [ ] Use deployment slots to swap back to previous version
   - [ ] Or redeploy previous version from GitHub
   - [ ] Check logs for root cause

2. **Frontend Rollback:**
   - [ ] Redeploy previous version from GitHub Actions history
   - [ ] Or revert GitHub commit and trigger redeploy

3. **Database Rollback:**
   - [ ] Restore from automated backup
   - [ ] Use point-in-time restore to specific timestamp
   - [ ] Test restored database before switching

4. **Full System Rollback:**
   - [ ] Roll back all components to last known good state
   - [ ] Verify end-to-end functionality
   - [ ] Document what went wrong
   - [ ] Fix issues before trying again

---

## Success Criteria

✅ **Deployment is successful when:**

- ✅ PWA is accessible and loads in < 3 seconds
- ✅ Backend API responds with 200 OK on `/health`
- ✅ Users can submit reports successfully
- ✅ Reports save to PostgreSQL database
- ✅ Files upload to Blob Storage
- ✅ No critical errors in Application Insights
- ✅ SSL/HTTPS working on all endpoints
- ✅ Costs are within budget ($15-40/month)
- ✅ Backups are running automatically
- ✅ Monitoring and alerts are active
- ✅ Team is trained and documentation is complete
- ✅ Performance meets requirements (< 3s page load, < 2s API response)

---

## 🎉 Deployment Complete!

Once all items are checked:

1. **Announce Launch**
   - Share production URLs with stakeholders
   - Send access instructions to team
   - Schedule training sessions

2. **Create Monitoring Dashboard**
   - Pin key metrics to Azure dashboard
   - Set up daily/weekly email reports
   - Configure Teams/Slack notifications

3. **Schedule Reviews**
   - Daily check-ins for first week
   - Weekly reviews for first month
   - Monthly reviews ongoing

4. **Celebrate Success! 🎊**
   - Recognize team efforts
   - Share wins with stakeholders
   - Document lessons learned

---

**Date Deployed:** _______________
**Deployed By:** _______________
**Production Go-Live Date:** _______________
**Next Review Date:** _______________

---

## Appendix: Useful Azure CLI Commands

```bash
# View all resources in resource group
az resource list --resource-group school-safety-rg --output table

# Get connection info for all resources
az postgres flexible-server show --resource-group school-safety-rg --name your-db --query "{FQDN:fullyQualifiedDomainName, Version:version}"
az storage account show-connection-string --name your-storage --resource-group school-safety-rg
az webapp show --resource-group school-safety-rg --name your-backend --query "{URL:defaultHostName, State:state}"

# Quick health check
curl https://your-backend.azurewebsites.net/health
curl -I https://your-pwa.azurestaticapps.net

# View recent logs
az webapp log tail --resource-group school-safety-rg --name your-backend

# Check costs
az consumption usage list --start-date 2025-01-01 --end-date 2025-01-31
```

---

**Good luck with your Azure deployment! 🚀☁️**
