# 🚀 AWS Production Deployment - Complete Guide

Welcome! This guide will help you deploy the **School Safety App** to AWS production.

---

## 📚 Documentation Overview

This repository contains multiple deployment guides for different skill levels:

### For Product Managers (Non-Technical) ⭐ START HERE

1. **[QUICK_START_AWS.md](./QUICK_START_AWS.md)** - Simplified, step-by-step AWS Console guide
2. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Interactive checklist to track progress

### For Technical Teams

1. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment guide
2. **[terraform/README.md](./terraform/README.md)** - Infrastructure as Code (Terraform)
3. **[scripts/](./scripts/)** - Deployment automation scripts

---

## 🎯 Choose Your Deployment Method

### Option 1: AWS Console (Recommended for PMs)
**Difficulty**: Easy
**Time**: 1-2 hours
**Skills Required**: None - just follow screenshots
**Cost**: $40-70/month after free tier

👉 **Start here**: [QUICK_START_AWS.md](./QUICK_START_AWS.md)

### Option 2: Terraform + Manual Deploy
**Difficulty**: Medium
**Time**: 30-60 minutes
**Skills Required**: Basic command line, Terraform knowledge
**Cost**: $40-70/month after free tier

👉 **Start here**: [terraform/README.md](./terraform/README.md)

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
│                         AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │  AWS Amplify │        │   Elastic    │                  │
│  │   (PWA/Web)  │───────▶│  Beanstalk   │                  │
│  │   Next.js    │        │  (Backend)   │                  │
│  └──────────────┘        └──────┬───────┘                  │
│                                  │                           │
│                                  ▼                           │
│                          ┌──────────────┐                   │
│                          │   RDS        │                   │
│                          │  PostgreSQL  │                   │
│                          └──────────────┘                   │
│                                                              │
│                          ┌──────────────┐                   │
│                          │   S3 Bucket  │                   │
│                          │  (Uploads)   │                   │
│                          └──────────────┘                   │
│                                                              │
│  ┌──────────────┐                                           │
│  │  CloudWatch  │  (Monitoring & Logs)                      │
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
| **AWS Amplify** | Hosts Next.js PWA | $5-15 |
| **Elastic Beanstalk** | Runs Node.js Backend API | $15-30 |
| **RDS PostgreSQL** | Database | $15-30 |
| **S3** | File storage | $1-5 |
| **CloudWatch** | Monitoring & Logs | $5-10 |
| **Route 53** (optional) | Custom domain DNS | $0.50 |
| **Certificate Manager** | SSL certificates | Free |
| **Total** | | **$40-90/month** |

### Free Tier Benefits (First 12 Months)

- RDS: 750 hours/month of db.t2.micro (enough for 1 instance 24/7)
- EC2: 750 hours/month of t2.micro (via Elastic Beanstalk)
- S3: 5GB storage + 20,000 GET + 2,000 PUT requests
- Amplify: 1,000 build minutes + 15GB served/month
- CloudWatch: 10 custom metrics + 5GB logs

**Estimated Free Tier Cost**: $0-15/month

---

## ✅ Pre-Deployment Checklist

Before you start, ensure you have:

