# SafelyNotify.com - Complete Setup Guide

This guide walks you through setting up the full SafelyNotify.com platform with onboarding, authentication, file uploads, and QR code generation.

---

## 📋 Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **AWS Account** (for SES email and S3 storage)
- **npm** or **yarn**

---

## 🗄️ Database Setup

### 1. Create Database

```bash
createdb school_safety
```

Or connect to PostgreSQL:
```sql
CREATE DATABASE school_safety;
```

### 2. Run Migrations

Run all migrations in order:

```bash
cd services/backend

# Run each migration
psql $DATABASE_URL -f migrations/001_create_incidents.sql
psql $DATABASE_URL -f migrations/002_incident_analytics.sql
psql $DATABASE_URL -f migrations/003_create_safety_scores.sql
psql $DATABASE_URL -f migrations/004_add_school_id_to_incidents.sql
psql $DATABASE_URL -f migrations/005_create_routing_tables.sql
psql $DATABASE_URL -f migrations/006_create_ai_audit_logs.sql
psql $DATABASE_URL -f migrations/007_create_micro_guides.sql
psql $DATABASE_URL -f migrations/008_create_staff_notes.sql
psql $DATABASE_URL -f migrations/009_create_incident_events.sql

# New SafelyNotify.com migrations
psql $DATABASE_URL -f migrations/010_create_institutions.sql
psql $DATABASE_URL -f migrations/011_create_institution_admins.sql
psql $DATABASE_URL -f migrations/012_create_institution_features.sql
psql $DATABASE_URL -f migrations/013_create_staff_members.sql
psql $DATABASE_URL -f migrations/014_create_demo_requests.sql
psql $DATABASE_URL -f migrations/015_create_qr_codes.sql
psql $DATABASE_URL -f migrations/016_create_audit_logs.sql
psql $DATABASE_URL -f migrations/017_update_incidents_fk.sql
```

Or use a script:
```bash
for f in migrations/*.sql; do
  echo "Running $f..."
  psql $DATABASE_URL -f "$f"
done
```

### 3. Verify Tables

```bash
psql $DATABASE_URL -c "\dt"
```

You should see tables:
- `institutions`
- `institution_admins`
- `institution_features`
- `staff_members`
- `demo_requests`
- `qr_codes`
- `audit_logs`
- (plus all existing tables)

---

## ☁️ AWS Setup

### 1. AWS SES (Email)

**a) Verify Your Email Domain:**
1. Go to AWS SES Console
2. Verify your domain (e.g., `safelynotify.com`)
3. Or verify individual email addresses for testing

**b) Create SMTP Credentials:**
1. In SES Console → SMTP Settings
2. Create SMTP Credentials
3. Save the username and password

**c) Move Out of Sandbox (for production):**
- Request production access to send to any email
- For testing, you can use sandbox mode (verified emails only)

### 2. AWS S3 (File Storage)

**a) Create S3 Bucket:**
```bash
aws s3 mb s3://safelynotify-assets --region us-east-1
```

