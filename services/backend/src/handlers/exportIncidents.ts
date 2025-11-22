import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /admin/export
 * Exports all incidents as a CSV file (LEGACY - INSECURE)
 */
export async function exportIncidents(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        category,
        COALESCE((ai_meta->>'severity')::text, (ai_meta->>'risk_level')::text, 'N/A') as risk_level,
        created_at,
        status,
        school_id
      FROM incidents
      ORDER BY created_at DESC
    `);

    // Create CSV header
    const headers = ['id', 'category', 'risk_level', 'created_at', 'status', 'school_id'];
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const row of result.rows) {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        // Convert to string and escape quotes
        const stringValue = String(value).replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="incidents-export-${new Date().toISOString().split('T')[0]}.csv"`);

    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting incidents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export incidents',
    });
  }
}

/**
 * GET /api/admin/export
 * Exports incidents for authenticated admin's institution only (SECURE)
 */
export async function exportAdminIncidents(req: Request, res: Response) {
  try {
    // Verify admin authentication
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = req.admin.institutionId;

    if (!institutionId) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin not associated with any institution' 
      });
    }

    // Query incidents only for the admin's institution
    const result = await pool.query(`
      SELECT
        i.id,
        i.category,
        COALESCE((i.ai_meta->>'severity')::text, (i.ai_meta->>'risk_level')::text, 'N/A') as risk_level,
        i.created_at,
        i.status,
        i.description,
        i.class_section as location,
        inst.institution_name
      FROM incidents i
      INNER JOIN institutions inst ON i.school_id = inst.id
      WHERE i.school_id = $1
      ORDER BY i.created_at DESC
    `, [institutionId]);

    // Get institution name for filename
    const institutionName = result.rows[0]?.institution_name || 'institution';
    const sanitizedName = institutionName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    // Create CSV header
    const headers = ['id', 'category', 'risk_level', 'created_at', 'status', 'description', 'location'];
    const csvRows = [headers.join(',')];

    // Add data rows
    for (const row of result.rows) {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle null/undefined values
        if (value === null || value === undefined) {
          return '';
        }
        // Convert to string and escape quotes
        const stringValue = String(value).replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    // Log the export for audit purposes
    console.log(`[Audit] Admin ${req.admin.adminId} (${req.admin.email}) exported ${result.rows.length} incidents for institution ${institutionId}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="incidents-export-${sanitizedName}-${new Date().toISOString().split('T')[0]}.csv"`);

    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting admin incidents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to export incidents',
    });
  }
}
