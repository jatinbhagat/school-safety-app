# 🚀 AWS Production Deployment Guide
## For Product Managers (No Technical Experience Required)

This guide will help you deploy the School Safety App to AWS production in **simple steps**.

---

## 📋 What You'll Deploy

1. **Web App (PWA)** - The kiosk and web interface
2. **Backend API** - The server that handles all data
3. **Database** - PostgreSQL for storing reports and data
4. **File Storage** - AWS S3 for storing any uploaded files
5. **Mobile App** - React Native staff app (published separately)

---

## 🎯 Prerequisites

Before you start, you'll need:

- [ ] An AWS account ([Create one here](https://aws.amazon.com/))
- [ ] A credit card for AWS (most services have free tier)
- [ ] GitHub account (you already have this!)
- [ ] 30-60 minutes of time

**Estimated Monthly Cost**: $20-50/month for small usage

---

## 📦 Step-by-Step Deployment

### Part 1: Set Up Your AWS Account (10 minutes)

1. **Create AWS Account**
   - Go to [aws.amazon.com](https://aws.amazon.com/)
   - Click "Create an AWS Account"
   - Follow the steps (you'll need credit card, but won't be charged for free tier)

2. **Access AWS Console**
   - Log in to [console.aws.amazon.com](https://console.aws.amazon.com/)
   - You'll see the AWS dashboard

---

### Part 2: Deploy the Database (15 minutes)

1. **Go to RDS (Database Service)**
   - In AWS Console, search for "RDS" in the top search bar
   - Click "Create database"

2. **Configure Database**
   - Choose: **PostgreSQL**
   - Template: **Free tier** (for testing) or **Production** (for real use)
   - DB Instance: `school-safety-db`
   - Master username: `postgres`
   - Master password: Create a strong password (SAVE THIS!)
   - Instance size: `db.t3.micro` (free tier) or `db.t3.small` (production)

3. **Network Settings**
   - Public access: **Yes** (we'll secure it later)
   - VPC security group: Create new → Name it `school-safety-db-sg`

4. **Create Database**
   - Click "Create database" at the bottom
   - Wait 5-10 minutes for it to be ready

5. **Note Down Connection Info**
   - Once ready, click on your database name
   - Copy the "Endpoint" (looks like: `school-safety-db.xxxxx.us-east-1.rds.amazonaws.com`)
   - You'll need this later!

---

### Part 3: Deploy the Backend API (20 minutes)

1. **Go to Elastic Beanstalk**
   - In AWS Console, search for "Elastic Beanstalk"
   - Click "Create application"

2. **Configure Application**
   - Application name: `school-safety-backend`
   - Platform: **Node.js**
   - Platform branch: **Node.js 20** (or latest)
   - Application code: **Upload your code** (we'll provide a zip file)

3. **Prepare Backend Code**
   - Download the `backend-deploy.zip` from this repository
   - OR ask your developer to create it using: `cd services/backend && npm run build && zip -r backend-deploy.zip dist package.json`

4. **Upload and Deploy**
   - Upload the zip file
   - Click "Create environment"
   - Wait 5-10 minutes

5. **Set Environment Variables**
   - Once environment is ready, go to "Configuration" → "Software"
   - Click "Edit"
   - Add these environment variables:
     ```
     DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/school_safety
     PORT=8080
     NODE_ENV=production
     AWS_REGION=us-east-1
     S3_BUCKET=school-safety-uploads
     ```
   - Click "Apply"

6. **Note Down Backend URL**
   - Copy the URL (looks like: `http://school-safety-backend.us-east-1.elasticbeanstalk.com`)

---

### Part 4: Set Up File Storage (5 minutes)

1. **Go to S3**
   - Search for "S3" in AWS Console
   - Click "Create bucket"

2. **Configure Bucket**
   - Bucket name: `school-safety-uploads-[your-unique-id]` (must be globally unique)
   - Region: Same as your backend (e.g., `us-east-1`)
   - Block all public access: **Uncheck** (we need to allow uploads)
   - Create bucket

3. **Set CORS Policy**
   - Click on your bucket
   - Go to "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit" and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

---

### Part 5: Deploy the Web App (PWA) (15 minutes)

1. **Go to AWS Amplify**
   - Search for "Amplify" in AWS Console
   - Click "Get Started" under "Amplify Hosting"

2. **Connect GitHub**
   - Choose "GitHub"
   - Click "Connect branch"
   - Authorize AWS Amplify to access your GitHub
   - Select repository: `school-safety-app`
   - Select branch: `main` (we'll merge to this)

3. **Configure Build Settings**
   - App name: `school-safety-pwa`
   - Amplify will auto-detect Next.js
   - Edit the build settings to point to `services/pwa`:

   ```yaml
   version: 1
   applications:
     - appRoot: services/pwa
       frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: .next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```

4. **Set Environment Variables**
   - Add environment variable:
     ```
     NEXT_PUBLIC_API_URL=YOUR_BACKEND_URL
     ```
   - Replace `YOUR_BACKEND_URL` with the URL from Part 3

5. **Deploy**
   - Click "Save and deploy"
   - Wait 5-10 minutes
   - You'll get a URL like: `https://main.xxxxx.amplifyapp.com`

---

### Part 6: Publish Mobile App (Optional - Requires Developer)

The mobile app (staff-app) needs to be published to App Store and Google Play Store. This requires:
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- Code signing certificates

**Recommendation**: Work with a developer for this part, or use Expo's EAS Build service.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Database is running in RDS
- [ ] Backend API is accessible (visit the Elastic Beanstalk URL + `/health`)
- [ ] S3 bucket is created
- [ ] PWA is live and loading
- [ ] PWA can connect to backend API

---

## 🔧 Post-Deployment Setup

### 1. Set Up Custom Domain (Optional)

1. **Buy a domain** (e.g., on Route 53, Namecheap, GoDaddy)
2. **For PWA**: In Amplify, go to "Domain management" → Add your domain
3. **For Backend**: In Elastic Beanstalk, you can add a custom domain via Route 53

### 2. Enable HTTPS

- Amplify automatically provides HTTPS for PWA
- For backend, request a free SSL certificate from AWS Certificate Manager

### 3. Set Up Monitoring

1. Go to **CloudWatch** in AWS Console
2. Create alarms for:
   - High database CPU usage
   - Backend API errors
   - High costs

### 4. Enable Backups

1. In RDS, enable automated backups
2. In S3, enable versioning for file recovery

---

## 💰 Cost Management

### Free Tier (First 12 months)
- RDS: 750 hours/month of db.t2.micro
- Elastic Beanstalk: Free (you pay for underlying EC2)
- S3: 5GB storage, 20,000 GET requests
- Amplify: 1,000 build minutes/month

### After Free Tier
- Database (RDS): ~$15-30/month
- Backend (EC2 via Beanstalk): ~$10-20/month
- Storage (S3): ~$1-5/month
- Amplify: ~$5-15/month

**Total**: $30-70/month for moderate usage

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check security group allows inbound connections on port 5432
- Verify `DATABASE_URL` in backend environment variables

### "Backend API returns 502 error"
- Check Elastic Beanstalk logs in AWS Console
- Verify backend build was successful

### "PWA won't load"
- Check Amplify build logs
- Verify `NEXT_PUBLIC_API_URL` is set correctly

### "High AWS costs"
- Check CloudWatch for usage spikes
- Consider downgrading instance sizes
- Set up billing alerts

---

## 📞 Getting Help

- AWS Support: [console.aws.amazon.com/support](https://console.aws.amazon.com/support)
- AWS Free Tier FAQ: [aws.amazon.com/free](https://aws.amazon.com/free)
- Your Development Team: (contact your developers for code issues)

---

## 🎉 You're Done!

Once everything is deployed, share these URLs with your team:
- **Web App (PWA)**: `https://main.xxxxx.amplifyapp.com`
- **Backend API**: `http://school-safety-backend.xxxxx.elasticbeanstalk.com`

**Next Steps**:
1. Test all features in production
2. Set up monitoring and alerts
3. Create a deployment runbook
4. Train your team on the production system

---

## 📝 Maintenance Tasks

### Weekly
- Check CloudWatch for errors
- Review AWS costs in Billing Dashboard

### Monthly
- Review database backups
- Update dependencies (ask developer)
- Check security advisories

### Quarterly
- Review and optimize costs
- Update SSL certificates (if custom domain)
- Performance testing

---

**Need help?** Contact your development team or AWS support!
