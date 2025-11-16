import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * GET /analytics/heatmap
 * Returns aggregated incident data for heatmap visualization
 *
 * Query Parameters:
 * - start_date: Start date for aggregates (YYYY-MM-DD format, default: 30 days ago)
 * - end_date: End date for aggregates (YYYY-MM-DD format, default: today)
 * - class_section: Optional filter by class/section
 * - category: Optional filter by incident category
 */
export async function getHeatmap(req: Request, res: Response) {
  try {
    const {
      start_date,
      end_date,
      class_section,
      category,
    } = req.query;

    // Build dynamic WHERE clause based on filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Date range filtering
    if (start_date) {
      conditions.push(`date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    } else {
      // Default to last 30 days
      conditions.push(`date >= CURRENT_DATE - INTERVAL '30 days'`);
    }

    if (end_date) {
      conditions.push(`date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    } else {
      // Default to today
      conditions.push(`date <= CURRENT_DATE`);
    }

    // Optional filters
    if (class_section) {
      conditions.push(`class_section = $${paramIndex}`);
      params.push(class_section);
      paramIndex++;
    }

    if (category) {
      conditions.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Query aggregated data
    const query = `
      SELECT
        id,
        date,
        class_section,
        category,
        x_coord,
        y_coord,
        incident_count,
        recurrence_count,
        severity_avg,
        status_breakdown,
        last_computed_at
      FROM analytics.incident_aggregates
      ${whereClause}
      ORDER BY date DESC, incident_count DESC
    `;

    const result = await pool.query(query, params);

    // Transform data for frontend consumption
    const heatmapData = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      location: {
        class_section: row.class_section,
        x: parseFloat(row.x_coord),
        y: parseFloat(row.y_coord),
      },
      category: row.category,
      metrics: {
        incident_count: row.incident_count,
        recurrence_count: row.recurrence_count,
        severity_avg: row.severity_avg ? parseFloat(row.severity_avg) : null,
      },
      status_breakdown: row.status_breakdown,
      last_computed_at: row.last_computed_at,
    }));

    // Calculate summary statistics
    const totalIncidents = heatmapData.reduce(
      (sum, item) => sum + item.metrics.incident_count,
      0
    );

    const totalRecurrences = heatmapData.reduce(
      (sum, item) => sum + item.metrics.recurrence_count,
      0
    );

    const avgSeverity = heatmapData.length > 0
      ? heatmapData
          .filter(item => item.metrics.severity_avg !== null)
          .reduce((sum, item) => sum + (item.metrics.severity_avg || 0), 0) /
        heatmapData.filter(item => item.metrics.severity_avg !== null).length
      : null;

    res.status(200).json({
      summary: {
        total_aggregates: heatmapData.length,
        total_incidents: totalIncidents,
        total_recurrences: totalRecurrences,
        average_severity: avgSeverity ? parseFloat(avgSeverity.toFixed(2)) : null,
        date_range: {
          start: start_date || 'Last 30 days',
          end: end_date || 'Today',
        },
      },
      data: heatmapData,
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch heatmap analytics',
    });
  }
}
