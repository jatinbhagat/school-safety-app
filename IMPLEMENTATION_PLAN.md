# SafelyNotify.com - Full Implementation Plan

## Executive Summary

This document outlines the complete implementation plan to make SafelyNotify.com fully functional from onboarding to daily usage. The implementation covers:

1. **Database Schema** - Complete multi-tenant institution management
2. **Backend API** - All endpoints for onboarding, file uploads, QR codes, and operations
3. **Authentication & Authorization** - Secure admin access with JWT tokens
4. **File Management** - Logo uploads to S3
5. **URL/Subdomain System** - Custom institution URLs
6. **End-to-End User Journey** - From onboarding to incident management

---

## 1. Database Schema Design

### 1.1 New Tables to Create

#### **institutions** Table
Stores all institution information from onboarding.

```sql
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,

    -- Basic Information
    institution_name TEXT NOT NULL,
    institution_type TEXT NOT NULL CHECK (institution_type IN ('school', 'college', 'university', 'corporate', 'ngo')),
    location TEXT NOT NULL,

    -- Contact Details
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,

    -- URL & Branding
    url_slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#3B82F6',

    -- Access & Status
    access_type TEXT DEFAULT 'free' CHECK (access_type IN ('free', 'trial', 'paid', 'demo_required')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Free Access Tracking (first 100)
    free_access_granted BOOLEAN DEFAULT FALSE,
    free_access_number INTEGER, -- 1-100 for first 100 institutions

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    onboarded_at TIMESTAMPTZ,

    -- Metadata
    onboarding_data JSONB, -- Stores complete onboarding form data
    settings JSONB DEFAULT '{}' -- Institution-specific settings
);

-- Indexes
CREATE INDEX idx_institutions_url_slug ON institutions(url_slug);
CREATE INDEX idx_institutions_email ON institutions(email);
CREATE INDEX idx_institutions_type ON institutions(institution_type);
CREATE INDEX idx_institutions_active ON institutions(is_active);
CREATE INDEX idx_institutions_created ON institutions(created_at DESC);
```

#### **institution_admins** Table
Manages admin users for each institution.

```sql
CREATE TABLE IF NOT EXISTS institution_admins (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Admin Details
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),

    -- Authentication
    password_hash TEXT, -- Bcrypt hash
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires_at TIMESTAMPTZ,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    UNIQUE(institution_id, email)
);

-- Indexes
CREATE INDEX idx_admins_institution ON institution_admins(institution_id);
CREATE INDEX idx_admins_email ON institution_admins(email);
CREATE INDEX idx_admins_verification_token ON institution_admins(verification_token);
CREATE INDEX idx_admins_reset_token ON institution_admins(reset_token);
```

#### **institution_features** Table
Tracks which features are enabled for each institution.

```sql
CREATE TABLE IF NOT EXISTS institution_features (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- Features
    alerts_enabled BOOLEAN DEFAULT TRUE,
    reports_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    analytics_enabled BOOLEAN DEFAULT FALSE,

    -- Configuration
    feature_config JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(institution_id)
);
```

#### **staff_members** Table
Staff emails invited during onboarding (optional).

```sql
CREATE TABLE IF NOT EXISTS staff_members (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    email TEXT NOT NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

    UNIQUE(institution_id, email)
);

CREATE INDEX idx_staff_institution ON staff_members(institution_id);
```

#### **demo_requests** Table
Stores demo booking requests from corporates/NGOs.

```sql
CREATE TABLE IF NOT EXISTS demo_requests (
    id SERIAL PRIMARY KEY,

    -- Organization Info
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    industry TEXT,
    size TEXT,

    -- Contact Info
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,

    -- Scheduling
    preferred_date DATE,
    preferred_time TEXT,
    message TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'declined')),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    demo_data JSONB, -- Stores complete form data
    notes TEXT, -- Internal notes from sales team

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_demo_status ON demo_requests(status);
CREATE INDEX idx_demo_created ON demo_requests(created_at DESC);
```

#### **qr_codes** Table
Stores generated QR codes for institutions.

