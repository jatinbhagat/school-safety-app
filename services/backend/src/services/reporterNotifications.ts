/**
 * Reporter Notification Service
 * Handles sending notifications to incident reporters
 */

import { pool } from '../db';
import { sendGridService } from '../utils/sendgrid';
import { twilioService } from '../utils/twilio';
import { decryptPII } from '../utils/piiEncryption';

interface NotificationContext {
  incidentId: number;
  incidentCategory: string;
  incidentStatus: string;
  createdAt: Date;
  trackingToken?: string;
}

type NotificationType =
  | 'report_received'
  | 'status_changed'
  | 'assigned_to_staff'
  | 'resolved'
  | 'closed'
  | 'flagged_as_false'
  | 'dispute_received';

export class ReporterNotificationService {
  /**
   * Send notification to reporter
   */
  async sendNotification(
    incidentId: number,
    notificationType: NotificationType,
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT
          id,
          category,
          status,
          created_at,
          reporter_contact_email,
          reporter_contact_phone,
          reporter_notification_preference,
          reporter_notification_token,
          reporter_notified_on_submit
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);

      if (incidentResult.rows.length === 0) {
        console.log(`Incident ${incidentId} not found`);
        return;
      }

      const incident = incidentResult.rows[0];

      // Skip if no contact info
      if (!incident.reporter_contact_email && !incident.reporter_contact_phone) {
        console.log(`No contact info for incident ${incidentId}`);
        return;
      }

      // Check notification preference
      const preference = incident.reporter_notification_preference || 'both';
      if (preference === 'none') {
        console.log(`Reporter opted out of notifications for incident ${incidentId}`);
        return;
      }

      // Generate tracking token if not exists
      let trackingToken = incident.reporter_notification_token;
      if (!trackingToken) {
        trackingToken = this.generateTrackingToken();
        await pool.query(
          'UPDATE incidents SET reporter_notification_token = $1 WHERE id = $2',
          [trackingToken, incidentId]
        );
      }

      // Get notification templates
      const context: NotificationContext = {
        incidentId: incident.id,
        incidentCategory: incident.category,
        incidentStatus: incident.status,
        createdAt: incident.created_at,
        trackingToken,
      };

      // Build tracking URL
      const baseUrl = process.env.FRONTEND_URL || 'https://safelynotify.com';
      const trackingUrl = `${baseUrl}/track/${trackingToken}`;

      // Prepare template variables
      const variables = {
        incident_id: incident.id.toString(),
        category: incident.category,
        submitted_at: new Date(incident.created_at).toLocaleString(),
        tracking_url: trackingUrl,
        new_status: incident.status.replace('_', ' ').toUpperCase(),
        status_description: this.getStatusDescription(incident.status),
        resolved_at: additionalData.resolved_at || new Date().toLocaleString(),
        flag_reason: additionalData.flag_reason || 'Review required',
        dispute_url: additionalData.dispute_url || trackingUrl,
        dispute_deadline: additionalData.dispute_deadline || this.getDisputeDeadline(),
        ...additionalData,
      };

      // Send via email if enabled
      if ((preference === 'email' || preference === 'both') && incident.reporter_contact_email) {
        await this.sendEmailNotification(
          incident.reporter_contact_email,
          notificationType,
          variables
        );
      }

      // Send via SMS if enabled
      if ((preference === 'sms' || preference === 'both') && incident.reporter_contact_phone) {
        await this.sendSMSNotification(
          incident.reporter_contact_phone,
          notificationType,
          variables
        );
      }

      // Update last notified timestamp
      await pool.query(
        'UPDATE incidents SET reporter_last_notified_at = NOW() WHERE id = $1',
        [incidentId]
      );
    } catch (error) {
      console.error('Error sending reporter notification:', error);
      // Don't throw - notifications are best-effort
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    encryptedEmail: string,
    notificationType: NotificationType,
    variables: Record<string, string>
  ): Promise<void> {
    try {
      // Decrypt email
      const email = decryptPII(encryptedEmail);

      // Get email template
      const templateQuery = `
        SELECT subject, body_template
        FROM notification_templates
        WHERE template_key = $1 AND channel = 'email' AND is_active = true
      `;

      const templateResult = await pool.query(templateQuery, [`${notificationType}_email`]);

      if (templateResult.rows.length === 0) {
        console.warn(`No email template found for ${notificationType}`);
        return;
      }

      const template = templateResult.rows[0];

      // Replace variables in template
      let subject = this.replaceVariables(template.subject || '', variables);
      let body = this.replaceVariables(template.body_template, variables);

      // Send email
      const result = await sendGridService.sendEmail({
        to: email,
        subject,
        text: body,
      });

      // Log notification
      await this.logNotification(
        parseInt(variables.incident_id),
        'email',
        notificationType,
        email,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      );
    } catch (error) {
      console.error('Error sending email notification:', error);
      await this.logNotification(
        parseInt(variables.incident_id),
        'email',
        notificationType,
        'unknown',
        'failed',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    encryptedPhone: string,
    notificationType: NotificationType,
    variables: Record<string, string>
  ): Promise<void> {
    try {
      // Decrypt phone
      const phone = decryptPII(encryptedPhone);

      // Get SMS template
      const templateQuery = `
        SELECT body_template
        FROM notification_templates
        WHERE template_key = $1 AND channel = 'sms' AND is_active = true
      `;

      const templateResult = await pool.query(templateQuery, [`${notificationType}_sms`]);

      if (templateResult.rows.length === 0) {
        console.warn(`No SMS template found for ${notificationType}`);
        return;
      }

      const template = templateResult.rows[0];

      // Replace variables in template
      let message = this.replaceVariables(template.body_template, variables);

      // Send SMS
      const result = await twilioService.sendSMS({
        to: phone,
        message,
      });

      // Log notification
      await this.logNotification(
        parseInt(variables.incident_id),
        'sms',
        notificationType,
        phone,
        result.success ? 'sent' : 'failed',
        result.messageId,
        result.error
      );
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      await this.logNotification(
        parseInt(variables.incident_id),
        'sms',
        notificationType,
        'unknown',
        'failed',
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Log notification to database
   */
  private async logNotification(
    incidentId: number,
    channel: string,
    notificationType: string,
    recipient: string,
    status: string,
    messageId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO reporter_notifications (
          incident_id,
          notification_type,
          channel,
          recipient_contact,
          status,
          provider_message_id,
          error_message,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          incidentId,
          notificationType,
          channel,
          recipient,
          status,
          messageId || null,
          errorMessage || null,
          status === 'sent' ? new Date() : null,
        ]
      );
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Generate tracking token
   */
  private generateTrackingToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Get status description for notifications
   */
  private getStatusDescription(status: string): string {
    switch (status) {
      case 'open':
        return 'Your report is open and awaiting review.';
      case 'in_progress':
        return 'Your report is being actively investigated by our team.';
      case 'resolved':
        return 'The issue has been addressed and resolved.';
      case 'closed':
        return 'This report has been closed.';
      default:
        return 'Your report status has been updated.';
    }
  }

  /**
   * Get dispute deadline (7 days from now)
   */
  private getDisputeDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return deadline.toLocaleDateString();
  }
}

// Export singleton instance
export const reporterNotificationService = new ReporterNotificationService();
export default reporterNotificationService;
