import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { validateInstitutionCategory } from './getInstitutionConfig';

interface AttachmentMetadata {
  key: string;
  filename: string;
  contentType: string;
  size?: number;
  uploadedAt: string;
}

interface PostReportBody {
  category?: string;
  description?: string;
  class_section?: string;
  attachments?: AttachmentMetadata[];
  // New fields for dynamic reporting
  tenant_id?: string;
  schoolSlug?: string;
  dynamic_fields?: Record<string, any>;
  // Demo mode flag
  demo?: boolean;
}

export async function postReport(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const {
      category,
      description,
      class_section,
      attachments,
      tenant_id,
      schoolSlug,
      dynamic_fields,
      demo,
    }: PostReportBody = req.body;

    // Validate required fields
    if (!category || typeof category !== 'string' || category.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "category" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    // Determine institution ID based on input
    let finalInstitutionId: number | null = null;
    let finalTenantId: string | null = null; // Keep for legacy audit trail
    
    if (demo || (!tenant_id && (!schoolSlug || schoolSlug === 'demo'))) {
      // Demo mode - use special demo handling
      finalTenantId = '00000000-0000-0000-0000-000000000001';
      finalInstitutionId = null; // Demo incidents don't belong to real institutions
    } else if (schoolSlug) {
      // Look up institution by slug (primary flow)
      const client = await pool.connect();
      try {
        const institutionQuery = `
          SELECT id, tenant_id, institution_name
          FROM institutions 
          WHERE url_slug = $1 AND is_active = true
        `;
        const institutionResult = await client.query(institutionQuery, [schoolSlug]);
        
        if (institutionResult.rows.length === 0) {
          res.status(404).json({
            error: 'Institution not found',
            message: `No active institution found with slug: ${schoolSlug}`,
            request_id: requestId,
          });
          return;
        }
        
        const institution = institutionResult.rows[0];
        finalInstitutionId = institution.id;
        finalTenantId = institution.tenant_id; // Keep for legacy compatibility
        
        console.log(`[Report] Mapped slug "${schoolSlug}" to institution ID ${finalInstitutionId} (${institution.institution_name})`);
      } finally {
        client.release();
      }
    } else if (tenant_id) {
      // Legacy: direct tenant_id provided (deprecated but supported)
      finalTenantId = tenant_id;
      // Note: finalInstitutionId remains null for legacy reports
    } else {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Either schoolSlug or tenant_id must be provided',
        request_id: requestId,
      });
      return;
    }

    // Validate attachments if provided (legacy support)
    if (attachments) {
      if (!Array.isArray(attachments)) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Field "attachments" must be an array',
          request_id: requestId,
        });
        return;
      }

      for (const attachment of attachments) {
        if (!attachment.key || typeof attachment.key !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "key" field',
            request_id: requestId,
          });
          return;
        }
        if (!attachment.filename || typeof attachment.filename !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "filename" field',
            request_id: requestId,
          });
          return;
        }
        if (!attachment.contentType || typeof attachment.contentType !== 'string') {
          res.status(400).json({
            error: 'Validation failed',
            message: 'Each attachment must have a valid "contentType" field',
            request_id: requestId,
          });
          return;
        }
      }
    }

    // CATEGORY VALIDATION (Simplified Institution-based System)
    if (finalInstitutionId) {
      // Validate category against institution configuration
      const validation = await validateInstitutionCategory(finalInstitutionId, category);
      
      if (!validation.valid) {
        res.status(400).json({
          error: 'Validation failed',
          message: validation.error || 'Invalid category for this institution',
          request_id: requestId,
        });
        return;
      }
      
      console.log(`[Report] Category "${category}" validated for institution ${finalInstitutionId}`);
    } else if (!demo) {
      // For legacy tenant-only reports, skip validation (deprecated flow)
      console.log(`[Report] Skipping category validation for legacy tenant ${finalTenantId}`);
    }

    // DYNAMIC FIELDS (Simplified - no PII encryption, just storage)
    let finalDynamicFields: Record<string, any> | null = null;
    if (dynamic_fields && Object.keys(dynamic_fields).length > 0) {
      finalDynamicFields = dynamic_fields;
    }

    // Insert incident into database
    const query = `
      INSERT INTO incidents (
        category,
        description,
        class_section,
        attachments,
        status,
        tenant_id,
        school_id,
        dynamic_fields
      )
      VALUES ($1, $2, $3, $4, 'open', $5, $6, $7)
      RETURNING id, created_at
    `;

    const values = [
      category.trim(),
      description?.trim() || null,
      class_section?.trim() || null,
      attachments ? JSON.stringify(attachments) : null,
      finalTenantId,
      finalInstitutionId,
      finalDynamicFields ? JSON.stringify(finalDynamicFields) : null,
    ];

    const result = await pool.query(query, values);
    const incident = result.rows[0];

    // Audit log: record submission (simplified)
    const ipHash = req.headers['x-forwarded-for']
      ? crypto.createHash('sha256').update(String(req.headers['x-forwarded-for'])).digest('hex')
      : null;

    const userAgentHash = req.headers['user-agent']
      ? crypto.createHash('sha256').update(String(req.headers['user-agent'])).digest('hex')
      : null;

    // Only create audit log if the table exists (backwards compatibility)
    try {
      await pool.query(
        `INSERT INTO report_audit_logs
         (incident_id, tenant_id, action, field_keys, has_pii_fields, ip_hash, user_agent_hash, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          incident.id,
          finalTenantId,
          'report_submitted',
          finalDynamicFields ? Object.keys(finalDynamicFields) : [],
          false, // No PII handling in simplified system
          ipHash,
          userAgentHash,
          JSON.stringify({
            category,
            request_id: requestId,
            institution_id: finalInstitutionId,
          }),
        ]
      );
    } catch (auditError) {
      // Audit logging failure shouldn't break report submission
      console.error('Audit logging failed (non-critical):', auditError);
    }

    res.status(201).json({
      id: incident.id,
      created_at: incident.created_at,
      request_id: requestId,
      fields_processed: finalDynamicFields ? Object.keys(finalDynamicFields).length : 0,
    });
  } catch (error) {
    console.error('Error creating incident report:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create incident report',
      request_id: requestId,
    });
  }
}
