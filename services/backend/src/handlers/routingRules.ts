import { Request, Response } from 'express';
import { pool } from '../db';

// Critical rules that cannot be deleted (safety-critical)
const CRITICAL_RULES = ['rule_001', 'rule_002', 'rule_004']; // Active Threat, Medical Emergency, Mental Health Crisis

/**
 * GET /api/institutions/:institutionId/routing-rules
 * Get all routing rules for an institution
 */
export async function getRoutingRules(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT
        id,
        rule_id,
        name,
        description,
        priority,
        is_active,
        condition_config,
        target_role,
        routing_priority,
        confidence,
        estimated_response_time,
        is_system_default,
        created_at,
        updated_at
       FROM routing_rules
       WHERE institution_id = $1
       ORDER BY priority DESC, name ASC`,
      [institutionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get routing rules error:', error);
    res.status(500).json({ error: 'Failed to get routing rules' });
  }
}

/**
 * GET /api/institutions/:institutionId/routing-rules/:ruleId
 * Get a specific routing rule
 */
export async function getRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);
    const ruleId = req.params.ruleId;

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT * FROM routing_rules
       WHERE institution_id = $1 AND rule_id = $2`,
      [institutionId, ruleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get routing rule error:', error);
    res.status(500).json({ error: 'Failed to get routing rule' });
  }
}

/**
 * POST /api/institutions/:institutionId/routing-rules
 * Create a new routing rule
 */
export async function createRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can create rules
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create routing rules' });
    }

    const {
      name,
      description,
      priority,
      keywords,
      severityThreshold,
      targetRole,
      routingPriority,
      confidence,
      estimatedResponseTime,
    } = req.body;

    // Validate required fields
    if (!name || !targetRole || !routingPriority || priority === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'targetRole', 'routingPriority', 'priority'],
      });
    }

    // Validate target role
    const validRoles = ['security', 'nurse', 'counselor', 'administrator', 'teacher', 'maintenance', 'staff'];
    if (!validRoles.includes(targetRole)) {
      return res.status(400).json({
        error: 'Invalid target role',
        validRoles,
      });
    }

    // Validate routing priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(routingPriority)) {
      return res.status(400).json({
        error: 'Invalid routing priority',
        validPriorities,
      });
    }

    // Build condition_config
    const conditionConfig: any = {};
    if (keywords && keywords.length > 0) {
      conditionConfig.keywords = keywords;
    }
    if (severityThreshold !== undefined && severityThreshold !== null) {
      conditionConfig.severity_threshold = severityThreshold;
    }

    // Generate unique rule_id
    const ruleIdPrefix = name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    const timestamp = Date.now().toString().slice(-6);
    const ruleId = `${ruleIdPrefix}_${timestamp}_inst_${institutionId}`;

    // Insert rule
    const result = await pool.query(
      `INSERT INTO routing_rules (
        rule_id,
        name,
        description,
        priority,
        is_active,
        condition_config,
        target_role,
        routing_priority,
        confidence,
        estimated_response_time,
        institution_id,
        is_system_default,
        created_by,
        updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        ruleId,
        name,
        description || null,
        priority,
        true, // is_active
        JSON.stringify(conditionConfig),
        targetRole,
        routingPriority,
        confidence || 0.80,
        estimatedResponseTime || null,
        institutionId,
        false, // is_system_default
        req.admin.email,
        req.admin.email,
      ]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'create_routing_rule', 'routing_rule', $3, $4)`,
      [institutionId, req.admin.adminId, result.rows[0].id, JSON.stringify(req.body)]
    );

    res.status(201).json({
      success: true,
      rule: result.rows[0],
    });
  } catch (error) {
    console.error('Create routing rule error:', error);
    res.status(500).json({ error: 'Failed to create routing rule' });
  }
}

/**
 * PATCH /api/institutions/:institutionId/routing-rules/:ruleId
 * Update a routing rule
 */
export async function updateRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);
    const ruleId = req.params.ruleId;

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can update rules
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can update routing rules' });
    }

    // Check if rule exists
    const existingRule = await pool.query(
      'SELECT * FROM routing_rules WHERE institution_id = $1 AND rule_id = $2',
      [institutionId, ruleId]
    );

    if (existingRule.rows.length === 0) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }

    const {
      name,
      description,
      priority,
      keywords,
      severityThreshold,
      targetRole,
      routingPriority,
      confidence,
      estimatedResponseTime,
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }

    if (keywords !== undefined || severityThreshold !== undefined) {
      const conditionConfig: any = {};
      if (keywords !== undefined && keywords.length > 0) {
        conditionConfig.keywords = keywords;
      }
      if (severityThreshold !== undefined && severityThreshold !== null) {
        conditionConfig.severity_threshold = severityThreshold;
      }
      updates.push(`condition_config = $${paramCount++}`);
      values.push(JSON.stringify(conditionConfig));
    }

    if (targetRole !== undefined) {
      const validRoles = ['security', 'nurse', 'counselor', 'administrator', 'teacher', 'maintenance', 'staff'];
      if (!validRoles.includes(targetRole)) {
        return res.status(400).json({ error: 'Invalid target role', validRoles });
      }
      updates.push(`target_role = $${paramCount++}`);
      values.push(targetRole);
    }

    if (routingPriority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(routingPriority)) {
        return res.status(400).json({ error: 'Invalid routing priority', validPriorities });
      }
      updates.push(`routing_priority = $${paramCount++}`);
      values.push(routingPriority);
    }

    if (confidence !== undefined) {
      updates.push(`confidence = $${paramCount++}`);
      values.push(confidence);
    }

    if (estimatedResponseTime !== undefined) {
      updates.push(`estimated_response_time = $${paramCount++}`);
      values.push(estimatedResponseTime);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(req.admin.email);

    values.push(institutionId);
    values.push(ruleId);

    const query = `
      UPDATE routing_rules
      SET ${updates.join(', ')}
      WHERE institution_id = $${paramCount++} AND rule_id = $${paramCount++}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'update_routing_rule', 'routing_rule', $3, $4)`,
      [institutionId, req.admin.adminId, result.rows[0].id, JSON.stringify(req.body)]
    );

    res.json({
      success: true,
      rule: result.rows[0],
    });
  } catch (error) {
    console.error('Update routing rule error:', error);
    res.status(500).json({ error: 'Failed to update routing rule' });
  }
}