```sql
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,

    -- QR Code Data
    qr_code_url TEXT NOT NULL, -- S3 URL to QR code image
    qr_code_data TEXT NOT NULL, -- The URL encoded in QR (institution kiosk URL)
    qr_type TEXT DEFAULT 'kiosk' CHECK (qr_type IN ('kiosk', 'admin', 'custom')),

    -- Metadata
    size INTEGER DEFAULT 512, -- Image size in pixels
    format TEXT DEFAULT 'png',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ, -- Optional expiration

    UNIQUE(institution_id, qr_type)
);

CREATE INDEX idx_qr_institution ON qr_codes(institution_id);
```

#### **audit_logs** Table
Tracks all admin actions for security and compliance.

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
    admin_id INTEGER REFERENCES institution_admins(id) ON DELETE SET NULL,

    -- Action Details
    action TEXT NOT NULL, -- e.g., 'login', 'update_settings', 'upload_logo'
    entity_type TEXT, -- e.g., 'institution', 'admin', 'incident'
    entity_id INTEGER,

    -- Change Tracking
    old_values JSONB,
    new_values JSONB,

    -- Request Info
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_institution ON audit_logs(institution_id);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### 1.2 Update Existing Tables

#### Update **incidents** table
Link incidents to institutions.

```sql
-- Already has school_id, now we'll make it reference institutions
ALTER TABLE incidents
ADD CONSTRAINT fk_incidents_institution
FOREIGN KEY (school_id) REFERENCES institutions(id) ON DELETE CASCADE;

-- Add index for institution-based queries
CREATE INDEX IF NOT EXISTS idx_incidents_institution_status
ON incidents(school_id, status);
```

---

## 2. Backend API Endpoints

### 2.1 Onboarding Endpoints

#### **POST /api/onboarding/start**
Initiates onboarding and checks eligibility.

**Request:**
```json
{
  "institutionType": "school",
  "institutionName": "Lincoln High School",
  "location": "Boston, MA",
  "email": "admin@lincoln.edu",
  "contactName": "John Doe",
  "phone": "+1-555-123-4567"
}
```

**Response:**
```json
{
  "success": true,
  "institutionId": 123,
  "eligibleForFree": true,
  "freeAccessNumber": 45,
  "message": "You are eligible for free access as institution #45 of the first 100!"
}
```

**Logic:**
- Check if email already exists
- For educational institutions, check if under 100 free slots
- Create institution record with `onboarding_completed: false`
- Return eligibility status

#### **POST /api/onboarding/complete**
Completes onboarding after all steps.

**Request:**
```json
{
  "institutionId": 123,
  "urlSlug": "lincoln-high",
  "features": {
    "alerts": true,
    "reports": true,
    "notifications": true,
    "analytics": false
  },
  "staffEmails": ["staff1@lincoln.edu", "staff2@lincoln.edu"],
  "acceptedTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "institution": {
    "id": 123,
    "name": "Lincoln High School",
    "urlSlug": "lincoln-high",
    "kioskUrl": "https://lincoln-high.safelynotify.com"
  },
  "admin": {
    "email": "admin@lincoln.edu",
    "verificationSent": true
  }
}
```

**Logic:**
- Validate URL slug is unique
- Create institution_features record
- Create staff_members records
- Create primary institution_admin
- Send verification email
- Mark `onboarding_completed: true`

#### **GET /api/onboarding/check-slug/:slug**
Checks if URL slug is available.

**Response:**
```json
{
  "available": true,
  "slug": "lincoln-high",
  "suggestedAlternatives": ["lincoln-high-1", "lincoln-high-school"]
}
```

### 2.2 Demo Booking Endpoints

#### **POST /api/demo/request**
Submits demo booking request.

**Request:**
```json
{
  "organizationName": "Acme Corp",
  "organizationType": "corporate",
  "industry": "Technology",
  "size": "201-500",
  "contactName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+1-555-987-6543",
  "preferredDate": "2024-12-01",
  "preferredTime": "2pm-4pm",
  "message": "Interested in safety platform for our offices"
}
```

**Response:**
```json
{
  "success": true,
  "requestId": 456,
  "message": "Demo request received. Our team will contact you within 24 hours."
}
```

### 2.3 Authentication Endpoints

#### **POST /api/auth/register**
Register admin account (called during onboarding).

**Request:**
```json
{
  "institutionId": 123,
  "email": "admin@lincoln.edu",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent to admin@lincoln.edu"
}
```