- [ ] AWS account created and verified
- [ ] Credit card added to AWS (required, but won't charge on free tier)
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

# Run pre-deployment check
./scripts/pre-deployment-check.sh
```

### Step 2: Choose Your Deployment Path

**For Product Managers**:
```bash
# Open the quick start guide
open QUICK_START_AWS.md  # macOS
# or
start QUICK_START_AWS.md  # Windows
# or
xdg-open QUICK_START_AWS.md  # Linux
```

**For Developers with Terraform**:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

### Step 3: Deploy Infrastructure

Follow the chosen guide to create:
1. RDS Database
2. S3 Bucket
3. IAM Roles

### Step 4: Deploy Applications

1. Deploy Backend to Elastic Beanstalk
2. Deploy PWA to AWS Amplify

### Step 5: Verify & Test

- [ ] Visit web app URL - should load
- [ ] Submit test report - should save
- [ ] Check backend health: `<backend-url>/health`
- [ ] Verify database has data
- [ ] Check CloudWatch logs

---

## 📋 Deployment Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `amplify.yml` | AWS Amplify build configuration for PWA |
| `.ebextensions/01_nodecommand.config` | Elastic Beanstalk Node.js configuration |
| `services/backend/Dockerfile` | Docker image for backend (optional) |
| `.env.production.template` | Environment variables template |

### Documentation

| File | Purpose |
|------|---------|
| `AWS_DEPLOYMENT_README.md` | This file - main deployment overview |
| `QUICK_START_AWS.md` | Step-by-step guide for non-technical users |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide |
| `DEPLOYMENT_CHECKLIST.md` | Interactive deployment checklist |
| `terraform/README.md` | Terraform infrastructure guide |

### Scripts

| File | Purpose |
|------|---------|
| `scripts/pre-deployment-check.sh` | Verify prerequisites |
| `scripts/deploy-backend.sh` | Package backend for deployment |

---

## 🔐 Security Best Practices

### Before Deployment

1. **Use Strong Passwords**
   - Database: 20+ characters, random
   - AWS root account: Enable MFA
   - IAM users: Unique passwords + MFA

2. **Secure Credentials**
   - Use a password manager (1Password, LastPass)
   - Never commit `.env` files to git
   - Use AWS Secrets Manager for production

3. **Network Security**
   - Use security groups properly
   - Limit database access to backend only
   - Enable VPC for production

### After Deployment

1. **Enable Monitoring**
   - Set up CloudWatch alarms
   - Configure billing alerts
   - Monitor error logs daily

2. **Regular Backups**
   - Enable RDS automated backups (7-30 days)
   - Test restore procedure monthly
   - Enable S3 versioning

3. **Access Control**
   - Use IAM roles, not access keys
   - Follow principle of least privilege
   - Audit access quarterly

---

## 💰 Cost Management

### Setting Up Billing Alerts

1. Go to AWS Billing Dashboard
2. Set up alerts for:
   - $10 (warning)
   - $50 (investigate)
   - $100 (urgent - something's wrong)

### Monthly Cost Review

1. Check AWS Cost Explorer
2. Identify top 5 cost drivers
3. Look for optimization opportunities:
   - Unused resources
   - Oversized instances
   - Excessive data transfer

### Cost Optimization Tips

1. **Use Reserved Instances** (save 30-50%)
   - After 1 month of stable usage
   - Commit to 1-year term

2. **Right-Size Instances**
   - Start small (t3.micro)
   - Scale up only when needed
   - Monitor CPU/memory usage

3. **Cleanup**
   - Delete test environments
   - Remove old logs
   - Archive unused data to Glacier

---

## 🆘 Troubleshooting

### Common Issues

#### "Can't connect to database"

**Symptoms**: Backend returns 500 errors, logs show database connection failed

**Solutions**:
1. Check `DATABASE_URL` environment variable
2. Verify RDS security group allows backend access
3. Confirm database is running (AWS Console → RDS)
4. Test connection manually: `psql -h <endpoint> -U postgres`

#### "Backend returns 502 Bad Gateway"

**Symptoms**: PWA can't reach backend, Elastic Beanstalk shows "Severe"

**Solutions**:
1. Check Elastic Beanstalk logs (Console → Logs → Request Logs)
2. Verify Node.js version matches (20.x)
3. Check health endpoint: `curl <backend-url>/health`
4. Verify environment variables are set

#### "PWA build fails in Amplify"

**Symptoms**: Amplify shows "Build failed" in red

**Solutions**:
1. Check Amplify build logs for errors
2. Verify `appRoot: services/pwa` in amplify.yml
3. Check `NEXT_PUBLIC_API_URL` is set correctly
4. Try rebuilding: Amplify Console → Redeploy

#### "High AWS costs"

**Symptoms**: Bill is higher than expected

**Solutions**:
1. Check CloudWatch for unusual traffic
2. Review Cost Explorer for top costs
3. Look for:
   - Multiple running instances
   - Large data transfers
   - Excessive S3 requests
4. Consider downgrading instance sizes

### Getting Help

1. **AWS Support**
   - Basic (free): Account and billing
   - Developer ($29/month): Technical support
   - Business ($100+/month): 24/7 support

2. **Community Resources**
   - [AWS re:Post](https://repost.aws/)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/aws)
   - [AWS Documentation](https://docs.aws.amazon.com/)

3. **Professional Help**
   - Upwork: AWS DevOps engineers
   - AWS Professional Services
   - Local consultants

---

## 📊 Post-Deployment Tasks

### Week 1

- [ ] Monitor CloudWatch daily
- [ ] Test all features end-to-end
- [ ] Train team on production system
- [ ] Document any issues encountered
- [ ] Review costs in Billing Dashboard

### Month 1

- [ ] Review first month's costs
- [ ] Optimize instance sizes if needed
- [ ] Set up automated backups testing
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

### AWS Basics

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Getting Started](https://aws.amazon.com/getting-started/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

### Specific Services

- [Amplify Documentation](https://docs.amplify.aws/)
- [Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)

### Video Tutorials

- [AWS YouTube Channel](https://www.youtube.com/c/amazonwebservices)
- [Fireship - AWS Crash Course](https://www.youtube.com/watch?v=3hLmDS179YE)

---

## 📞 Support

### Technical Issues

- Your Development Team
- AWS Support (see plans above)
- Community forums

### Billing Questions

- AWS Billing Support (free)
- [AWS Billing Console](https://console.aws.amazon.com/billing/)

### Urgent Production Issues

1. Check CloudWatch logs
2. Check Elastic Beanstalk environment health
3. Contact your on-call developer
4. If critical: AWS Business Support (24/7)

---

## ✅ Success Metrics

Your deployment is successful when:

- ✅ Web app loads in < 3 seconds
- ✅ Users can submit reports successfully
- ✅ Data appears in database
- ✅ No critical errors in logs
- ✅ Costs are within budget
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
   - Create CloudWatch dashboard
   - Set up Slack/email alerts
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

## 📝 Deployment Checklist

Print this and check off as you go:

```
□ Pre-deployment
  □ AWS account created
  □ GitHub access confirmed
  □ Time allocated
  □ Password manager ready

□ Infrastructure
  □ RDS database created
  □ S3 bucket created
  □ Security groups configured
  □ IAM roles set up

□ Applications
  □ Backend deployed to Elastic Beanstalk
  □ PWA deployed to Amplify
  □ Environment variables configured
  □ Health checks passing

□ Testing
  □ Can access web app
  □ Can submit reports
  □ Data saves to database
  □ All features work

□ Operations
  □ Monitoring configured
  □ Billing alerts set
  □ Backups enabled
  □ Team trained

□ Documentation
  □ URLs documented
  □ Credentials saved
  □ Runbook created
  □ Team onboarded
```

---

## 🏁 You're Ready!

Choose your path and get started:

**→ Non-Technical**: Open [QUICK_START_AWS.md](./QUICK_START_AWS.md)

**→ Technical**: Open [terraform/README.md](./terraform/README.md)

**→ Want Help**: Review hiring guide in [QUICK_START_AWS.md](./QUICK_START_AWS.md#option-3-hire-help)

---

**Good luck with your deployment! 🚀**

Questions? Create an issue on GitHub or contact your development team.