/**
 * DELETE /api/institutions/:institutionId/routing-rules/:ruleId
 * Delete a routing rule (soft delete by marking inactive)
 */
export async function deleteRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);
    const ruleId = req.params.ruleId;

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can delete rules
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete routing rules' });
    }

    // Check if rule exists
    const existingRule = await pool.query(
      'SELECT * FROM routing_rules WHERE institution_id = $1 AND rule_id = $2',
      [institutionId, ruleId]
    );

    if (existingRule.rows.length === 0) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }

    // Check if this is a critical rule (based on original rule_id pattern)
    const baseRuleId = ruleId.split('_inst_')[0]; // Extract base rule_id
    if (CRITICAL_RULES.includes(baseRuleId)) {
      return res.status(403).json({
        error: 'Cannot delete critical safety rules',
        message: 'This rule is critical for safety and cannot be deleted. You can disable it instead.',
      });
    }

    // Soft delete by marking as inactive
    await pool.query(
      `UPDATE routing_rules
       SET is_active = false, updated_at = NOW(), updated_by = $1
       WHERE institution_id = $2 AND rule_id = $3`,
      [req.admin.email, institutionId, ruleId]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'delete_routing_rule', 'routing_rule', $3)`,
      [institutionId, req.admin.adminId, existingRule.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Routing rule deleted successfully',
    });
  } catch (error) {
    console.error('Delete routing rule error:', error);
    res.status(500).json({ error: 'Failed to delete routing rule' });
  }
}

/**
 * POST /api/institutions/:institutionId/routing-rules/:ruleId/toggle
 * Toggle rule active status
 */
export async function toggleRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);
    const ruleId = req.params.ruleId;

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if rule exists
    const existingRule = await pool.query(
      'SELECT * FROM routing_rules WHERE institution_id = $1 AND rule_id = $2',
      [institutionId, ruleId]
    );

    if (existingRule.rows.length === 0) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }

    const currentStatus = existingRule.rows[0].is_active;

    // Toggle the status
    const result = await pool.query(
      `UPDATE routing_rules
       SET is_active = $1, updated_at = NOW(), updated_by = $2
       WHERE institution_id = $3 AND rule_id = $4
       RETURNING *`,
      [!currentStatus, req.admin.email, institutionId, ruleId]
    );

    // Create audit log
    await pool.query(
      `INSERT INTO audit_logs (institution_id, admin_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'toggle_routing_rule', 'routing_rule', $3, $4)`,
      [institutionId, req.admin.adminId, result.rows[0].id, JSON.stringify({ is_active: !currentStatus })]
    );

    res.json({
      success: true,
      rule: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle routing rule error:', error);
    res.status(500).json({ error: 'Failed to toggle routing rule' });
  }
}

/**
 * POST /api/institutions/:institutionId/routing-rules/test
 * Test a rule or rule configuration against sample text
 */
export async function testRoutingRule(req: Request, res: Response) {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const institutionId = parseInt(req.params.institutionId);

    // Verify admin belongs to this institution
    if (req.admin.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { sampleText, keywords, severityThreshold } = req.body;

    if (!sampleText) {
      return res.status(400).json({ error: 'sampleText is required' });
    }

    const text = sampleText.toLowerCase();
    const matches: string[] = [];

    // Test keyword matching
    if (keywords && keywords.length > 0) {
      keywords.forEach((keyword: string) => {
        if (text.includes(keyword.toLowerCase())) {
          matches.push(keyword);
        }
      });
    }

    // Test severity threshold
    const severityMatch = severityThreshold !== undefined && severityThreshold !== null;

    res.json({
      success: true,
      matches: {
        keywordMatches: matches,
        keywordMatchCount: matches.length,
        severityThresholdDefined: severityMatch,
      },
      wouldMatch: matches.length > 0 || severityMatch,
    });
  } catch (error) {
    console.error('Test routing rule error:', error);
    res.status(500).json({ error: 'Failed to test routing rule' });
  }
}
