# 🚀 Azure Production Deployment Guide
## Complete Technical Documentation

This guide provides comprehensive instructions for deploying the School Safety App to Azure production.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Application Deployment](#application-deployment)
5. [Configuration](#configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Security](#security)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Scaling & Performance](#scaling--performance)
10. [Backup & Disaster Recovery](#backup--disaster-recovery)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌────────────────────────────────────────────────────────────┐
│                    Internet Users                           │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│              Azure Front Door (Optional CDN)                │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────┐    ┌─────────────────────────────┐
│  Azure Static Web Apps │    │    Azure App Service        │
│   (Next.js Frontend)   │───▶│    (Node.js Backend)        │
│  - Auto SSL/HTTPS      │    │  - Linux Container          │
│  - Global CDN          │    │  - Auto-scale enabled       │
│  - GitHub Actions CI   │    │  - Application Insights     │
└────────────────────────┘    └──────────┬──────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
         ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐
         │   PostgreSQL     │ │  Blob Storage    │ │ Application     │
         │ Flexible Server  │ │  (File Uploads)  │ │   Insights      │
         │ - Automated BU   │ │ - Versioning     │ │ (Monitoring)    │
         │ - Point-in-time  │ │ - Lifecycle Mgmt │ │                 │
         └──────────────────┘ └──────────────────┘ └─────────────────┘
```

### Azure Services Used

| Service | Purpose | Tier/SKU | Est. Cost/Month |
|---------|---------|----------|----------------|
| Static Web Apps | PWA Hosting | Free/Standard | $0-9 |
| App Service | Backend API | F1/B1/S1 | $0-75 |
| PostgreSQL Flexible | Database | B1ms/B2s | $5-25 |
| Blob Storage | File Storage | Standard LRS | $0.50-5 |
| Application Insights | Monitoring | Pay-as-you-go | $0-10 |
| Key Vault (optional) | Secrets Management | Standard | $0.03 |
| Front Door (optional) | CDN/WAF | Standard | $35+ |

**Total**: $15-40/month (basic) | $50-150/month (production with HA)

---

## Prerequisites

### Required Tools

```bash
# Node.js 22.x
node --version  # Should be v22.x

# Azure CLI
az --version    # Should be 2.50+
# Install: https://docs.microsoft.com/cli/azure/install-azure-cli

# Git
git --version

# Optional: PowerShell Core (for advanced scripts)
pwsh --version
```

### Azure Account Setup

1. **Create Azure Account**
   - Visit [azure.microsoft.com/free](https://azure.microsoft.com/free)
   - Get $200 free credit for 30 days
   - 12 months of free services

2. **Install Azure CLI**
   ```bash
   # macOS
   brew install azure-cli

   # Windows
   # Download from https://aka.ms/installazurecliwindows

   # Linux (Debian/Ubuntu)
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

3. **Login to Azure**
   ```bash
   az login
   # Opens browser for authentication

   # Set default subscription (if you have multiple)
   az account list --output table
   az account set --subscription "SUBSCRIPTION_ID"
   ```

### GitHub Repository Setup

1. Fork or clone the repository
2. Set up GitHub Actions secrets (for CI/CD)
3. Create deployment branch (if needed)

---

## Infrastructure Setup

### Step 1: Create Resource Group

```bash
# Set variables
export RESOURCE_GROUP="school-safety-rg"
export LOCATION="eastus"  # or westus, westeurope, etc.
export TAGS="Environment=Production Project=SchoolSafety"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags $TAGS
```

### Step 2: Deploy PostgreSQL Database

```bash
# Database variables
export DB_SERVER_NAME="school-safety-db-$(date +%s)"  # Unique name
export DB_ADMIN_USER="adminuser"
export DB_ADMIN_PASSWORD="ChangeMe$(openssl rand -base64 12)"  # Generate strong password
export DB_NAME="school_safety"

echo "Database password: $DB_ADMIN_PASSWORD"  # SAVE THIS!

# Create PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --tags $TAGS

# Create database
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# Configure firewall (allow Azure services)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Get connection string
export DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_SERVER_NAME}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"
echo "DATABASE_URL: $DATABASE_URL"  # SAVE THIS!
```

**Production Recommendations:**
- Use **Standard_B2s** or higher for production workloads
- Enable **High Availability** with zone redundancy
- Set **backup retention** to 30 days
- Enable **geo-redundant backup** for disaster recovery
- Use **private endpoint** instead of public access

```bash
# Production database setup
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $DB_ADMIN_USER \
  --admin-password "$DB_ADMIN_PASSWORD" \
  --sku-name Standard_B2s \
  --tier Burstable \
  --version 15 \
  --storage-size 128 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled \
  --high-availability ZoneRedundant \
  --public-access None \
  --tags $TAGS
```

### Step 3: Create Storage Account

```bash
# Storage variables
export STORAGE_ACCOUNT="schoolsafety$(date +%s)"  # Must be unique, lowercase, no hyphens
export STORAGE_CONTAINER="uploads"

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --tags $TAGS

# Get storage key
export STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query '[0].value' -o tsv)

# Create blob container
az storage container create \
  --name $STORAGE_CONTAINER \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --public-access blob

# Configure CORS
az storage cors add \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --services b \
  --methods GET PUT POST DELETE \
  --origins '*' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600

# Enable versioning (for production)
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --enable-versioning true

# Set lifecycle management (optional - delete old versions after 90 days)
cat > lifecycle-policy.json <<EOF
{
  "rules": [
    {
      "name": "deleteOldVersions",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"]
        },
        "actions": {
          "version": {
            "delete": {
              "daysAfterCreationGreaterThan": 90
            }
          }
        }
      }
    }
  ]
}
EOF

az storage account management-policy create \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --policy @lifecycle-policy.json
```

### Step 4: Create App Service (Backend)

```bash
# App Service variables
export APP_SERVICE_PLAN="school-safety-plan"
export BACKEND_APP_NAME="school-safety-backend-$(date +%s)"

# Create App Service Plan
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku B1 \
  --tags $TAGS

# Create Web App
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP_NAME \
  --runtime "NODE:22-lts" \
  --tags $TAGS

# Configure startup command
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --startup-file "node dist/server.js"

# Enable Application Insights
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/appinsights-key/)"

# Set environment variables
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    PORT=8080 \
    NODE_ENV=production \
    AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT \
    AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY \
    AZURE_STORAGE_CONTAINER_NAME=$STORAGE_CONTAINER \
    WEBSITES_PORT=8080

# Configure health check
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --generic-configurations '{"healthCheckPath": "/health"}'

# Get backend URL
export BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "Backend URL: $BACKEND_URL"
```

**Production Recommendations:**
- Use **S1** or **P1V2** tier for production
- Enable **Always On** to prevent cold starts
- Configure **auto-scaling** rules
- Use **deployment slots** for zero-downtime deployments
- Enable **Application Insights** for monitoring

### Step 5: Create Static Web App (Frontend)

```bash
# Static Web App variables
export STATIC_WEB_APP_NAME="school-safety-pwa"
export GITHUB_REPO_URL="https://github.com/YOUR_USERNAME/school-safety-app"
export GITHUB_BRANCH="main"

# Create Static Web App (requires GitHub authentication)
az staticwebapp create \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "East US 2" \
  --source $GITHUB_REPO_URL \
  --branch $GITHUB_BRANCH \
  --app-location "/services/pwa" \
  --output-location ".next" \
  --tags $TAGS \
  --login-with-github

# Get deployment token (for CI/CD)
export STATIC_WEB_APP_TOKEN=$(az staticwebapp secrets list \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.apiKey -o tsv)

echo "Static Web App Token: $STATIC_WEB_APP_TOKEN"  # Save for GitHub Actions

# Configure environment variables
az staticwebapp appsettings set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    NEXT_PUBLIC_API_URL=$BACKEND_URL

# Get Static Web App URL
export PWA_URL=$(az staticwebapp show \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname -o tsv)

echo "PWA URL: https://$PWA_URL"
```

### Step 6: Create Application Insights

```bash
# Application Insights variables
export APPINSIGHTS_NAME="school-safety-insights"

# Create Application Insights
az monitor app-insights component create \
  --app $APPINSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --tags $TAGS

# Get instrumentation key
export APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

echo "Application Insights Key: $APPINSIGHTS_KEY"

# Update backend with Application Insights
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$APPINSIGHTS_KEY"
```

---

## Application Deployment

### Deploy Backend

**Option 1: Using ZIP Deploy**

```bash
# Build and package backend
cd services/backend
npm install
npm run build

# Create deployment package
zip -r deploy.zip dist node_modules package.json package-lock.json

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --src deploy.zip

# Check deployment status
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME
```

**Option 2: Using GitHub Actions** (Recommended)

1. Get publish profile:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --xml > backend-publish-profile.xml
```

2. Add to GitHub Secrets:
   - Go to GitHub → Settings → Secrets → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste contents of `backend-publish-profile.xml`

3. GitHub Actions workflow will auto-deploy on push to main

**Option 3: Using Container Registry** (Advanced)

```bash
# Create Azure Container Registry
export ACR_NAME="schoolsafetyacr$(date +%s)"

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Build and push Docker image
az acr build \
  --registry $ACR_NAME \
  --image school-safety-backend:latest \
  --file services/backend/Dockerfile \
  services/backend

# Configure App Service to use ACR
az webapp config container set \
  --name $BACKEND_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name ${ACR_NAME}.azurecr.io/school-safety-backend:latest \
  --docker-registry-server-url https://${ACR_NAME}.azurecr.io \
  --docker-registry-server-user $(az acr credential show -n $ACR_NAME --query username -o tsv) \
  --docker-registry-server-password $(az acr credential show -n $ACR_NAME --query passwords[0].value -o tsv)
```

### Deploy Frontend (PWA)

Frontend deploys automatically via GitHub Actions when you push to the configured branch.

**Manual deployment:**

```bash
cd services/pwa

# Install dependencies
npm ci --legacy-peer-deps

# Build
NEXT_PUBLIC_API_URL=$BACKEND_URL npm run build

# Deploy using SWA CLI
npm install -g @azure/static-web-apps-cli
swa deploy .next \
  --deployment-token $STATIC_WEB_APP_TOKEN \
  --app-location services/pwa \
  --output-location .next
```

---

## Configuration

### Environment Variables

**Backend (App Service):**

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
    DATABASE_URL="postgresql://user:pass@server.postgres.database.azure.com:5432/dbname?sslmode=require" \
    PORT=8080 \
    NODE_ENV=production \
    AZURE_STORAGE_ACCOUNT_NAME="your-storage-account" \
    AZURE_STORAGE_ACCOUNT_KEY="your-storage-key" \
    AZURE_STORAGE_CONTAINER_NAME="uploads" \
    APPINSIGHTS_INSTRUMENTATIONKEY="your-insights-key" \
    SESSION_SECRET="generate-random-secret" \
    CORS_ORIGIN="https://your-pwa-url.azurestaticapps.net"
```

**Frontend (Static Web App):**

```bash
az staticwebapp appsettings set \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    NEXT_PUBLIC_API_URL="https://your-backend.azurewebsites.net" \
    NEXT_PUBLIC_APP_NAME="School Safety App" \
    NEXT_PUBLIC_ENVIRONMENT="production"
```

### Database Initialization

```bash
# Connect to database
psql "$DATABASE_URL"

# Run migrations (if using Prisma)
cd services/backend
npx prisma migrate deploy

# Or run SQL scripts
psql "$DATABASE_URL" < schema.sql
```

---

## Monitoring & Logging

### Application Insights Setup

```bash
# Create custom dashboard
az portal dashboard create \
  --name "School Safety Dashboard" \
  --resource-group $RESOURCE_GROUP \
  --input-path dashboard.json

# Create alert rules
az monitor metrics alert create \
  --name "High Response Time" \
  --resource-group $RESOURCE_GROUP \
  --scopes "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$BACKEND_APP_NAME" \
  --condition "avg requests/duration > 2000" \
  --description "Alert when average response time exceeds 2s" \
  --evaluation-frequency 5m \
  --window-size 15m \
  --severity 2

# View logs
az monitor app-insights query \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --analytics-query "requests | where timestamp > ago(1h) | summarize count() by resultCode"
```

### Cost Alerts

```bash
# Create budget
az consumption budget create \
  --budget-name "school-safety-monthly" \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date 2025-12-31 \
  --resource-group $RESOURCE_GROUP
```

---

## Security

### Use Azure Key Vault

```bash
# Create Key Vault
export KEYVAULT_NAME="school-safety-kv-$(date +%s)"

az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Add secrets
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "db-password" \
  --value "$DB_ADMIN_PASSWORD"

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name "storage-key" \
  --value "$STORAGE_KEY"

# Grant App Service access
BACKEND_PRINCIPAL_ID=$(az webapp identity assign \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --query principalId -o tsv)

az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $BACKEND_PRINCIPAL_ID \
  --secret-permissions get list

# Use Key Vault references in App Settings
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --settings \
    DB_PASSWORD="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/db-password/)" \
    STORAGE_KEY="@Microsoft.KeyVault(SecretUri=https://${KEYVAULT_NAME}.vault.azure.net/secrets/storage-key/)"
```

### Enable HTTPS Only

```bash
# Backend
az webapp update \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --https-only true

# Frontend (automatic with Static Web Apps)
```

### Configure CORS

```bash
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME \
  --allowed-origins "https://${PWA_URL}"
```

---

## CI/CD Pipeline

The included `azure-pipelines.yml` provides automated deployment. To set up:

1. **Create Azure DevOps Project** or use **GitHub Actions**

2. **Add Service Connection** (Azure DevOps):
   - Go to Project Settings → Service Connections
   - Create new Azure Resource Manager connection
   - Select your subscription and resource group

3. **Configure Pipeline Variables**:
   ```yaml
   variables:
     RESOURCE_GROUP: 'school-safety-rg'
     BACKEND_APP_NAME: 'school-safety-backend'
     STATIC_WEB_APP_NAME: 'school-safety-pwa'
     AZURE_SUBSCRIPTION: 'Your-Subscription-Name'
   ```

4. **Push to trigger deployment**

---

## Scaling & Performance

### Auto-scaling Rules

```bash
# Set auto-scale for App Service
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $BACKEND_APP_NAME \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-backend \
  --min-count 1 \
  --max-count 5 \
  --count 1

# Add CPU-based rule
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-backend \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-backend \
  --condition "CpuPercentage < 30 avg 5m" \
  --scale in 1
```

---

## Backup & Disaster Recovery

### Database Backups

```bash
# Backups are automatic - configure retention
az postgres flexible-server parameter set \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --name backup_retention_days \
  --value 30

# Manual backup
az postgres flexible-server backup create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --backup-name "manual-backup-$(date +%Y%m%d)"

# Restore from backup
az postgres flexible-server restore \
  --resource-group $RESOURCE_GROUP \
  --name "${DB_SERVER_NAME}-restored" \
  --source-server $DB_SERVER_NAME \
  --restore-time "2025-01-15T10:00:00Z"
```

---

## Troubleshooting

### View Logs

```bash
# App Service logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP_NAME

# Application Insights logs
az monitor app-insights query \
  --app $APPINSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP \
  --analytics-query "traces | where timestamp > ago(1h)"
```

### Common Issues

See [QUICK_START_AZURE.md](./QUICK_START_AZURE.md#troubleshooting) for common issues and solutions.

---

## Cleanup (Delete Everything)

```bash
# WARNING: This deletes all resources!
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

---

## Summary

You now have a production-ready deployment on Azure with:
- ✅ Scalable web app (Static Web Apps)
- ✅ Scalable API (App Service)
- ✅ Managed database (PostgreSQL)
- ✅ File storage (Blob Storage)
- ✅ Monitoring (Application Insights)
- ✅ CI/CD (GitHub Actions)
- ✅ Security (HTTPS, Key Vault, RBAC)
- ✅ Backups (Automated)

**Next Steps:**
1. Configure custom domain
2. Set up staging environment
3. Implement blue-green deployments
4. Add WAF with Azure Front Door
5. Optimize costs with reserved instances