**b) Set Bucket Policy (Public Read for Logos/QR Codes):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::safelynotify-assets/*"
    }
  ]
}
```

**c) Create IAM User for S3:**
1. Create IAM user: `safelynotify-s3-user`
2. Attach policy: `AmazonS3FullAccess` (or create custom policy)
3. Generate Access Keys
4. Save Access Key ID and Secret Access Key

### 3. Configure CORS (for direct uploads from browser)

```bash
aws s3api put-bucket-cors --bucket safelynotify-assets --cors-configuration file://cors.json
```

`cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://safelynotify.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

---

## 🔧 Backend Configuration

### 1. Install Dependencies

```bash
cd services/backend
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

### 3. Configure `.env.local`

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/school_safety

# Server
PORT=3001
NODE_ENV=development

# JWT Authentication
JWT_SECRET=change-this-to-a-random-32-char-string-in-production
JWT_EXPIRES_IN=7d

# Email (AWS SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=YOUR_SES_SMTP_USERNAME
SMTP_PASS=YOUR_SES_SMTP_PASSWORD
FROM_EMAIL=noreply@safelynotify.com

# Application URLs
APP_URL=http://localhost:3000

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
S3_BUCKET=safelynotify-assets
CDN_URL=https://safelynotify-assets.s3.amazonaws.com

# Legacy tokens
ADMIN_TOKEN=admin-token-12345
STAFF_TOKEN=staff-token-67890
```

### 4. Start Backend Server

```bash
npm run dev
```

Server should start on http://localhost:3001

Test health check:
```bash
curl http://localhost:3001/health
```

---

## 🎨 Frontend Configuration

### 1. Install Dependencies

```bash
cd services/pwa
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

`.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend should start on http://localhost:3000

---

## ✅ Testing the Complete Flow

### 1. Test Onboarding (Educational Institution)

**a) Visit the homepage:**
```
http://localhost:3000
```

**b) Click "Get Free Access (Schools & Colleges)"**

**c) Fill out the onboarding form:**
- Institution Type: School
- Name: Lincoln High School
- Location: Boston, MA
- Email: admin@lincoln.edu (use a verified SES email for testing)
- Contact: John Doe
- Phone: +1-555-123-4567

**d) Choose URL slug:**
- Suggested: `lincoln-high`

**e) Configure features:**
- Enable: Alerts, Reports, Notifications
- Optional: Add staff emails

**f) Accept terms and complete**

**g) Check email for verification link**

### 2. Verify Email & Set Password

**a) Click verification link from email**

**b) Set password:**
- Min 8 characters
- 1 uppercase letter
- 1 number

**c) You'll be logged in automatically**

### 3. Upload Logo

**a) Go to Admin Settings:**
```
http://localhost:3000/admin/settings
```

**b) Click "Branding & URL" tab**

**c) Upload institution logo:**
- Click "Upload Logo"
- Select PNG/JPG file (max 5MB)
- Image will be resized to 200x200

**d) Logo should appear immediately**

### 4. Generate QR Code

**a) Still in Admin Settings**

**b) Scroll to "Generate QR Code" section**

**c) Click "Generate QR"**

**d) QR code image should appear**

**e) Right-click to download QR code**

### 5. Test Kiosk URL

**a) Visit your institution's kiosk:**
```
http://localhost:3000/kiosk/lincoln-high
```

**b) Verify:**
- Institution logo displays
- Brand colors applied
- Kiosk is functional

### 6. Test Demo Booking (Corporate)

**a) Go back to homepage**

**b) Click "Book a Demo (Corporates & NGOs)"**

**c) Fill out demo form:**
- Organization: Acme Corp
- Type: Corporate
- Contact info
- Preferred date/time

**d) Submit**

**e) Check database:**
```sql
SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 1;
```

---

## 🔍 Testing API Endpoints

### Register & Login

**1. Complete onboarding (creates unverified admin)**

**2. Verify email:**
```bash
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_EMAIL",
    "password": "SecurePass123"
  }'
```

**3. Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lincoln.edu",
    "password": "SecurePass123"
  }'
```

Response includes `accessToken`. Save it!

### Get Institution Info

```bash
curl http://localhost:3001/api/institutions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Upload Logo

```bash
curl -X POST http://localhost:3001/api/institutions/1/logo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "logo=@/path/to/logo.png"
```

### Generate QR Code

```bash
curl -X POST http://localhost:3001/api/institutions/1/qr-code \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "kiosk",
    "size": 512
  }'
```

### Update Settings

```bash
curl -X PATCH http://localhost:3001/api/institutions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionName": "Lincoln High School Updated",
    "brandColor": "#10B981"
  }'
```

---

## 🐛 Troubleshooting

### Email Not Sending

**Check:**
1. SES is out of sandbox mode (or recipient email is verified)
2. SMTP credentials are correct
3. FROM_EMAIL is verified in SES

**View logs:**
```bash
# Backend logs will show email sending status
npm run dev
```

### Logo Upload Fails

**Check:**
1. AWS credentials are correct
2. S3 bucket exists and is accessible
3. File size is under 5MB
4. File type is PNG, JPG, or SVG

**Test S3 access:**
```bash
aws s3 ls s3://safelynotify-assets/
```

### QR Code Generation Fails

**Check backend logs for errors**

**Test manually:**
```bash
npm install -g qrcode-terminal
echo "https://lincoln-high.safelynotify.com/kiosk/lincoln-high" | qrcode-terminal
```

### Database Connection Failed

**Check:**
1. PostgreSQL is running
2. DATABASE_URL is correct
3. Database exists

**Test connection:**
```bash
psql $DATABASE_URL -c "SELECT NOW()"
```

### JWT Token Invalid

**Check:**
1. JWT_SECRET matches between sessions
2. Token hasn't expired (default 7 days)
3. Admin account is active

**Decode token:**
```bash
# Use jwt.io or
npm install -g jwt-cli
jwt decode YOUR_TOKEN
```

---

## 📊 Useful SQL Queries

### View All Institutions

```sql
SELECT id, institution_name, institution_type, url_slug,
       email, onboarding_completed, created_at
FROM institutions
ORDER BY created_at DESC;
```

### View Admins

```sql
SELECT a.id, a.name, a.email, a.role, a.email_verified,
       i.institution_name
FROM institution_admins a
JOIN institutions i ON i.id = a.institution_id
ORDER BY a.created_at DESC;
```

### View Demo Requests

```sql
SELECT organization_name, organization_type, contact_name,
       email, status, created_at
FROM demo_requests
ORDER BY created_at DESC;
```

### View Audit Logs

```sql
SELECT al.action, al.created_at, a.name as admin_name,
       i.institution_name
FROM audit_logs al
LEFT JOIN institution_admins a ON a.id = al.admin_id
LEFT JOIN institutions i ON i.id = al.institution_id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Grant Free Access Manually

```sql
UPDATE institutions
SET free_access_granted = true,
    free_access_number = 1  -- Assign number 1-100
WHERE id = 1;
```

---

## 🚀 Production Deployment

### Environment Variables to Update

```bash
# Use production database
DATABASE_URL=postgresql://user:pass@production-db:5432/school_safety

# Strong JWT secret (32+ characters)
JWT_SECRET=generate-a-strong-random-secret-here

# Production URL
APP_URL=https://safelynotify.com

# Production S3 bucket
S3_BUCKET=safelynotify-production-assets

# SES production credentials
SMTP_USER=production-ses-user
SMTP_PASS=production-ses-password
FROM_EMAIL=noreply@safelynotify.com
```

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS only
- [ ] Enable SES production access
- [ ] Set up S3 bucket policies
- [ ] Enable database SSL
- [ ] Set NODE_ENV=production
- [ ] Configure rate limiting
- [ ] Enable CORS properly
- [ ] Backup database regularly
- [ ] Monitor error logs

---

## 📞 Support

For issues or questions:
- Email: support@safelynotify.com
- GitHub Issues: [Link to repo]

---

**You're all set!** 🎉

The platform should now be fully functional with:
- ✅ Marketing website
- ✅ Self-serve onboarding
- ✅ Email verification
- ✅ Authentication
- ✅ Logo uploads
- ✅ QR code generation
- ✅ Admin settings
- ✅ Demo booking
