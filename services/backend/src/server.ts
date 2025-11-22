import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import * as dotenv from 'dotenv';
import { postReport } from './handlers/postReport';
import { getUploadUrl } from './handlers/getUploadUrl';
import { getIncidents, getAdminIncidents } from './handlers/getIncidents';
import { assignIncident } from './handlers/assignIncident';
import { exportIncidents, exportAdminIncidents } from './handlers/exportIncidents';
import { getHeatmap } from './handlers/getHeatmap';
import { getSafetyScore } from './handlers/getSafetyScore';
import { triageRoute } from './handlers/triageRoute';
import { triageRouteAssign } from './handlers/triageRouteAssign';
import { generateMicroGuide } from './handlers/generateMicroGuide';
import { getMicroGuides } from './handlers/getMicroGuides';
import { updateMicroGuide } from './handlers/updateMicroGuide';
import { getIncidentDetail } from './handlers/getIncidentDetail';
import { addStaffNote } from './handlers/addStaffNote';
import { resolveIncident } from './handlers/resolveIncident';
import { acceptIncident } from './handlers/acceptIncident';
import { getStaffStats } from './handlers/getStaffStats';
import { pool } from './db';
import { adminAuth } from './middleware/adminAuth';
import { staffAuth } from './middleware/staffAuth';
import { initializeStorage } from './utils/localStorage';

// New SafelyNotify.com imports
import { jwtAuth, requireSuperAdmin } from './middleware/jwtAuth';
import { checkSlug, startOnboarding, completeOnboarding } from './handlers/onboarding';
import { verifyEmail, checkEmail, login, forgotPassword, resetPassword, getCurrentUser, updateProfile } from './handlers/auth';
import { uploadLogoHandler } from './handlers/uploadLogo';
import { generateQRCode, getQRCode } from './handlers/generateQR';
import { getInstitution, getInstitutionBySlug, updateInstitution, updateFeatures, getAdmins, addAdmin } from './handlers/institutions';
import { submitDemoRequest, getDemoRequests } from './handlers/demo';
import { getTenantReportingConfig, updateTenantReportingConfig, getFieldsCatalog, addFieldToCatalog } from './handlers/reportingConfig';
import { getRoutingRules, getRoutingRule, createRoutingRule, updateRoutingRule, deleteRoutingRule, toggleRoutingRule, testRoutingRule } from './handlers/routingRules';

// Phase 2 - New incident management and false reporting imports
import { getAdminIncidentDetail } from './handlers/getAdminIncidentDetail';
import { updateIncidentStatus } from './handlers/updateIncidentStatus';
import { flagFalseReport } from './handlers/flagFalseReport';
import { confirmFalseReport } from './handlers/confirmFalseReport';
import { restoreFalseReport } from './handlers/restoreFalseReport';
import { getReporterHistory } from './handlers/getReporterHistory';
import { blockReporter, unblockReporter } from './handlers/blockReporter';

// Phase 4 - Anonymous tracking portal
import { getTrackingData } from './handlers/getTrackingData';
import { submitDispute } from './handlers/submitDispute';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'school-safety-backend',
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'school-safety-backend',
      database: 'disconnected',
    });
  }
});

// Report submission endpoint
app.post('/report', postReport);

// Upload URL generation endpoint
app.post('/upload-url', getUploadUrl);

// Staff app endpoints (protected by staff token)
app.get('/incidents', staffAuth, getIncidents);
app.post('/incidents/:id/assign', staffAuth, assignIncident);

// Staff incident management endpoints (protected by staff token)
app.get('/staff/incidents/:id', staffAuth, getIncidentDetail);
app.post('/staff/incidents/:id/accept', staffAuth, acceptIncident);
app.post('/staff/incidents/:id/notes', staffAuth, addStaffNote);
app.post('/staff/incidents/:id/resolve', staffAuth, resolveIncident);
app.get('/staff/stats', staffAuth, getStaffStats);

// Admin endpoints (protected by admin token)
// SECURE: Admin incidents endpoint with proper JWT authentication and tenant isolation
app.get('/api/admin/incidents', jwtAuth, getAdminIncidents);
app.get('/api/admin/export', jwtAuth, exportAdminIncidents);

// Phase 2 - Enhanced incident management endpoints (JWT authenticated)
app.get('/api/admin/incidents/:id', jwtAuth, getAdminIncidentDetail);
app.put('/api/admin/incidents/:id/status', jwtAuth, updateIncidentStatus);

// False reporting endpoints (admin and super_admin only)
app.post('/api/admin/incidents/:id/flag-false', jwtAuth, flagFalseReport);
app.post('/api/admin/incidents/:id/confirm-false', jwtAuth, confirmFalseReport); // Super admin only
app.post('/api/admin/incidents/:id/restore', jwtAuth, restoreFalseReport); // Super admin only

// Reporter management endpoints (admin and super_admin only)
app.get('/api/admin/reporter-history/:fingerprint', jwtAuth, getReporterHistory);
app.post('/api/admin/block-reporter', jwtAuth, blockReporter);
app.post('/api/admin/unblock-reporter', jwtAuth, unblockReporter);

// Anonymous tracking portal (public - no authentication)
app.get('/api/track/:token', getTrackingData);
app.post('/api/dispute/:token', submitDispute);

// DEPRECATED: Legacy admin endpoints - INSECURE! Return ALL incidents from ALL institutions
app.get('/admin/incidents', adminAuth, getIncidents);
app.get('/admin/export', adminAuth, exportIncidents);
app.get('/admin/safety-score', adminAuth, getSafetyScore);

