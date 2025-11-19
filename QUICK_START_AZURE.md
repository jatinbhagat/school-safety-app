# ⚡ Quick Start Guide - Azure Deployment

This is a **simplified version** for non-technical Product Managers.

---

## 🎯 Goal

Deploy your School Safety App to Azure in **3 easy options**:

### Option 1: Use Azure Portal (Easiest - Click & Deploy) ⭐ RECOMMENDED
### Option 2: Use Azure CLI (Medium - Some Commands)
### Option 3: Hire a DevOps Engineer (Easiest for you, costs money)

---

## ✅ Option 1: Azure Portal (No Code Required)

### What You'll Need
- Azure Account (free tier available)
- GitHub account
- 1-2 hours of time
- Credit card (minimal charges with free tier)

### Cost Estimate
- **Free Tier**: $0-15/month for light usage
- **After Free Tier**: $15-40/month for moderate usage

---

### Steps

#### Step 1: Create Azure Account (5 min)

1. Go to [azure.microsoft.com/free](https://azure.microsoft.com/free/)
2. Click "Start free"
3. Sign in with Microsoft account (or create one)
4. Enter billing info (required, but $200 free credit for 30 days)
5. Verify phone number
6. Complete identity verification

**You get**: $200 credit for 30 days + 12 months of free services + always-free services

---

#### Step 2: Deploy Database (10 min)

1. **Log in to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com/)
   - Sign in with your account

2. **Create Resource Group**
   - Click "Resource groups" in left menu
   - Click "+ Create"
   - Resource group name: `school-safety-rg`
   - Region: Choose closest to your users (e.g., `East US`, `West Europe`)
   - Click "Review + create" → "Create"

3. **Create PostgreSQL Database**
   - Search for "Azure Database for PostgreSQL" in top search bar
   - Click "Create"
   - Select "Flexible server"
   - Fill in details:
     - Resource group: `school-safety-rg`
     - Server name: `school-safety-db` (must be globally unique, add numbers if needed)
     - Region: Same as resource group
     - PostgreSQL version: `15`
     - Workload type: `Development` (for testing) or `Production` (for real use)
     - Compute + storage:
       - For testing: `Burstable B1ms` (1 vCore, 2 GB RAM) - **FREE TIER**
       - For production: `Burstable B2s` (2 vCores, 4 GB RAM) - $13/month
   - Authentication:
     - Admin username: `adminuser`
     - Password: [Create strong password - SAVE IT!]
   - Networking:
     - Connectivity method: `Public access`
     - Firewall rules: Check "Allow public access from any Azure service"
     - ✅ Check "Add current client IP address"
   - Click "Review + create" → "Create"
   - **WAIT** 5-10 minutes for deployment

4. **Save Connection Info**
   - Go to your database resource
   - Click "Overview"
   - Copy **Server name** (e.g., `school-safety-db.postgres.database.azure.com`)
   - Save this for later!

---

#### Step 3: Deploy Storage Account (5 min)

1. **Create Storage Account**
   - Search for "Storage accounts" in Azure Portal
   - Click "+ Create"
   - Resource group: `school-safety-rg`
   - Storage account name: `schoolsafetystorage` (must be unique, lowercase, no hyphens)
   - Region: Same as resource group
   - Performance: `Standard`
   - Redundancy: `Locally-redundant storage (LRS)` (cheapest)
   - Click "Review + create" → "Create"

2. **Configure CORS**
   - Go to your storage account
   - Left menu → "Resource sharing (CORS)"
   - Under "Blob service", add:
     - Allowed origins: `*`
     - Allowed methods: `GET, PUT, POST, DELETE`
     - Allowed headers: `*`
     - Exposed headers: `*`
     - Max age: `3600`
   - Click "Save"

3. **Create Container**
   - Go to "Containers" in left menu
   - Click "+ Container"
   - Name: `uploads`
   - Public access level: `Blob (anonymous read access for blobs only)`
   - Click "Create"

4. **Save Storage Info**
   - Go to "Access keys"
   - Copy **Storage account name** and **Key1**
   - Save for later!

---

#### Step 4: Deploy Backend API (15 min)

1. **Create App Service**
   - Search for "App Services" in Azure Portal
   - Click "+ Create"
   - Resource group: `school-safety-rg`
   - Name: `school-safety-backend` (must be globally unique)
   - Publish: `Code`
   - Runtime stack: `Node 22 LTS`
   - Operating System: `Linux`
   - Region: Same as resource group
   - Pricing plan:
     - For testing: `Free F1` (60 CPU min/day, 1 GB RAM)
     - For production: `Basic B1` ($13/month, 1.75 GB RAM)
   - Click "Review + create" → "Create"