#### **POST /api/auth/verify-email**
Verify email with token.

**Request:**
```json
{
  "token": "abc123xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "accessToken": "jwt_token_here"
}
```

#### **POST /api/auth/login**
Login with email/password.

**Request:**
```json
{
  "email": "admin@lincoln.edu",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "jwt_token_here",
  "admin": {
    "id": 1,
    "name": "John Doe",
    "email": "admin@lincoln.edu",
    "role": "super_admin",
    "institution": {
      "id": 123,
      "name": "Lincoln High School",
      "urlSlug": "lincoln-high"
    }
  }
}
```

### 2.4 Institution Settings Endpoints

#### **GET /api/institutions/:id**
Get institution details (authenticated).

**Response:**
```json
{
  "id": 123,
  "institutionName": "Lincoln High School",
  "institutionType": "school",
  "location": "Boston, MA",
  "urlSlug": "lincoln-high",
  "logoUrl": "https://s3.../logos/123.png",
  "brandColor": "#3B82F6",
  "accessType": "free",
  "freeAccessNumber": 45,
  "features": {
    "alerts": true,
    "reports": true,
    "notifications": true,
    "analytics": false
  }
}
```

#### **PATCH /api/institutions/:id**
Update institution settings.

**Request:**
```json
{
  "institutionName": "Lincoln High School Updated",
  "brandColor": "#10B981"
}
```

#### **PATCH /api/institutions/:id/url-slug**
Update URL slug (with conflict check).

**Request:**
```json
{
  "urlSlug": "lincoln-high-new"
}
```

**Response:**
```json
{
  "success": true,
  "oldSlug": "lincoln-high",
  "newSlug": "lincoln-high-new",
  "newKioskUrl": "https://lincoln-high-new.safelynotify.com",
  "warning": "Make sure to update any printed QR codes!"
}
```

### 2.5 File Upload Endpoints

#### **POST /api/upload/logo**
Upload institution logo.

**Request:** multipart/form-data with file

**Response:**
```json
{
  "success": true,
  "logoUrl": "https://s3.amazonaws.com/safelynotify-logos/123/logo-1234567890.png",
  "thumbnailUrl": "https://s3.amazonaws.com/.../logo-thumb.png"
}
```

**Implementation:**
- Accept image upload (PNG, JPG, SVG)
- Validate file size (max 5MB)
- Resize to 200x200 for thumbnail
- Upload to S3: `safelynotify-logos/{institutionId}/logo-{timestamp}.png`
- Update `institutions.logo_url`
- Create audit log entry

### 2.6 QR Code Endpoints

#### **POST /api/institutions/:id/qr-code**
Generate QR code for institution kiosk.

**Request:**
```json
{
  "type": "kiosk",
  "size": 512
}
```

**Response:**
```json
{
  "success": true,
  "qrCodeUrl": "https://s3.amazonaws.com/safelynotify-qr/123/kiosk-qr.png",
  "qrCodeData": "https://lincoln-high.safelynotify.com/kiosk/lincoln-high",
  "downloadUrl": "https://api.safelynotify.com/download/qr/abc123"
}
```

**Implementation:**
- Use `qrcode` npm package to generate QR code
- Encode institution kiosk URL
- Upload PNG to S3
- Store in `qr_codes` table
- Return download URL

#### **GET /api/download/qr/:token**
Download QR code file (for easy sharing).

### 2.7 Admin Management Endpoints

#### **GET /api/institutions/:id/admins**
List all admins for institution.

#### **POST /api/institutions/:id/admins**
Add new admin.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@lincoln.edu",
  "role": "admin"
}
```

#### **DELETE /api/institutions/:id/admins/:adminId**
Remove admin (only super_admin can do this).

### 2.8 Existing Incidents Integration

#### **POST /api/report**
Update to include institution lookup via URL slug.

**Logic:**
- Extract subdomain from request (e.g., `lincoln-high` from URL)
- Look up institution by `url_slug`
- Attach `school_id` (institution_id) to incident
- Process as normal

---

## 3. File Management System

### 3.1 S3 Bucket Structure

```
safelynotify-assets/
├── logos/
│   ├── {institutionId}/
│   │   ├── logo-{timestamp}.png
│   │   └── logo-thumb-{timestamp}.png
├── qr-codes/
│   ├── {institutionId}/
│   │   ├── kiosk-qr-{timestamp}.png
│   │   └── admin-qr-{timestamp}.png
└── incident-attachments/
    └── {institutionId}/
        └── {incidentId}/
            └── {filename}
