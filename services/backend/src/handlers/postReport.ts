import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { validateInstitutionCategory } from './getInstitutionConfig';
// Import develop branch features if they exist
let validateDynamicFields: any, checkHasPII: any, getFieldDefinitions: any;
let encryptDynamicPIIFields: any, encryptPII: any;
let reporterNotificationService: any;

try {
  const reportingValidation = require('../utils/reportingValidation');
  validateDynamicFields = reportingValidation.validateDynamicFields;
  checkHasPII = reportingValidation.checkHasPII;
  getFieldDefinitions = reportingValidation.getFieldDefinitions;
} catch (error) {
  console.log('Advanced reporting validation not available');
}

try {
  const piiEncryption = require('../utils/piiEncryption');
  encryptDynamicPIIFields = piiEncryption.encryptDynamicPIIFields;
  encryptPII = piiEncryption.encryptPII;
} catch (error) {
  console.log('PII encryption not available');
  // Fallback implementation
  encryptPII = (value: string) => value; // No encryption in simplified mode
}

try {
  const notifications = require('../services/reporterNotifications');
  reporterNotificationService = notifications.reporterNotificationService;
} catch (error) {
  console.log('Reporter notification service not available');
}

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

    // DEVELOP BRANCH FEATURES: Extract reporter contact info and advanced validation
    let reporterEmail: string | null = null;
    let reporterPhone: string | null = null;
    let notificationPreference = 'both'; // default
    let hasPII = false;
    let fingerprint: string | null = null;

    if (finalDynamicFields) {
      // Enhanced validation if available
      if (validateDynamicFields && checkHasPII && getFieldDefinitions) {
        try {
          const fieldDefinitions = await getFieldDefinitions(finalInstitutionId);
          const validationResult = validateDynamicFields(finalDynamicFields, fieldDefinitions);
          
          if (!validationResult.valid) {
            res.status(400).json({
              error: 'Validation failed',
              message: validationResult.errors.join(', '),
              request_id: requestId,
            });
            return;
          }

          hasPII = checkHasPII(finalDynamicFields, fieldDefinitions);
          
          if (hasPII && encryptDynamicPIIFields) {
            finalDynamicFields = encryptDynamicPIIFields(finalDynamicFields, fieldDefinitions);
          }
        } catch (error) {
          console.warn('Advanced validation failed, proceeding with basic validation:', error);
        }
      }

      // Check for email field
      if (finalDynamicFields.contact_email && typeof finalDynamicFields.contact_email === 'string') {
        reporterEmail = encryptPII ? encryptPII(finalDynamicFields.contact_email) : finalDynamicFields.contact_email;
      }

      // Check for phone field
      if (finalDynamicFields.contact_phone && typeof finalDynamicFields.contact_phone === 'string') {
        reporterPhone = encryptPII ? encryptPII(finalDynamicFields.contact_phone) : finalDynamicFields.contact_phone;
      }

      // Determine preference
      if (reporterEmail && !reporterPhone) {
        notificationPreference = 'email';
      } else if (reporterPhone && !reporterEmail) {
        notificationPreference = 'sms';
      } else if (!reporterEmail && !reporterPhone) {
        notificationPreference = 'none';
      }
    }

    // Generate reporter fingerprint (for spam detection)
    if (!demo) {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
      const userAgent = (req.headers['user-agent'] as string) || 'unknown';
      fingerprint = crypto
        .createHash('sha256')
        .update(`${ipAddress}:${userAgent}`)
        .digest('hex');
    }

    // Insert incident into database - handle both enhanced and basic fields
    let query: string;
    let values: any[];

    // Check if enhanced features are available by testing database schema
    let hasEnhancedFields = false;
    try {
      const schemaCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'incidents' AND column_name IN (
          'has_pii', 'reporter_contact_email', 'reporter_contact_phone', 
          'reporter_notification_preference', 'reporter_fingerprint'
        )
      `);
      hasEnhancedFields = schemaCheck.rows.length > 0;
    } catch (error) {
      console.warn('Could not check database schema, using basic insert:', error);
    }

    if (hasEnhancedFields) {
      // Use enhanced insert with notification features
      query = `
        INSERT INTO incidents (
          category,
          description,
          class_section,
          attachments,
          status,
          tenant_id,
          school_id,
          dynamic_fields,
          has_pii,
          reporter_contact_email,
          reporter_contact_phone,
          reporter_notification_preference,
          reporter_fingerprint
        )
        VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, created_at
      `;

      values = [
        category.trim(),
        description?.trim() || null,
        class_section?.trim() || null,
        attachments ? JSON.stringify(attachments) : null,
        finalTenantId,
        finalInstitutionId,
        finalDynamicFields ? JSON.stringify(finalDynamicFields) : null,
        hasPII,
        reporterEmail,
        reporterPhone,
        notificationPreference,
        fingerprint,
      ];
    } else {
      // Use basic insert (main branch compatible)
      query = `
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

      values = [
        category.trim(),
        description?.trim() || null,
        class_section?.trim() || null,
        attachments ? JSON.stringify(attachments) : null,
        finalTenantId,
        finalInstitutionId,
        finalDynamicFields ? JSON.stringify(finalDynamicFields) : null,
      ];
    }

    const result = await pool.query(query, values);
    const incident = result.rows[0];

    // DEVELOP BRANCH FEATURES: Enhanced tracking and notifications
    if (hasEnhancedFields) {
      // Update or create reporter reputation if fingerprint tracking is enabled
      if (fingerprint && finalInstitutionId) {
        try {
          await pool.query(
            `INSERT INTO reporter_reputation (
              reporter_fingerprint,
              institution_id,
              total_reports,
              first_report_at,
              last_report_at
            )
            VALUES ($1, $2, 1, NOW(), NOW())
            ON CONFLICT (reporter_fingerprint, institution_id)
            DO UPDATE SET
              total_reports = reporter_reputation.total_reports + 1,
              last_report_at = NOW(),
              updated_at = NOW()`,
            [fingerprint, finalInstitutionId]
          );
        } catch (error) {
          console.warn('Failed to update reporter reputation:', error);
        }
      }

      // Send confirmation notification (async, don't wait)
      if ((reporterEmail || reporterPhone) && reporterNotificationService) {
        reporterNotificationService
          .sendNotification(incident.id, 'report_received')
          .catch((error: any) => console.error('Failed to send confirmation notification:', error));
      }
    }

    // Audit log: record submission
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
          hasEnhancedFields ? hasPII : false,
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
