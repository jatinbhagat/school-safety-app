# 🚀 Azure Production Deployment - Complete Guide

Welcome! This guide will help you deploy the **School Safety App** to Azure production with minimal costs.

---

## 📚 Documentation Overview

This repository contains deployment guides for different skill levels:

### For Product Managers (Non-Technical) ⭐ START HERE

1. **[QUICK_START_AZURE.md](./QUICK_START_AZURE.md)** - Simplified, step-by-step Azure Portal guide
2. **[DEPLOYMENT_CHECKLIST_AZURE.md](./DEPLOYMENT_CHECKLIST_AZURE.md)** - Interactive checklist to track progress

### For Technical Teams

1. **[AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
2. **[azure-pipelines.yml](./azure-pipelines.yml)** - CI/CD pipeline configuration
3. **[staticwebapp.config.json](./staticwebapp.config.json)** - Static Web App configuration

---

## 🎯 Choose Your Deployment Method

### Option 1: Azure Portal (Recommended for PMs)
**Difficulty**: Easy
**Time**: 1-2 hours
**Skills Required**: None - just follow screenshots
**Cost**: $15-40/month (starting with free tier)

👉 **Start here**: [QUICK_START_AZURE.md](./QUICK_START_AZURE.md)

### Option 2: Azure CLI + Manual Deploy
**Difficulty**: Medium
**Time**: 30-60 minutes
**Skills Required**: Basic command line knowledge
**Cost**: $15-40/month (starting with free tier)

👉 **Start here**: [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)

### Option 3: Hire a DevOps Engineer
**Difficulty**: Easiest (for you)
**Time**: Let them handle it
**Skills Required**: Ability to hire and communicate requirements
**Cost**: $500-2000 one-time + $50-200/month maintenance

---

## 📦 What Gets Deployed

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Azure Cloud                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │ Static Web   │        │  App Service │                  │
│  │  Apps (PWA)  │───────▶│  (Backend)   │                  │
│  │  Next.js     │        │  Node.js     │                  │
│  └──────────────┘        └──────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                          ┌──────────────┐                   │
│                          │  PostgreSQL  │                   │
│                          │  Flexible    │                   │
│                          │  Server      │                   │
│                          └──────────────┘                   │
│                                                              │
│                          ┌──────────────┐                   │
│                          │ Blob Storage │                   │
│                          │  (Uploads)   │                   │
│                          └──────────────┘                   │
│                                                              │
│  ┌──────────────┐                                           │
│  │  Application │  (Monitoring & Logs)                      │
│  │   Insights   │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘

External:
  ┌──────────────┐
  │  Mobile App  │  (Published separately to App Stores)
  │ React Native │
  └──────────────┘
```

### Services Used

| Service | Purpose | Monthly Cost (est.) |
|---------|---------|---------------------|
| **Azure Static Web Apps** | Hosts Next.js PWA | Free tier / $9+ |
| **Azure App Service** | Runs Node.js Backend API | Free tier / $13+ |
| **Azure Database for PostgreSQL** | Database | Free tier / $5-25 |
| **Azure Blob Storage** | File storage | $0.50-5 |
| **Application Insights** | Monitoring & Logs | Free tier / $2-10 |
| **Azure CDN** (optional) | Content delivery | $5-15 |
| **Total** | | **$15-40/month** |

### Free Tier Benefits (Always Free)

- **Static Web Apps**: 100 GB bandwidth/month, custom domains, SSL
- **App Service**: F1 tier (60 CPU minutes/day, 1 GB RAM, 1 GB storage)
- **PostgreSQL**: Burstable B1ms (up to 32 GB storage, 2 vCores)
- **Blob Storage**: First 5 GB free with LRS
- **Application Insights**: First 5 GB data ingestion/month

**Estimated Free Tier Cost**: $0-15/month for light usage

---

## ✅ Pre-Deployment Checklist

Before you start, ensure you have:

- [ ] Azure account created and verified
- [ ] Credit card added to Azure (required, minimal charges on free tier)
- [ ] GitHub account with access to this repository
- [ ] 1-2 hours of uninterrupted time
- [ ] Password manager for storing credentials (recommended)
- [ ] Basic understanding of your application

---

## 🚀 Quick Start (5 Steps)

### Step 1: Prepare Your Environment

```bash
# Clone or pull latest code
git checkout main
git pull origin main

# Ensure you have Node.js 20.x installed
node --version
```

### Step 2: Choose Your Deployment Path

**For Product Managers**:
```bash
# Open the quick start guide
open QUICK_START_AZURE.md  # macOS
# or
start QUICK_START_AZURE.md  # Windows
# or
xdg-open QUICK_START_AZURE.md  # Linux
```

**For Developers with Azure CLI**:
```bash
# Install Azure CLI if not already installed
# macOS: brew install azure-cli
# Windows: Download from https://aka.ms/installazurecliwindows
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Follow AZURE_DEPLOYMENT_GUIDE.md for CLI commands
```

### Step 3: Deploy Infrastructure

Follow the chosen guide to create:
1. PostgreSQL Flexible Server
2. Blob Storage Account
3. App Service Plan & Web App
4. Static Web App

### Step 4: Deploy Applications

1. Deploy Backend to Azure App Service
2. Deploy PWA to Azure Static Web Apps

### Step 5: Verify & Test

- [ ] Visit web app URL - should load
- [ ] Submit test report - should save
- [ ] Check backend health: `<backend-url>/health`
- [ ] Verify database has data
- [ ] Check Application Insights logs

---

## 📋 Deployment Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `azure-pipelines.yml` | Azure DevOps CI/CD pipeline configuration |
| `staticwebapp.config.json` | Azure Static Web Apps routing & headers |
| `services/backend/package.json` | Backend dependencies and scripts |
| `services/pwa/next.config.js` | Next.js configuration for PWA |

### Documentation

| File | Purpose |
|------|---------|
| `AZURE_DEPLOYMENT_README.md` | This file - main deployment overview |
| `QUICK_START_AZURE.md` | Step-by-step guide for non-technical users |
| `AZURE_DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide |
| `DEPLOYMENT_CHECKLIST_AZURE.md` | Interactive deployment checklist |

---

## 🔐 Security Best Practices

### Before Deployment

1. **Use Strong Passwords**
   - Database: 20+ characters, random
   - Azure account: Enable MFA
   - Service principals: Rotate regularly

2. **Secure Credentials**
   - Use Azure Key Vault for secrets
   - Never commit `.env` files to git
   - Use managed identities where possible

3. **Network Security**
   - Use private endpoints for database
   - Enable firewall rules
   - Restrict access to specific IPs

### After Deployment

1. **Enable Monitoring**
   - Set up Application Insights alerts
   - Configure cost alerts
   - Monitor error logs daily

2. **Regular Backups**
   - Enable PostgreSQL automated backups (7-30 days)
   - Test restore procedure monthly
   - Enable blob storage versioning

3. **Access Control**
   - Use Azure RBAC (Role-Based Access Control)
   - Follow principle of least privilege
   - Audit access quarterly

---

## 💰 Cost Management

### Setting Up Cost Alerts

1. Go to Azure Cost Management
2. Set up budgets and alerts for:
   - $10 (warning)
   - $30 (investigate)
   - $50 (urgent - something's wrong)

### Monthly Cost Review

1. Check Azure Cost Analysis
2. Identify top 5 cost drivers
3. Look for optimization opportunities:
   - Unused resources
   - Oversized instances
   - Excessive data transfer

### Cost Optimization Tips

1. **Use Reserved Instances** (save 30-72%)
   - After 1 month of stable usage
   - Commit to 1 or 3-year term

2. **Right-Size Resources**
   - Start with free/basic tiers
   - Scale up only when needed
   - Monitor resource utilization

3. **Cleanup**
   - Delete test/dev environments when not in use
   - Remove old logs and backups
   - Use lifecycle management for blob storage

---

## 🆘 Troubleshooting

### Common Issues

#### "Can't connect to database"

**Symptoms**: Backend returns 500 errors, logs show database connection failed

**Solutions**:
1. Check `DATABASE_URL` environment variable in App Service
2. Verify PostgreSQL firewall allows App Service IP
3. Confirm database is running (Azure Portal → PostgreSQL)
4. Test connection: `psql -h <server>.postgres.database.azure.com -U adminuser`

#### "Backend returns 502 Bad Gateway"

**Symptoms**: PWA can't reach backend, App Service shows errors

**Solutions**:
1. Check App Service logs (Portal → Log Stream)
2. Verify Node.js version matches (20.x)
3. Check health endpoint: `curl <backend-url>/health`
4. Verify environment variables are set in App Service Configuration

#### "PWA build fails in Static Web Apps"

**Symptoms**: GitHub Action shows "Build failed"

**Solutions**:
1. Check GitHub Actions logs for errors
2. Verify `staticwebapp.config.json` is present
3. Check `NEXT_PUBLIC_API_URL` is set correctly
4. Try rebuilding: Portal → Static Web Apps → Deployments → Redeploy

#### "High Azure costs"

**Symptoms**: Bill is higher than expected

**Solutions**:
1. Check Cost Analysis for breakdown
2. Review Application Insights for unusual traffic
3. Look for:
   - Multiple running instances
   - Large data egress
   - Expensive SKUs
4. Consider downgrading to lower tiers

---

## 📊 Post-Deployment Tasks

### Week 1

- [ ] Monitor Application Insights daily
- [ ] Test all features end-to-end
- [ ] Train team on production system
- [ ] Document any issues encountered
- [ ] Review costs in Cost Management

### Month 1

- [ ] Review first month's costs
- [ ] Optimize resource sizes if needed
- [ ] Set up automated backup testing
- [ ] Create runbook for common tasks
- [ ] Schedule monthly review meeting

### Quarterly

- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Disaster recovery test
- [ ] Update dependencies

---

## 🎓 Learning Resources

### Azure Basics

- [Azure Free Account](https://azure.microsoft.com/free/)
- [Azure Documentation](https://docs.microsoft.com/azure/)
- [Azure Well-Architected Framework](https://docs.microsoft.com/azure/architecture/framework/)

### Specific Services

- [Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [App Service Guide](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL Best Practices](https://docs.microsoft.com/azure/postgresql/)

### Video Tutorials

- [Azure Friday](https://www.youtube.com/channel/UCT65KcT5hEI-_JKGj0xS7Cg)
- [Microsoft Azure YouTube](https://www.youtube.com/c/MicrosoftAzure)

---

## 📞 Support

### Technical Issues

- Your Development Team
- Azure Support (see plans in Portal)
- [Microsoft Q&A](https://docs.microsoft.com/answers/)

### Billing Questions

- Azure Support (included in all plans)
- [Azure Cost Management](https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/)

### Urgent Production Issues

1. Check Application Insights logs
2. Check App Service health
3. Contact your on-call developer
4. If critical: Azure Support (based on your plan)

---

## ✅ Success Metrics

Your deployment is successful when:

- ✅ Web app loads in < 3 seconds
- ✅ Users can submit reports successfully
- ✅ Data appears in database
- ✅ No critical errors in logs
- ✅ Costs are within budget ($15-40/month)
- ✅ Backups are running automatically
- ✅ Monitoring is active
- ✅ Team is trained

---

## 🎉 Next Steps After Deployment

1. **Announce to Stakeholders**
   - Share production URLs
   - Provide access credentials
   - Schedule training sessions

2. **Set Up Monitoring Dashboard**
   - Create Application Insights dashboard
   - Set up email/Teams alerts
   - Monitor key metrics

3. **Create Documentation**
   - User guides
   - Admin documentation
   - Troubleshooting runbook

4. **Plan for Scale**
   - Monitor usage patterns
   - Identify bottlenecks
   - Plan capacity increases

---

## 🏁 You're Ready!

Choose your path and get started:

**→ Non-Technical**: Open [QUICK_START_AZURE.md](./QUICK_START_AZURE.md)

**→ Technical**: Open [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md)

**→ Want Help**: Review hiring guide in [QUICK_START_AZURE.md](./QUICK_START_AZURE.md#option-3-hire-help)

---

**Good luck with your deployment! 🚀**

Questions? Create an issue on GitHub or contact your development team.