```

### 3.2 Upload Implementation

**Dependencies:**
- `multer` - Handle multipart form uploads
- `sharp` - Image resizing/optimization
- `@aws-sdk/client-s3` - Already installed

**Logo Upload Handler:**
```typescript
// services/backend/src/handlers/uploadLogo.ts
import multer from 'multer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const uploadLogo = [
  upload.single('logo'),
  async (req, res) => {
    const { institutionId } = req.params;
    const file = req.file;

    // Resize to 200x200
    const resized = await sharp(file.buffer)
      .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    // Upload to S3
    const key = `logos/${institutionId}/logo-${Date.now()}.png`;
    await s3Client.send(new PutObjectCommand({
      Bucket: 'safelynotify-assets',
      Key: key,
      Body: resized,
      ContentType: 'image/png',
      ACL: 'public-read',
    }));

    const logoUrl = `https://safelynotify-assets.s3.amazonaws.com/${key}`;

    // Update database
    await pool.query(
      'UPDATE institutions SET logo_url = $1, updated_at = NOW() WHERE id = $2',
      [logoUrl, institutionId]
    );

    res.json({ success: true, logoUrl });
  },
];
```

---

## 4. QR Code Generation

### 4.1 Dependencies

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

### 4.2 QR Code Handler

```typescript
// services/backend/src/handlers/generateQRCode.ts
import QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function generateQRCode(req, res) {
  const { institutionId } = req.params;
  const { type = 'kiosk', size = 512 } = req.body;

  // Get institution
  const result = await pool.query(
    'SELECT url_slug FROM institutions WHERE id = $1',
    [institutionId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Institution not found' });
  }

  const { url_slug } = result.rows[0];
  const qrData = `https://${url_slug}.safelynotify.com/kiosk/${url_slug}`;

  // Generate QR code as buffer
  const qrBuffer = await QRCode.toBuffer(qrData, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Upload to S3
  const key = `qr-codes/${institutionId}/${type}-qr-${Date.now()}.png`;
  await s3Client.send(new PutObjectCommand({
    Bucket: 'safelynotify-assets',
    Key: key,
    Body: qrBuffer,
    ContentType: 'image/png',
    ACL: 'public-read',
  }));

  const qrCodeUrl = `https://safelynotify-assets.s3.amazonaws.com/${key}`;

  // Store in database
  await pool.query(
    `INSERT INTO qr_codes (institution_id, qr_code_url, qr_code_data, qr_type, size)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (institution_id, qr_type)
     DO UPDATE SET qr_code_url = $2, qr_code_data = $3, created_at = NOW()`,
    [institutionId, qrCodeUrl, qrData, type, size]
  );

  res.json({
    success: true,
    qrCodeUrl,
    qrCodeData: qrData,
  });
}
```

---

## 5. URL/Subdomain Routing System

### 5.1 Architecture Options

**Option A: Application-Level Routing (Recommended for MVP)**
- PWA app reads subdomain from `window.location.hostname`
- Looks up institution by URL slug
- Loads institution-specific branding and data
- **Pros:** Simple to implement, no DNS changes needed
- **Cons:** All traffic goes through one domain

**Option B: True Subdomain Routing (Production)**
- Wildcard DNS: `*.safelynotify.com` → Load Balancer
- Load balancer routes based on subdomain
- Separate SSL cert for wildcard domain
- **Pros:** True multi-tenancy, better isolation
- **Cons:** More complex infrastructure

### 5.2 Implementation (Option A - Application-Level)

**Frontend (PWA):**
```typescript
// services/pwa/lib/institution.ts
export async function getInstitutionFromSubdomain() {
  const hostname = window.location.hostname;

  // Extract slug from subdomain
  // lincoln-high.safelynotify.com -> lincoln-high
  // localhost:3000 -> demo-school (default for dev)

  const parts = hostname.split('.');
  let slug = 'demo-school'; // Default

  if (parts.length >= 3 && parts[parts.length - 2] === 'safelynotify') {
    slug = parts[0];
  }

  // Fetch institution data
  const response = await fetch(`/api/institutions/by-slug/${slug}`);
  const institution = await response.json();

  return institution;
}
```

**Backend Endpoint:**
```typescript
// GET /api/institutions/by-slug/:slug
export async function getInstitutionBySlug(req, res) {
  const { slug } = req.params;

  const result = await pool.query(
    `SELECT i.*, f.*
     FROM institutions i
     LEFT JOIN institution_features f ON f.institution_id = i.id
     WHERE i.url_slug = $1 AND i.is_active = true`,
    [slug]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Institution not found' });
  }

  res.json(result.rows[0]);
}
```

**Apply Branding:**
```typescript
// services/pwa/app/kiosk/[slug]/page.tsx
export default async function KioskPage({ params }) {
  const institution = await getInstitutionBySlug(params.slug);

  return (
    <div style={{ '--brand-color': institution.brandColor }}>
      <header>
        {institution.logoUrl && <img src={institution.logoUrl} alt="Logo" />}
        <h1>{institution.institutionName}</h1>
      </header>
      {/* Rest of kiosk UI */}
    </div>
  );
}
```

---

## 6. Complete User Journey

### 6.1 Educational Institution Flow

**Step 1: Onboarding**
1. User visits SafelyNotify.com homepage
2. Clicks "Get Free Access (Schools & Colleges)"
3. Selects institution type → "School"
4. Fills out institution details
5. Chooses URL slug → `lincoln-high`
6. Configures features
7. Accepts terms
8. **Backend:** Creates institution record, sends verification email

**Step 2: Email Verification**
1. Admin receives email: "Verify your SafelyNotify.com account"
2. Clicks verification link
3. Redirected to password creation page
4. Creates password
5. **Backend:** Marks email as verified, creates admin account

**Step 3: First Login**
1. Admin logs in with email/password
2. **Backend:** Issues JWT token
3. Redirected to `/admin/settings`
4. Sees onboarding checklist

**Step 4: Setup**
1. Uploads institution logo
2. Customizes brand color (optional)
3. Invites staff members
4. Generates QR code for kiosk
5. Tests kiosk at `https://lincoln-high.safelynotify.com`

**Step 5: Daily Usage**
1. Students use kiosk to report incidents
2. Incidents auto-route to appropriate staff
3. Staff responds via `/admin/incidents/:id`
4. Admin views analytics at `/admin/analytics`

### 6.2 Corporate/NGO Flow

**Step 1: Demo Request**
1. User visits SafelyNotify.com homepage
2. Clicks "Book a Demo (Corporates & NGOs)"
3. Fills out demo form
4. **Backend:** Creates demo_request record
5. Receives confirmation email

**Step 2: Sales Follow-up**
1. Sales team contacts within 24 hours
2. Schedules live demo
3. After demo, creates custom proposal
4. If accepted, manually creates institution account with `access_type: 'paid'`

---

## 7. Authentication & Security

### 7.1 JWT Token Structure

```typescript
{
  adminId: 123,
  institutionId: 456,
  email: "admin@lincoln.edu",
  role: "super_admin",
  iat: 1234567890,
  exp: 1234657890
}
```

### 7.2 Middleware

**Institution Context Middleware:**
```typescript
// Automatically loads institution for authenticated requests
export async function institutionContext(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const result = await pool.query(
    'SELECT * FROM institutions WHERE id = $1',
    [decoded.institutionId]
  );

  req.institution = result.rows[0];
  req.admin = decoded;

  next();
}
```

### 7.3 Row-Level Security

```sql
-- Only allow access to incidents from your own institution
CREATE POLICY institution_isolation ON incidents
  FOR ALL
  USING (school_id = current_setting('app.institution_id', true)::integer);

-- Set in middleware
await pool.query('SET app.institution_id = $1', [institutionId]);
```

---

## 8. Migration Plan

### 8.1 Database Migrations Order

```
010_create_institutions.sql
011_create_institution_admins.sql
012_create_institution_features.sql
013_create_staff_members.sql
014_create_demo_requests.sql
015_create_qr_codes.sql
016_create_audit_logs.sql
017_update_incidents_fk.sql
```

### 8.2 Environment Variables

```bash
# .env.local additions
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=safelynotify-assets

# Email (for verification emails)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@safelynotify.com
```

---

## 9. NPM Dependencies to Add

### Backend
```json
{
  "multer": "^1.4.5-lts.1",
  "sharp": "^0.33.0",
  "qrcode": "^1.5.3",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "nodemailer": "^6.9.7"
}
```

### Dev Dependencies
```json
{
  "@types/multer": "^1.4.11",
  "@types/qrcode": "^1.5.5",
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/nodemailer": "^6.4.14"
}
```

---

## 10. Implementation Phases

### Phase 1: Database & Core Backend (Days 1-2)
- [ ] Create all database migrations
- [ ] Run migrations
- [ ] Create institution CRUD handlers
- [ ] Create authentication handlers (register, login, verify)
- [ ] Add JWT middleware

### Phase 2: Onboarding Flow (Days 3-4)
- [ ] Onboarding API endpoints
- [ ] URL slug validation
- [ ] Free access counter logic
- [ ] Email verification system
- [ ] Frontend integration with backend

### Phase 3: File Uploads & QR Codes (Day 5)
- [ ] S3 setup and configuration
- [ ] Logo upload handler
- [ ] QR code generation handler
- [ ] Download endpoints

### Phase 4: Settings & Admin (Days 6-7)
- [ ] Settings API endpoints
- [ ] Admin management endpoints
- [ ] Audit logging
- [ ] Frontend settings integration

### Phase 5: Institution Context & Routing (Day 8)
- [ ] Subdomain detection
- [ ] Institution lookup by slug
- [ ] Branding application
- [ ] Update incident submission to use institution

### Phase 6: Testing & Polish (Days 9-10)
- [ ] End-to-end flow testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation
- [ ] Demo data seeding

---

## 11. Success Criteria

### Functional Requirements
✅ User can complete onboarding from start to finish
✅ First 100 educational institutions get free access automatically
✅ Logo upload works and displays correctly
✅ QR code generation works and is downloadable
✅ Custom URL slugs work: `{slug}.safelynotify.com`
✅ Admin can log in and access dashboard
✅ Settings changes persist and apply
✅ Incidents are properly isolated by institution
✅ Demo booking works for corporates/NGOs

### Non-Functional Requirements
✅ Page load time < 2 seconds
✅ Image uploads < 5 seconds
✅ QR code generation < 3 seconds
✅ All passwords are bcrypt hashed
✅ All API endpoints use JWT authentication
✅ No SQL injection vulnerabilities
✅ Audit logs for all admin actions

---

## 12. Open Questions for Review

1. **Email Service:** Should we use SendGrid, AWS SES, or another service for transactional emails?

2. **S3 Bucket:** Should we create one bucket or separate buckets for logos/QR codes?

3. **Free Access Logic:** Should the "first 100" counter be strictly chronological, or should we allow manual approval?

4. **Password Requirements:** Should we enforce specific password complexity rules? (I recommend: min 8 chars, 1 uppercase, 1 number)

5. **URL Slug Changes:** Should we allow institutions to change their URL slug after onboarding? If yes, should we keep redirect from old → new?

6. **Demo Requests:** Should demo requests automatically create a "pending" institution, or wait for manual sales team activation?

7. **Multi-Admin:** Should the first admin be auto-promoted to "super_admin", or should we ask during onboarding?

8. **QR Code Regeneration:** Should we allow regenerating QR codes, or make them immutable?

9. **Subdomain Infrastructure:** Start with application-level routing (Option A) and migrate to true subdomains later, or invest in true subdomain infrastructure now?

10. **Rate Limiting:** Should we add rate limiting to prevent abuse of onboarding endpoint?

---

## Next Steps

Once you review and approve this plan (with answers to open questions), I will:

1. Create all database migration files
2. Implement all backend API endpoints
3. Add file upload and QR code functionality
4. Integrate frontend with new backend
5. Test end-to-end flow
6. Push everything to branch `claude/marketing-onboard-landing-019hphKK8hegnA53mxwuT2af`

**Estimated Implementation Time:** 8-10 days of focused development.

Please review and provide feedback!
