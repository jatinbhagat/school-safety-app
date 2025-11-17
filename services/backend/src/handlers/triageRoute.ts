import { Request, Response } from 'express';
import { pool } from '../db';
import { hybridEngine, IncidentInput } from '../routing/rule_engine';
import { randomUUID } from 'crypto';

interface TriageRouteBody {
  incident_id: number;
  use_ml?: boolean; // Optional: force ML-based routing
}

/**
 * POST /triage/route
 *
 * Get routing recommendation for an incident
 * Returns recommended role, confidence, priority, and reasoning
 */
export async function triageRoute(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { incident_id, use_ml = false }: TriageRouteBody = req.body;

    // Validate required fields
    if (!incident_id || typeof incident_id !== 'number') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "incident_id" is required and must be a number',
        request_id: requestId,
      });
      return;
    }

    // Fetch incident from database
    const incidentQuery = `
      SELECT
        id,
        category,
        description,
        class_section,
        attachments,
        created_at,
        status,
        ai_meta
      FROM incidents
      WHERE id = $1
    `;

    const incidentResult = await pool.query(incidentQuery, [incident_id]);

    if (incidentResult.rows.length === 0) {
      res.status(404).json({
        error: 'Not found',
        message: `Incident with id ${incident_id} not found`,
        request_id: requestId,
      });
      return;
    }

    const incident = incidentResult.rows[0];

    // Prepare incident input for routing engine
    const incidentInput: IncidentInput = {
      id: incident.id,
      category: incident.category,
      description: incident.description,
      class_section: incident.class_section,
      attachments: incident.attachments,
      created_at: incident.created_at,
      severity: incident.ai_meta?.severity || undefined,
    };

    // Get routing recommendation
    const recommendation = await hybridEngine.route(incidentInput);

    // Log routing decision to routing_logs table
    const logQuery = `
      INSERT INTO routing_logs (
        incident_id,
        recommended_role,
        confidence,
        priority,
        routing_method,
        reasoning,
        incident_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at
    `;

    const logValues = [
      incident_id,
      recommendation.role,
      recommendation.confidence,
      recommendation.priority,
      use_ml ? 'ml_based' : 'hybrid',
      recommendation.reasoning,
      JSON.stringify(incidentInput),
    ];

    const logResult = await pool.query(logQuery, logValues);

    // Return recommendation
    res.status(200).json({
      incident_id,
      recommendation: {
        role: recommendation.role,
        confidence: recommendation.confidence,
        priority: recommendation.priority,
        reasoning: recommendation.reasoning,
        estimated_response_time: recommendation.estimated_response_time,
      },
      routing_log_id: logResult.rows[0].id,
      timestamp: logResult.rows[0].created_at,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error routing incident:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to route incident',
      request_id: requestId,
    });
  }
}