2. **Configure Environment Variables**
   - Go to your App Service
   - Left menu → "Configuration"
   - Click "+ New application setting" for each:

   ```
   DATABASE_URL = postgresql://adminuser:YOUR_PASSWORD@school-safety-db.postgres.database.azure.com:5432/postgres?sslmode=require

   PORT = 8080

   NODE_ENV = production

   AZURE_STORAGE_ACCOUNT_NAME = schoolsafetystorage

   AZURE_STORAGE_ACCOUNT_KEY = [Your storage key from Step 3]

   AZURE_STORAGE_CONTAINER_NAME = uploads
   ```

   - Click "Save" at the top
   - Click "Continue" when prompted

3. **Deploy Backend Code**

   **Option A: Using GitHub Actions (Recommended)**
   - In App Service, go to "Deployment Center"
   - Source: `GitHub`
   - Sign in to GitHub and authorize
   - Organization: Your GitHub username
   - Repository: `school-safety-app`
   - Branch: `main`
   - Build provider: `GitHub Actions`
   - Workflow file: Will be auto-generated
   - Click "Save"
   - GitHub Actions will automatically deploy your backend

   **Option B: Using VS Code**
   - Install "Azure App Service" extension in VS Code
   - Right-click on `services/backend` folder
   - Select "Deploy to Web App"
   - Choose your subscription and app service
   - Wait for deployment

4. **Verify Backend**
   - Go to your App Service Overview
   - Click the URL (e.g., `https://school-safety-backend.azurewebsites.net`)
   - Add `/health` to the URL: `https://school-safety-backend.azurewebsites.net/health`
   - Should see: `{"status":"ok"}`

---

#### Step 5: Deploy Web App (PWA) (10 min)

1. **Create Static Web App**
   - Search for "Static Web Apps" in Azure Portal
   - Click "+ Create"
   - Resource group: `school-safety-rg`
   - Name: `school-safety-pwa`
   - Plan type:
     - `Free` (100 GB bandwidth/month, SSL, custom domains)
     - For production: `Standard` ($9/month, more features)
   - Region: `East US 2` or closest available
   - Deployment details:
     - Source: `GitHub`
     - Sign in to GitHub
     - Organization: Your username
     - Repository: `school-safety-app`
     - Branch: `main`
   - Build Details:
     - Build Presets: `Next.js`
     - App location: `/services/pwa`
     - Api location: (leave blank)
     - Output location: `.next`
   - Click "Review + create" → "Create"

2. **Configure Environment Variables**
   - Go to your Static Web App
   - Left menu → "Configuration"
   - Click "+ Add" under Application settings
   - Add:
     ```
     NEXT_PUBLIC_API_URL = https://school-safety-backend.azurewebsites.net
     ```
   - Click "Save"

3. **Trigger Deployment**
   - Go to GitHub Actions in your repository
   - Find the workflow for Static Web App
   - Click "Re-run all jobs" if needed
   - Wait 5-10 minutes for build

4. **Get Your URL**
   - Go to Static Web App → Overview
   - Copy the URL (e.g., `https://happy-sea-123abc.azurestaticapps.net`)
   - Open in browser - your app should load!

---

## ✅ Option 2: Using Azure CLI (For Tech-Savvy PMs)

If you're comfortable with terminal/command line:

### Prerequisites
- Azure CLI installed ([Installation guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Node.js 22.x installed
- Git installed

### Quick Deploy Script

```bash
# Login to Azure
az login

# Set variables (customize these)
RESOURCE_GROUP="school-safety-rg"
LOCATION="eastus"
DB_NAME="school-safety-db"
DB_USER="adminuser"
DB_PASSWORD="YourStrongPassword123!"
STORAGE_ACCOUNT="schoolsafetystorage"
BACKEND_APP="school-safety-backend"
PWA_APP="school-safety-pwa"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create PostgreSQL database
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_NAME \
  --location $LOCATION \
  --admin-user $DB_USER \
  --admin-password $DB_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create blob container
STORAGE_KEY=$(az storage account keys list --account-name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query '[0].value' -o tsv)
az storage container create \
  --name uploads \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access blob

# Create App Service Plan
az appservice plan create \
  --name school-safety-plan \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1

# Create App Service (Backend)
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan school-safety-plan \
  --name $BACKEND_APP \
  --runtime "NODE:22-lts"

# Set environment variables
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_NAME}.postgres.database.azure.com:5432/postgres?sslmode=require"

az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    PORT=8080 \
    NODE_ENV=production \
    AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT \
    AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY \
    AZURE_STORAGE_CONTAINER_NAME=uploads

# Deploy backend (from services/backend directory)
cd services/backend
zip -r deploy.zip .
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --src deploy.zip
cd ../..

# Create Static Web App (requires GitHub repo)
az staticwebapp create \
  --name $PWA_APP \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --source https://github.com/YOUR_USERNAME/school-safety-app \
  --branch main \
  --app-location "/services/pwa" \
  --output-location ".next" \
  --login-with-github

echo "Deployment complete!"
echo "Backend URL: https://${BACKEND_APP}.azurewebsites.net"
echo "Check Static Web App URL in Azure Portal"
```

---

## ✅ Option 3: Hire Help

**Cost**: $500-2,000 one-time setup + $50-200/month maintenance

### Where to Find Help
- **Upwork**: Search for "Azure DevOps Engineer" or "Azure Cloud Architect"
- **Fiverr**: Search for "Azure deployment"
- **Toptal**: Premium DevOps consultants
- **Microsoft Partners**: Find certified partners at [partner.microsoft.com](https://partner.microsoft.com/)

### What to Ask For

"I need help deploying a Node.js/Next.js application to Azure with PostgreSQL database and Blob Storage. Please set up:
- Azure Database for PostgreSQL Flexible Server
- Azure App Service for Node.js backend
- Azure Static Web Apps for Next.js frontend
- Azure Blob Storage for file uploads
- Application Insights for monitoring
- Automated backups and disaster recovery
- CI/CD pipeline with GitHub Actions
- Cost optimization and monitoring alerts"

---

## 💰 Expected Costs

### Free Tier (First 12 months + Always Free)
- PostgreSQL: Burstable B1ms (free for 12 months, then $5-10/month)
- App Service: F1 Free tier (limited, $0/month)
- Static Web Apps: Free tier (100 GB bandwidth, $0/month)
- Blob Storage: First 5 GB free
- Application Insights: First 5 GB/month free
- **Total**: ~$0-15/month for light usage

### Production (After Free Tier)
- PostgreSQL (B2s): $13-25/month
- App Service (B1): $13/month
- Storage: $1-5/month
- Static Web Apps Standard: $9/month (optional)
- Application Insights: $2-10/month
- Data Transfer: $2-5/month
- **Total**: $15-40/month for moderate usage

### Cost Savings Tips
1. **Start with free tiers** - Upgrade only when needed
2. **Use auto-shutdown** - Turn off dev/test environments when not in use
3. **Set up cost alerts** - Get notified at $10, $30, $50
4. **Reserved instances** - Save 30-72% with 1 or 3-year commitment
5. **Monitor regularly** - Review Azure Cost Analysis monthly

---

## 🆘 Troubleshooting

### Problem: Can't access database
**Solution**:
1. Go to PostgreSQL → Networking
2. Add your IP to firewall rules
3. Enable "Allow public access from any Azure service"

### Problem: Backend returns 502 error
**Solution**:
1. Check App Service → Log Stream for errors
2. Verify environment variables are set correctly
3. Check that Node.js version is 22.x
4. Test `/health` endpoint

### Problem: PWA build fails
**Solution**:
1. Check GitHub Actions logs
2. Verify `staticwebapp.config.json` is in root
3. Check environment variables in Static Web App
4. Ensure app location is `/services/pwa`

### Problem: High costs
**Solution**:
1. Check Cost Analysis in Azure Portal
2. Look for unexpected resources
3. Downgrade to lower tiers if possible
4. Delete unused test/dev resources

---

## 📊 Post-Deployment Checklist

- [ ] Can you access the web app URL?
- [ ] Can you submit a test report?
- [ ] Does the report save to database?
- [ ] Can staff members log in?
- [ ] Are analytics working?
- [ ] Have you set up cost alerts?
- [ ] Have you enabled database backups?
- [ ] Have you documented all URLs and credentials?
- [ ] Is Application Insights collecting data?
- [ ] Have you set up a custom domain? (optional)

---

## 🎓 Learning Resources

### Get Started
- [Azure Free Account](https://azure.microsoft.com/free/)
- [Azure Portal Quickstart](https://docs.microsoft.com/azure/azure-portal/)
- [Azure Learning Paths](https://docs.microsoft.com/learn/azure/)

### Documentation
- [Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [PostgreSQL Docs](https://docs.microsoft.com/azure/postgresql/)

### Videos
- [Azure Friday YouTube](https://www.youtube.com/channel/UCT65KcT5hEI-_JKGj0xS7Cg)
- [Microsoft Learn TV](https://docs.microsoft.com/learn/tv/)

---

## 📞 Support

- **Azure Support**: [portal.azure.com/#blade/Microsoft_Azure_Support](https://portal.azure.com/#blade/Microsoft_Azure_Support)
- **Community**: [Microsoft Q&A](https://docs.microsoft.com/answers/)
- **Urgent Issues**: Contact your development team

**Support Plans:**
- Developer: $29/month (business hours, email)
- Standard: $100/month (24/7, phone + email)
- Professional Direct: $1000/month (24/7, architecture guidance)

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Production web app running on Azure
- ✅ Scalable backend API with auto-scaling
- ✅ Managed PostgreSQL database with backups
- ✅ Secure blob storage for files
- ✅ Monitoring with Application Insights
- ✅ SSL/HTTPS enabled automatically
- ✅ CI/CD pipeline with GitHub Actions

**Share your URLs:**
- Web App: `https://[your-app].azurestaticapps.net`
- API: `https://[your-backend].azurewebsites.net`

---

**Remember**: Azure Portal is user-friendly - just clicking buttons and filling forms. Take it slow, follow each step, and don't hesitate to ask for help!

**Pro Tip**: Use the search bar at the top of Azure Portal to quickly find any service!
