import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { postReport } from './handlers/postReport';
import { getUploadUrl } from './handlers/getUploadUrl';
import { getIncidents } from './handlers/getIncidents';
import { assignIncident } from './handlers/assignIncident';
import { exportIncidents } from './handlers/exportIncidents';
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

// New SafelyNotify.com imports
import { jwtAuth, requireSuperAdmin } from './middleware/jwtAuth';
import { checkSlug, startOnboarding, completeOnboarding } from './handlers/onboarding';
import { verifyEmail, login, forgotPassword, resetPassword, getCurrentUser } from './handlers/auth';
import { uploadLogoHandler } from './handlers/uploadLogo';
import { generateQRCode, getQRCode } from './handlers/generateQR';
import { getInstitution, getInstitutionBySlug, updateInstitution, updateFeatures, getAdmins, addAdmin } from './handlers/institutions';
import { submitDemoRequest, getDemoRequests } from './handlers/demo';
import { getTenantReportingConfig, updateTenantReportingConfig, getFieldsCatalog, addFieldToCatalog } from './handlers/reportingConfig';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/auth/login', login);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.get('/api/auth/me', jwtAuth, getCurrentUser);

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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 School Safety Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Report endpoint: http://localhost:${PORT}/report`);
  console.log(`📋 Incidents list: http://localhost:${PORT}/incidents`);
  console.log(`✅ Assign incident: POST http://localhost:${PORT}/incidents/:id/assign`);
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