// Analytics endpoints (protected by staff token)
app.get('/analytics/heatmap', staffAuth, getHeatmap);

// Triage/routing endpoints (protected by staff token)
app.post('/triage/route', staffAuth, triageRoute);
app.post('/triage/route/assign', staffAuth, triageRouteAssign);

// Micro-guides endpoints
app.post('/micro-guides/generate', adminAuth, generateMicroGuide);
app.get('/micro-guides', getMicroGuides);
app.patch('/micro-guides/:id', adminAuth, updateMicroGuide);

// ==========================================
// SafelyNotify.com - New Marketing & Onboarding Endpoints
// ==========================================

// Onboarding endpoints (public)
app.post('/api/onboarding/check-slug', checkSlug);
app.post('/api/onboarding/start', startOnboarding);
app.post('/api/onboarding/complete', completeOnboarding);

// Authentication endpoints (public)
app.post('/api/auth/verify-email', verifyEmail);
app.post('/api/auth/check-email', checkEmail);
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.get('/api/auth/me', jwtAuth, getCurrentUser);
app.patch('/api/auth/profile', jwtAuth, updateProfile);

// Demo booking endpoints
app.post('/api/demo/request', submitDemoRequest);
app.get('/api/demo/requests', getDemoRequests); // TODO: Add admin auth

// Institution endpoints
app.get('/api/institutions/by-slug/:slug', getInstitutionBySlug); // Public for frontend routing
app.get('/api/institutions/:id', jwtAuth, getInstitution);
app.patch('/api/institutions/:id', jwtAuth, updateInstitution);
app.patch('/api/institutions/:id/features', jwtAuth, updateFeatures);
app.get('/api/institutions/:id/admins', jwtAuth, getAdmins);
app.post('/api/institutions/:id/admins', jwtAuth, addAdmin);

// Routing rules endpoints (authenticated)
app.get('/api/institutions/:institutionId/routing-rules', jwtAuth, getRoutingRules);
app.get('/api/institutions/:institutionId/routing-rules/:ruleId', jwtAuth, getRoutingRule);
app.post('/api/institutions/:institutionId/routing-rules', jwtAuth, createRoutingRule);
app.patch('/api/institutions/:institutionId/routing-rules/:ruleId', jwtAuth, updateRoutingRule);
app.delete('/api/institutions/:institutionId/routing-rules/:ruleId', jwtAuth, deleteRoutingRule);
app.post('/api/institutions/:institutionId/routing-rules/:ruleId/toggle', jwtAuth, toggleRoutingRule);
app.post('/api/institutions/:institutionId/routing-rules/test', jwtAuth, testRoutingRule);

// File upload endpoints (authenticated)
app.post('/api/institutions/:id/logo', jwtAuth, ...uploadLogoHandler);

// QR code endpoints (authenticated)
app.post('/api/institutions/:id/qr-code', jwtAuth, generateQRCode);
app.get('/api/institutions/:id/qr-code', jwtAuth, getQRCode);

// ==========================================
// Reporting Configuration Endpoints
// ==========================================

// Get tenant reporting config (public for kiosk)
app.get('/api/tenant/:tenantId/reporting-config', getTenantReportingConfig);

// Update tenant reporting config (admin only - TODO: add auth middleware)
app.post('/api/tenant/:tenantId/reporting-config', jwtAuth, updateTenantReportingConfig);

// Get fields catalog (public)
app.get('/api/reporting/fields/catalog', getFieldsCatalog);

// Add field to catalog (admin only)
app.post('/api/reporting/fields/catalog', jwtAuth, addFieldToCatalog);

// Temporary migration endpoint (remove after deployment)
app.get('/admin/run-migrations', async (_req: Request, res: Response) => {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get list of migration files
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${files.length} migration files`);

    let executed = 0;
    let skipped = 0;
    const results = [];

    for (const file of files) {
      try {
        // Check if migration already executed
        const existingResult = await pool.query(
          'SELECT filename FROM migrations WHERE filename = $1',
          [file]
        );

        if (existingResult.rows.length > 0) {
          console.log(`⏭️  Skipping ${file} (already executed)`);
          skipped++;
          results.push(`⏭️  Skipped: ${file} (already executed)`);
          continue;
        }

        // Read and execute migration
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`🔄 Executing migration: ${file}`);
        
        // Execute the migration in a transaction
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        
        console.log(`✅ Successfully executed: ${file}`);
        executed++;
        results.push(`✅ Executed: ${file}`);
        
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`❌ Migration failed: ${file}`, error);
        
        res.status(500).json({
          status: 'error',
          message: `Migration failed at ${file}`,
          error: error instanceof Error ? error.message : String(error),
          results: results
        });
        return;
      }
    }

    const summary = `✅ Migrations completed! Executed: ${executed}, Skipped: ${skipped}`;
    console.log(summary);
    
    res.json({
      status: 'success',
      message: summary,
      details: {
        executed: executed,
        skipped: skipped,
        total: files.length
      },
      results: results
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run migrations',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Initialize storage on startup
initializeStorage().then(() => {
  console.log('✅ Storage initialized');
}).catch(err => {
  console.error('❌ Failed to initialize storage:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 School Safety Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Report endpoint: http://localhost:${PORT}/report`);
  console.log(`📋 Incidents list: http://localhost:${PORT}/incidents`);
  console.log(`✅ Assign incident: POST http://localhost:${PORT}/incidents/:id/assign`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  await pool.end();
  process.exit(0);
});
