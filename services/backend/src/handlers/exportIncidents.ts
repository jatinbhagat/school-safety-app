import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /admin/export
 * Exports all incidents as a CSV file
 */
export async function exportIncidents(req: Request, res: Response) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        category,
        COALESCE((ai_meta->>'severity')::text, (ai_meta->>'risk_level')::text, 'N/A') as risk_level,
        created_at,
        status
      FROM incidents
      ORDER BY created_at DESC
    `);

    // Create CSV header
    const headers = ['id', 'category', 'risk_level', 'created_at', 'status'];
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
