import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';

interface TriageRouteAssignBody {
  incident_id: number;
  role: string; // Role to assign to (e.g., 'security', 'counselor', 'staff')
  assigned_by?: string; // Optional: identifier of user making assignment
  routing_log_id?: number; // Optional: reference to routing_logs entry
}

/**
 * POST /triage/route/assign
 *
 * Assign an incident to a specific role based on routing recommendation
 * Updates incident status and ai_meta, and logs the assignment
 */
export async function triageRouteAssign(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { incident_id, role, assigned_by, routing_log_id }: TriageRouteAssignBody = req.body;

    // Validate required fields
    if (!incident_id || typeof incident_id !== 'number') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "incident_id" is required and must be a number',
        request_id: requestId,
      });
      return;
    }

    if (!role || typeof role !== 'string' || role.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "role" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    // Validate role is one of the expected values
    const validRoles = ['security', 'nurse', 'counselor', 'administrator', 'teacher', 'maintenance', 'staff'];
    if (!validRoles.includes(role.toLowerCase())) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        request_id: requestId,
      });
      return;
    }

    // Fetch incident to ensure it exists
    const fetchQuery = `
      SELECT id, status, ai_meta
      FROM incidents
      WHERE id = $1
    `;

    const fetchResult = await pool.query(fetchQuery, [incident_id]);

    if (fetchResult.rows.length === 0) {
      res.status(404).json({
        error: 'Not found',
        message: `Incident with id ${incident_id} not found`,
        request_id: requestId,
      });
      return;
    }

    const incident = fetchResult.rows[0];

    // Update incident with assignment
    const assignedAt = new Date().toISOString();
    const updatedAiMeta = {
      ...(incident.ai_meta || {}),
      assigned_to: role,
      assigned_at: assignedAt,
      assigned_by: assigned_by || 'system',
    };

    const updateQuery = `
      UPDATE incidents
      SET
        status = CASE
          WHEN status = 'open' THEN 'in_progress'
          ELSE status
        END,
        ai_meta = $2
      WHERE id = $1
      RETURNING id, status, ai_meta, category, description, class_section, created_at
    `;

    const updateResult = await pool.query(updateQuery, [incident_id, updatedAiMeta]);
    const updatedIncident = updateResult.rows[0];

    // Update routing_logs if routing_log_id provided
    if (routing_log_id) {
      const logUpdateQuery = `
        UPDATE routing_logs
        SET
          actual_assigned_role = $2,
          assigned_at = $3,
          assigned_by = $4
        WHERE id = $1
      `;

      await pool.query(logUpdateQuery, [
        routing_log_id,
        role,
        assignedAt,
        assigned_by || 'system',
      ]);
    }

    // Return success response
    res.status(200).json({
      incident_id,
      assignment: {
        role,
        assigned_at: assignedAt,
        assigned_by: assigned_by || 'system',
      },
      incident: {
        id: updatedIncident.id,
        status: updatedIncident.status,
        category: updatedIncident.category,
        description: updatedIncident.description,
        class_section: updatedIncident.class_section,
        created_at: updatedIncident.created_at,
        ai_meta: updatedIncident.ai_meta,
      },
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error assigning incident:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to assign incident',
      request_id: requestId,
    });
  }
}
