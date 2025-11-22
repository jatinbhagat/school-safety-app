import { Request, Response } from 'express';
import { pool } from '../db';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { validateDynamicFields, checkHasPII, getFieldDefinitions } from '../utils/reportingValidation';
import { encryptDynamicPIIFields, encryptPII } from '../utils/piiEncryption';
import { reporterNotificationService } from '../services/reporterNotifications';

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

    // Determine tenant ID (use demo tenant if in demo mode or no tenant provided)
    // Map "demo" string to demo tenant UUID
    let finalTenantId: string;
    if (demo || !tenant_id || tenant_id === 'demo') {
      finalTenantId = '00000000-0000-0000-0000-000000000001'; // Demo tenant
    } else {
      finalTenantId = tenant_id;
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

    // DYNAMIC FIELDS SUPPORT
    let finalDynamicFields: Record<string, any> | null = null;
    let hasPII = false;
    let piiFieldKeys: string[] = [];

    if (dynamic_fields && Object.keys(dynamic_fields).length > 0) {
      // Validate dynamic fields against tenant config and category
      const validation = await validateDynamicFields(finalTenantId, category, dynamic_fields);

      if (!validation.valid) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'Dynamic fields validation failed',
          errors: validation.errors,
          request_id: requestId,
        });
        return;
      }

      // Check if submission contains PII
      hasPII = await checkHasPII(validation.sanitizedFields || {});

      // Encrypt PII fields if present
      if (hasPII) {
        const fieldDefinitions = await getFieldDefinitions();
        const encrypted = encryptDynamicPIIFields(
          validation.sanitizedFields || {},
          fieldDefinitions
        );
        finalDynamicFields = encrypted.encrypted;
        piiFieldKeys = encrypted.piiFieldKeys;
      } else {
        finalDynamicFields = validation.sanitizedFields || null;
      }
    }

    // Extract reporter contact info from dynamic fields
    let reporterEmail: string | null = null;
    let reporterPhone: string | null = null;
    let notificationPreference = 'both'; // default

    if (finalDynamicFields) {
      // Check for email field
      if (finalDynamicFields.contact_email && typeof finalDynamicFields.contact_email === 'string') {
        reporterEmail = encryptPII(finalDynamicFields.contact_email);
      }

      // Check for phone field
      if (finalDynamicFields.contact_phone && typeof finalDynamicFields.contact_phone === 'string') {
        reporterPhone = encryptPII(finalDynamicFields.contact_phone);
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
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex');

    // Insert incident into database
    const query = `
      INSERT INTO incidents (
        category,
        description,
        class_section,
        attachments,
        status,
        tenant_id,
        dynamic_fields,
        has_pii,
        reporter_contact_email,
        reporter_contact_phone,
        reporter_notification_preference,
        reporter_fingerprint
      )
      VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, created_at
    `;

    const values = [
      category.trim(),
      description?.trim() || null,
      class_section?.trim() || null,
      attachments ? JSON.stringify(attachments) : null,
      finalTenantId,
      finalDynamicFields ? JSON.stringify(finalDynamicFields) : null,
      hasPII,
      reporterEmail,
      reporterPhone,
      notificationPreference,
      fingerprint,
    ];

    const result = await pool.query(query, values);
    const incident = result.rows[0];

    // Update or create reporter reputation
    if (fingerprint) {
      await pool.query(
        `INSERT INTO reporter_reputation (
          reporter_fingerprint,
          institution_id,
          total_reports,
          first_report_at,
          last_report_at
        )
        VALUES ($1, (SELECT id FROM institutions WHERE uuid = $2 LIMIT 1), 1, NOW(), NOW())
        ON CONFLICT (reporter_fingerprint, institution_id)
        DO UPDATE SET
          total_reports = reporter_reputation.total_reports + 1,
          last_report_at = NOW(),
          updated_at = NOW()`,
        [fingerprint, finalTenantId]
      );
    }

    // Send confirmation notification (async, don't wait)
    if (reporterEmail || reporterPhone) {
      reporterNotificationService
        .sendNotification(incident.id, 'report_received')
        .catch((error) => console.error('Failed to send confirmation notification:', error));
    }

    // Audit log: record submission with field keys (not values)
    const ipHash = req.headers['x-forwarded-for']
      ? crypto.createHash('sha256').update(String(req.headers['x-forwarded-for'])).digest('hex')
      : null;

    const userAgentHash = req.headers['user-agent']
      ? crypto.createHash('sha256').update(String(req.headers['user-agent'])).digest('hex')
      : null;

    await pool.query(
      `INSERT INTO report_audit_logs
       (incident_id, tenant_id, action, field_keys, has_pii_fields, ip_hash, user_agent_hash, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        incident.id,
        finalTenantId,
        'report_submitted',
        finalDynamicFields ? Object.keys(finalDynamicFields) : [],
        hasPII,
        ipHash,
        userAgentHash,
        JSON.stringify({
          category,
          request_id: requestId,
          pii_field_count: piiFieldKeys.length,
        }),
      ]
    );

    res.status(201).json({
      id: incident.id,
      created_at: incident.created_at,
      request_id: requestId,
      has_pii: hasPII,
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
