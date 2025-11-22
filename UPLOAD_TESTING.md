# SafelyNotify Production Upload Testing Guide

This guide helps you test file upload functionality on the production SafelyNotify platform.

## 📋 Prerequisites

1. **Test Image**: Create or obtain a test image file named `test.jpg` in the project root
2. **Production Access**: Ensure the production server is running at `https://safelynotify.azurewebsites.net`
3. **Dependencies**: For Node.js test, install required packages

## 🚀 Quick Start

### Option 1: Bash Script (Recommended)
```bash
# 1. Create test image (or use any existing .jpg file)
cp /path/to/your/image.jpg test.jpg

# 2. Run the test script
./test-uploads.sh
```

### Option 2: Node.js Script (More detailed)
```bash
# 1. Install dependencies
npm install form-data node-fetch

# 2. Create test image
cp /path/to/your/image.jpg test.jpg

# 3. Run tests
node test-uploads.js
```

## 🧪 Test Coverage

The tests cover these upload scenarios:

### 1. **Health Check** ✅
- Verifies production server is running
- Checks database connectivity

### 2. **Anonymous Incident Report Upload** 🔒
- Tests the complete incident reporting flow with file attachments
- **Flow**: Get upload URL → Upload file → Submit report with attachment reference
- **Authentication**: None required (anonymous reporting)

### 3. **Institution Logo Upload** 👤
- Tests authenticated logo upload for institutions
- **Authentication**: Requires admin JWT token

## 🔑 Authentication Setup (Optional)

To test authenticated endpoints (logo upload), set environment variables:

```bash
# Option 1: Export variables
export ADMIN_TOKEN="your_jwt_token_here"
export INSTITUTION_ID="123"
./test-uploads.sh

# Option 2: Inline
ADMIN_TOKEN="your_token" INSTITUTION_ID="123" ./test-uploads.sh
```

### Getting Admin Token
1. Login to admin dashboard: `https://safelynotify.azurewebsites.net/login`
2. Open browser developer tools → Network tab
3. Make an authenticated request
4. Copy the `Authorization: Bearer <token>` from request headers

## 📊 Expected Results

### ✅ Success Indicators
- Health check returns `200` with database status
- Upload URL generation returns `200` with S3 pre-signed URL
- File upload to storage returns `200/204`
- Report submission returns `200/201` with report ID
- Logo upload returns `200` with logo URL

### ❌ Common Issues

| Problem | Cause | Solution |
|---------|--------|----------|
| Health check fails | Server down | Check Azure deployment status |
| Upload URL fails | Backend API error | Check server logs |
| File upload fails | Invalid pre-signed URL | Verify S3/storage configuration |
| Report submission fails | Validation error | Check required fields |
| Logo upload fails | Authentication | Verify admin token is valid |

## 🔍 Debugging

### Check Server Logs
```bash
# Azure CLI (if you have access)
az webapp log tail --name safelynotify --resource-group your-resource-group

# Or check Application Insights in Azure Portal
```

### Test Individual Endpoints
```bash
# Health check
curl https://safelynotify.azurewebsites.net/health

# Get upload URL
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}' \
  https://safelynotify.azurewebsites.net/upload-url
```

## 📁 File Upload Architecture

The SafelyNotify platform uses a two-step upload process:

1. **Pre-signed URL Generation** (`/upload-url`)
   - Client requests upload URL with file metadata
   - Server generates secure S3 pre-signed URL
   - Returns upload URL and file key

2. **Direct Upload to Storage**
   - Client uploads file directly to S3 using pre-signed URL
   - Bypasses server for better performance
   - Secure: URL expires after limited time

3. **Report/Data Submission**
   - Client submits form data with file key reference
   - Server processes report and associates file by key

## 🔒 Security Features

- **Anonymous Uploads**: No authentication required for incident reports
- **Pre-signed URLs**: Temporary, secure upload URLs
- **File Type Validation**: Only allowed file types accepted
- **Size Limits**: 5MB max per file
- **Content Type Enforcement**: MIME type validation

## 📈 Production Monitoring

After running tests, monitor:
- **Server Performance**: Response times should be < 2 seconds
- **Storage Usage**: Check S3 bucket for test files
- **Database**: Verify test reports appear in incidents table
- **Error Logs**: Watch for any upload-related errors

## 🧹 Cleanup

Test files are marked as demo data and can be safely deleted:

```sql
-- Remove test reports (if you have database access)
DELETE FROM incidents WHERE description LIKE '%automated test%' OR demo = true;

-- Remove test uploads from S3 (if needed)
aws s3 rm s3://your-bucket/uploads/test-* --recursive
```

## 🆘 Troubleshooting

If uploads fail:

1. **Check network connectivity** to Azure
2. **Verify file permissions** on test.jpg
3. **Check file size** (must be < 5MB)
4. **Validate file type** (JPG, PNG, SVG only)
5. **Review server logs** for detailed error messages
6. **Test with different file** to rule out file corruption

## 📞 Support

If tests consistently fail, check:
- Azure App Service status
- Database connectivity
- S3/storage bucket permissions
- Network firewall rules

The upload system is critical for incident reporting functionality. All tests should pass for a healthy production environment.