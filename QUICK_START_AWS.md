# ⚡ Quick Start Guide - AWS Deployment

This is a **simplified version** for non-technical Product Managers.

---

## 🎯 Goal

Deploy your School Safety App to AWS in **3 easy options**:

### Option 1: Use AWS Console (Easiest - Click & Deploy) ⭐ RECOMMENDED
### Option 2: Use AWS CLI (Medium - Some Commands)
### Option 3: Hire a DevOps Engineer (Easiest for you, costs money)

---

## ✅ Option 1: AWS Console (No Code Required)

### What You'll Need
- AWS Account
- GitHub account
- 1 hour of time
- Credit card

### Steps

#### Step 1: Create AWS Account (5 min)
1. Go to [aws.amazon.com](https://aws.amazon.com/)
2. Click "Create Account"
3. Enter email, password, account name
4. Enter billing info (required but won't be charged on free tier)
5. Verify phone number

#### Step 2: Deploy Database (10 min)
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Search for "RDS" in top search bar
3. Click "Create database"
4. Select:
   - Engine: PostgreSQL
   - Version: PostgreSQL 15
   - Template: Free tier (for testing) or Production
   - DB instance: `db.t3.micro` (free) or `db.t3.small` (production)
5. Settings:
   - DB name: `school-safety-db`
   - Master username: `postgres`
   - Master password: [Create a strong password - SAVE IT!]
6. Connectivity:
   - Public access: Yes
   - Security group: Create new → `school-safety-db-sg`
7. Click "Create database"
8. **WAIT** 5-10 minutes for database to be ready
9. **SAVE** the endpoint URL (looks like: `xxx.rds.amazonaws.com`)

#### Step 3: Deploy Backend API (15 min)
1. Search for "Elastic Beanstalk"
2. Click "Create application"
3. Application name: `school-safety-backend`
4. Platform: Node.js
5. Application code: Upload your code (see below)
6. Click "Create application"

**To prepare your code:**
```bash
# If you have a developer, ask them to run:
cd services/backend
npm install
npm run build
zip -r backend.zip dist package.json node_modules
```

7. Upload `backend.zip`
8. After deployment, go to Configuration → Software → Edit
9. Add environment variables:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/school_safety
   PORT=8080
   NODE_ENV=production
   ```
10. Click "Apply"
11. **SAVE** your backend URL (e.g., `http://xxx.elasticbeanstalk.com`)

#### Step 4: Deploy Web App (PWA) (10 min)
1. Search for "Amplify"
2. Click "New app" → "Host web app"
3. Connect GitHub:
   - Authorize AWS Amplify
   - Select repository: `school-safety-app`
   - Branch: `main`
4. App name: `school-safety-pwa`
5. Build settings: Amplify auto-detects Next.js
6. Edit build settings:
   - Change `appRoot` to `services/pwa`
   - Use the `amplify.yml` file in your repository
7. Environment variables:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: [Your backend URL from Step 3]
8. Click "Save and deploy"
9. **WAIT** 5-10 minutes
10. **SAVE** your app URL (e.g., `https://main.xxx.amplifyapp.com`)

#### Step 5: Set Up File Storage (5 min)
1. Search for "S3"
2. Click "Create bucket"
3. Bucket name: `school-safety-uploads-[random-numbers]`
4. Region: Same as your backend (e.g., us-east-1)
5. Uncheck "Block all public access" (we need uploads)
6. Click "Create bucket"
7. Go to Permissions → CORS → Edit
8. Paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
9. Save

#### Step 6: Update Backend with S3 Info
1. Go back to Elastic Beanstalk
2. Configuration → Software → Edit
3. Add:
   ```
   S3_BUCKET=school-safety-uploads-[your-bucket-name]
   AWS_REGION=us-east-1
   ```
4. Click "Apply"

---

## ✅ Option 2: Using Docker & AWS ECS (For Tech-Savvy PMs)

If you're comfortable with some commands:

### Prerequisites
- Docker installed on your computer
- AWS CLI installed
- AWS account

### Steps

1. **Build Docker Image**
   ```bash
   cd services/backend
   docker build -t school-safety-backend .
   ```

2. **Push to AWS ECR**
   ```bash
   # Login to AWS
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [your-aws-account-id].dkr.ecr.us-east-1.amazonaws.com

   # Create repository
   aws ecr create-repository --repository-name school-safety-backend

   # Tag and push
   docker tag school-safety-backend:latest [your-aws-account-id].dkr.ecr.us-east-1.amazonaws.com/school-safety-backend:latest
   docker push [your-aws-account-id].dkr.ecr.us-east-1.amazonaws.com/school-safety-backend:latest
   ```

3. **Deploy to ECS**
   - Go to AWS Console → ECS
   - Create cluster
   - Create task definition using your Docker image
   - Create service
   - Configure load balancer

---

## ✅ Option 3: Hire Help

**Cost**: $500-2,000 one-time setup + $50-200/month maintenance

Where to find help:
- Upwork: Search for "AWS DevOps Engineer"
- Fiverr: Search for "AWS deployment"
- Toptal: Premium DevOps consultants
- AWS Professional Services: Official AWS help

**What to ask for:**
"I need help deploying a Node.js/Next.js application to AWS with PostgreSQL database and S3 storage. Please set up:
- RDS PostgreSQL database
- Elastic Beanstalk or ECS for backend
- Amplify for Next.js frontend
- S3 for file storage
- Basic monitoring and backups"

---

## 💰 Expected Costs

### Free Tier (First 12 months)
- **Total**: ~$0-10/month

### After Free Tier
- Database (RDS t3.small): $15-25/month
- Backend (EC2 t3.small): $15-20/month
- Storage (S3): $1-5/month
- Amplify: $5-10/month
- Data Transfer: $5-10/month
- **Total**: $40-70/month

### Cost Savings Tips
1. Use reserved instances (save 30-50%)
2. Turn off non-production environments when not in use
3. Set up billing alerts
4. Use AWS Cost Explorer monthly

---

## 🆘 Troubleshooting

### Problem: Can't access database
**Solution**: Edit RDS security group to allow your IP

### Problem: Backend returns 502 error
**Solution**: Check Elastic Beanstalk logs for errors

### Problem: PWA build fails
**Solution**: Check Amplify build logs, verify environment variables

### Problem: High costs
**Solution**: Check CloudWatch metrics, downgrade instance sizes

---

## 📊 Post-Deployment Checklist

- [ ] Can you access the web app URL?
- [ ] Can you submit a test report?
- [ ] Does the report appear in the database?
- [ ] Can staff members log in?
- [ ] Are analytics working?
- [ ] Have you set up billing alerts?
- [ ] Have you enabled database backups?
- [ ] Have you documented all URLs and credentials?

---

## 🎓 Learning Resources

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Getting Started](https://aws.amazon.com/getting-started/)
- [Amplify Documentation](https://docs.amplify.aws/)
- [Elastic Beanstalk Guide](https://docs.aws.amazon.com/elasticbeanstalk/)

---

## 📞 Support

- **AWS Support**: [console.aws.amazon.com/support](https://console.aws.amazon.com/support)
- **Community**: [AWS re:Post](https://repost.aws/)
- **Urgent Issues**: Contact your development team

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Production web app running on AWS
- ✅ Scalable backend API
- ✅ Managed database with backups
- ✅ Secure file storage
- ✅ Monitoring and alerts

**Share your URLs:**
- Web App: `https://main.xxx.amplifyapp.com`
- API: `http://backend.elasticbeanstalk.com`

---

**Remember**: AWS can be intimidating at first, but you're just clicking buttons and filling forms. Take it slow, follow each step, and don't hesitate to ask for help!
