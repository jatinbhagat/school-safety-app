# Fix Onboarding and Admin - Changes Summary

## Issues Fixed

### 1. Logo Upload & QR Code Generation - AWS S3 Removed ✅
**Problem:** Upload logo and QR code generation were failing due to invalid AWS credentials
**Solution:** Replaced AWS S3 with local file storage

**Changes:**
- Created `/services/backend/src/utils/localStorage.ts` - New local storage utility
- Modified `/services/backend/src/handlers/uploadLogo.ts` - Uses local storage instead of S3
- Modified `/services/backend/src/handlers/generateQR.ts` - Uses local storage instead of S3
- Updated `/services/backend/src/server.ts`:
  - Added static file serving for `/uploads` directory
  - Added storage initialization on startup
  - Serves uploaded files from local filesystem

**How it works:**
- Files are stored in `services/backend/uploads/` directory
- Logos: `uploads/logos/{institutionId}/logo-{timestamp}.png`
- QR codes: `uploads/qr-codes/{institutionId}/{type}-qr-{timestamp}.png`
- Files are served via HTTP at `http://localhost:3001/uploads/{path}`
- Automatic directory creation on startup
- Works with both local and Azure deployments

### 2. Reporting Config URL - Added Institution Identifier ✅
**Problem:** Reporting config page URL lacked institution identifier, using hardcoded 'demo' tenant
**Solution:** Added tenant_id linking and institution-specific configuration

**Changes:**
- Created `/services/backend/migrations/020_link_institutions_to_tenants.sql`:
  - Adds `tenant_id` UUID column to institutions table
  - Links institutions to tenant_reporting_config
  - Generates unique tenant configs for existing institutions
- Modified `/services/backend/src/handlers/institutions.ts`:
  - Returns `tenant_id` in institution details
  - Includes tenant_id in slug-based queries
- Modified `/services/pwa/app/admin/reporting-config/page.tsx`:
  - Fetches tenant_id from authenticated user's institution
  - Uses institution-specific tenant config instead of 'demo'
  - Removed manual tenant ID input field
  - Displays institution name and tenant ID in UI
  - Added authentication check with redirect to login

**Migration Required:**
```bash
cd services/backend
npm run migrate
```

This will:
- Add tenant_id column to institutions
- Create unique tenant configs for all existing institutions
- Link institutions to their tenant configurations

### 3. Kiosk Dynamic Categories ✅
**Problem:** Kiosk used hardcoded categories, didn't reflect reporting config changes
**Solution:** Kiosk now fetches and displays categories from institution's reporting config

**Changes:**
- Modified `/services/pwa/app/kiosk/[slug]/page.tsx`:
  - Fetches institution details by slug
  - Loads tenant reporting config dynamically
  - Displays institution name in header
  - Shows categories from config with default color palette
  - Handles loading and error states
  - Updates in real-time when reporting config changes

**Features:**
- Categories auto-update when admin changes reporting config
- Displays category descriptions on hover
- Shows loading state while fetching config
- Falls back to demo config if tenant_id not set
- 12-color default palette for categories

### 4. Category Management ✅
**Problem:** No validation for minimum categories
**Solution:** Added minimum 3 categories requirement

**Changes:**
- Modified `/services/pwa/app/admin/reporting-config/page.tsx`:
  - Prevents removing categories if count ≤ 3
  - Shows alert when trying to remove below minimum
  - Validates on save (blocks save if < 3 categories)
  - User-friendly error messages

**Validation:**
- Minimum: 3 categories required
- Maximum: Unlimited
- Remove button disabled when at minimum
- Save blocked if validation fails

### 5. Removed Categories Can Be Deleted ✅
**Problem:** Existing categories like "Bullying" couldn't be removed
**Solution:** All categories can now be removed (respecting 3 minimum)

**Changes:**
- Category removal works for all categories (default and custom)
- Validates minimum count before allowing removal
- Confirmation dialog before deletion
- Auto-selects next category after deletion

## Testing Checklist

Before deploying, test the following:

### Logo Upload
- [ ] Navigate to Admin → Settings → Branding & URL
- [ ] Upload a PNG/JPG logo (< 5MB)
- [ ] Verify logo displays correctly
- [ ] Check file saved to `services/backend/uploads/logos/{id}/`
- [ ] Verify logo URL starts with `http://localhost:3001/uploads/`

### QR Code Generation
- [ ] Navigate to Admin → Settings → Branding & URL
- [ ] Click "Generate QR Code"
- [ ] Verify QR downloads successfully
- [ ] Check file saved to `services/backend/uploads/qr-codes/{id}/`
- [ ] Verify QR scans to kiosk URL

### Reporting Config
- [ ] Navigate to Admin → Reporting Configuration
- [ ] Verify institution name displays correctly
- [ ] Verify tenant ID is shown (not 'demo')
- [ ] Add a new category
- [ ] Remove a category (should work if > 3 total)
- [ ] Try to remove when only 3 left (should be blocked)
- [ ] Save configuration
- [ ] Verify changes persist on page reload

### Kiosk
- [ ] Navigate to Kiosk page (e.g., `/kiosk/demo-school`)
- [ ] Verify institution name displays in header
- [ ] Verify categories match reporting config
- [ ] Change reporting config in admin
- [ ] Reload kiosk page
- [ ] Verify categories updated

## Deployment Steps

### 1. Run Database Migration
```bash
cd services/backend
npm run migrate
```

This will run migration `020_link_institutions_to_tenants.sql`

### 2. Verify Migration
```sql
-- Check tenant_id was added
SELECT id, institution_name, tenant_id FROM institutions LIMIT 5;

-- Check tenant configs were created
SELECT tenant_id, config->'categories' FROM tenant_reporting_config;
```

### 3. Start Backend
```bash
cd services/backend
npm run dev
```

Verify logs show:
- ✅ Storage initialized
- 📁 Uploads directory: /path/to/uploads

### 4. Start Frontend
```bash
cd services/pwa
npm run dev
```

### 5. Test Features
Follow the testing checklist above

## Files Changed

### Backend
- `src/utils/localStorage.ts` (NEW) - Local file storage utility
- `src/handlers/uploadLogo.ts` - Uses local storage
- `src/handlers/generateQR.ts` - Uses local storage
- `src/handlers/institutions.ts` - Returns tenant_id
- `src/server.ts` - Static file serving & storage init
- `migrations/020_link_institutions_to_tenants.sql` (NEW) - Tenant linking

### Frontend
- `app/admin/reporting-config/page.tsx` - Institution-specific config, min 3 validation
- `app/kiosk/[slug]/page.tsx` - Dynamic categories from config

## Breaking Changes

None - All changes are backward compatible:
- Existing S3 code removed but replaced with local storage
- tenant_id defaults to 'demo' if not set
- Migration creates tenant configs for existing institutions

## Notes

- The `uploads/` directory must be writable by the backend process
- For production on Azure, ensure the uploads directory is persistent (use Azure Blob Storage if needed)
- Logo images are automatically resized to 200x200px
- QR codes are generated at 512x512px by default
- All categories can be customized except minimum count requirement

## Support

If issues arise:
1. Check backend logs for storage initialization
2. Verify database migration ran successfully
3. Check `uploads/` directory permissions
4. Verify tenant_id is set for institutions
5. Test with demo tenant (ID: '00000000-0000-0000-0000-000000000001')
