import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { postReport } from './handlers/postReport';
import { getUploadUrl } from './handlers/getUploadUrl';
import { getIncidents } from './handlers/getIncidents';
import { assignIncident } from './handlers/assignIncident';
import { exportIncidents } from './handlers/exportIncidents';
import { pool } from './db';
import { adminAuth } from './middleware/adminAuth';
import { staffAuth } from './middleware/staffAuth';

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

// Admin endpoints (protected by admin token)
app.get('/admin/export', adminAuth, exportIncidents);

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
