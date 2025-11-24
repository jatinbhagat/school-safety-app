import { pool } from '../db';
import { firebaseService } from '../utils/firebase';

/**
 * Admin Push Notification Service
 * Sends push notifications to admins/staff for incident-related events
 */

interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

class AdminPushNotificationService {
  /**
   * Send notification when incident is assigned to an admin
   */
  async notifyIncidentAssigned(incidentId: number, assignedAdminId: number): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT id, category, status, created_at
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);
      if (incidentResult.rows.length === 0) {
        console.warn(`Incident ${incidentId} not found`);
        return;
      }

      const incident = incidentResult.rows[0];

      // Get admin's push tokens
      const tokens = await this.getAdminPushTokens(assignedAdminId, 'incident_assigned');

      if (tokens.length === 0) {
        console.log(`No push tokens found for admin ${assignedAdminId}`);
        return;
      }

      const payload: NotificationPayload = {
        title: 'New Incident Assigned',
        body: `You have been assigned to: ${incident.category}`,
        data: {
          type: 'incident_assigned',
          incident_id: incidentId.toString(),
          category: incident.category,
          status: incident.status,
        },
      };

      await this.sendToMultipleTokens(tokens, payload);
      await this.logNotification(assignedAdminId, 'incident_assigned', incidentId, payload);
    } catch (error) {
      console.error('Error sending incident assigned notification:', error);
    }
  }

  /**
   * Send notification when incident status changes
   */
  async notifyStatusChanged(
    incidentId: number,
    oldStatus: string,
    newStatus: string,
    assignedAdminId?: number
  ): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT id, category
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);
      if (incidentResult.rows.length === 0) {
        return;
      }

      const incident = incidentResult.rows[0];

      // If assigned to specific admin, notify them
      if (assignedAdminId) {
        const tokens = await this.getAdminPushTokens(assignedAdminId, 'incident_status_changed');

        if (tokens.length > 0) {
          const payload: NotificationPayload = {
            title: 'Incident Status Updated',
            body: `${incident.category} status changed to ${newStatus}`,
            data: {
              type: 'status_changed',
              incident_id: incidentId.toString(),
              old_status: oldStatus,
              new_status: newStatus,
            },
          };

          await this.sendToMultipleTokens(tokens, payload);
          await this.logNotification(assignedAdminId, 'incident_status_changed', incidentId, payload);
        }
      }
    } catch (error) {
      console.error('Error sending status changed notification:', error);
    }
  }

  /**
   * Send notification for new high-priority incident
   */
  async notifyHighPriorityIncident(incidentId: number, institutionId: number): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT id, category, ai_meta
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);
      if (incidentResult.rows.length === 0) {
        return;
      }

      const incident = incidentResult.rows[0];
      const severity = incident.ai_meta?.severity || 'unknown';

      // Get all admins/super_admins in the institution
      const adminsQuery = `
        SELECT id FROM institution_admins
        WHERE institution_id = $1
        AND is_active = true
        AND role IN ('admin', 'super_admin')
      `;

      const adminsResult = await pool.query(adminsQuery, [institutionId]);

      for (const admin of adminsResult.rows) {
        const tokens = await this.getAdminPushTokens(admin.id, 'high_priority_incident');

        if (tokens.length > 0) {
          const payload: NotificationPayload = {
            title: '🚨 High Priority Incident',
            body: `New ${severity} severity incident: ${incident.category}`,
            data: {
              type: 'high_priority_incident',
              incident_id: incidentId.toString(),
              category: incident.category,
              severity,
            },
          };

          await this.sendToMultipleTokens(tokens, payload);
          await this.logNotification(admin.id, 'high_priority_incident', incidentId, payload);
        }
      }
    } catch (error) {
      console.error('Error sending high priority notification:', error);
    }
  }

  /**
   * Send notification when new incident is created
   */
  async notifyNewIncident(incidentId: number, institutionId: number): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT id, category, status
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);
      if (incidentResult.rows.length === 0) {
        return;
      }

      const incident = incidentResult.rows[0];

      // Get all admins in the institution who want new incident notifications
      const adminsQuery = `
        SELECT DISTINCT ia.id
        FROM institution_admins ia
        LEFT JOIN notification_preferences np ON ia.id = np.admin_id
          AND np.notification_type = 'new_incident_created'
        WHERE ia.institution_id = $1
        AND ia.is_active = true
        AND (np.enabled IS NULL OR np.enabled = true)
      `;

      const adminsResult = await pool.query(adminsQuery, [institutionId]);

      for (const admin of adminsResult.rows) {
        const tokens = await this.getAdminPushTokens(admin.id, 'new_incident_created');

        if (tokens.length > 0) {
          const payload: NotificationPayload = {
            title: 'New Incident Reported',
            body: `${incident.category} - Status: ${incident.status}`,
            data: {
              type: 'new_incident_created',
              incident_id: incidentId.toString(),
              category: incident.category,
              status: incident.status,
            },
          };

          await this.sendToMultipleTokens(tokens, payload);
          await this.logNotification(admin.id, 'new_incident_created', incidentId, payload);
        }
      }
    } catch (error) {
      console.error('Error sending new incident notification:', error);
    }
  }

  /**
   * Send notification when dispute is submitted
   */
  async notifyDisputeSubmitted(incidentId: number, disputeId: number, institutionId: number): Promise<void> {
    try {
      // Get incident details
      const incidentQuery = `
        SELECT id, category
        FROM incidents
        WHERE id = $1
      `;

      const incidentResult = await pool.query(incidentQuery, [incidentId]);
      if (incidentResult.rows.length === 0) {
        return;
      }

      const incident = incidentResult.rows[0];

      // Notify super admins only
      const adminsQuery = `
        SELECT id FROM institution_admins
        WHERE institution_id = $1
        AND is_active = true
        AND role = 'super_admin'
      `;

      const adminsResult = await pool.query(adminsQuery, [institutionId]);

      for (const admin of adminsResult.rows) {
        const tokens = await this.getAdminPushTokens(admin.id, 'dispute_submitted');

        if (tokens.length > 0) {
          const payload: NotificationPayload = {
            title: 'New Dispute Submitted',
            body: `Reporter disputed false report flag for: ${incident.category}`,
            data: {
              type: 'dispute_submitted',
              incident_id: incidentId.toString(),
              dispute_id: disputeId.toString(),
              category: incident.category,
            },
          };

          await this.sendToMultipleTokens(tokens, payload);
          await this.logNotification(admin.id, 'dispute_submitted', incidentId, payload);
        }
      }
    } catch (error) {
      console.error('Error sending dispute notification:', error);
    }
  }

  /**
   * Get active push tokens for an admin based on their preferences
   */
  private async getAdminPushTokens(adminId: number, notificationType: string): Promise<string[]> {
    try {
      // Check if admin has this notification type enabled
      const prefQuery = `
        SELECT enabled, channels
        FROM notification_preferences
        WHERE admin_id = $1 AND notification_type = $2
      `;

      const prefResult = await pool.query(prefQuery, [adminId, notificationType]);

      // If preference exists and is disabled, return empty array
      if (prefResult.rows.length > 0) {
        const pref = prefResult.rows[0];
        if (!pref.enabled) {
          return [];
        }

        // Check if 'push' is in enabled channels
        const channels = typeof pref.channels === 'string' ? JSON.parse(pref.channels) : pref.channels;
        if (channels && !channels.includes('push')) {
          return [];
        }
      }
      // If no preference exists, default to enabled

      // Get active push tokens
      const tokensQuery = `
        SELECT token FROM push_notification_tokens
        WHERE admin_id = $1 AND is_active = true
        ORDER BY updated_at DESC
      `;

      const tokensResult = await pool.query(tokensQuery, [adminId]);
      return tokensResult.rows.map(row => row.token);
    } catch (error) {
      console.error('Error getting admin push tokens:', error);
      return [];
    }
  }

  /**
   * Send notification to multiple tokens
   */
  private async sendToMultipleTokens(tokens: string[], payload: NotificationPayload): Promise<void> {
    if (tokens.length === 0) return;

    if (tokens.length === 1) {
      // Send to single token
      await firebaseService.sendNotification({
        token: tokens[0],
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });
    } else {
      // Send to multiple tokens
      const result = await firebaseService.sendMulticastNotification(
        tokens,
        payload.title,
        payload.body,
        payload.data
      );

      // Remove invalid tokens
      if (result.invalidTokens.length > 0) {
        await this.deactivateTokens(result.invalidTokens);
      }
    }
  }

  /**
   * Deactivate invalid tokens
   */
  private async deactivateTokens(tokens: string[]): Promise<void> {
    try {
      const query = `
        UPDATE push_notification_tokens
        SET is_active = false, updated_at = NOW()
        WHERE token = ANY($1)
      `;

      await pool.query(query, [tokens]);
      console.log(`Deactivated ${tokens.length} invalid push tokens`);
    } catch (error) {
      console.error('Error deactivating tokens:', error);
    }
  }

  /**
   * Log notification delivery
   */
  private async logNotification(
    adminId: number,
    notificationType: string,
    incidentId: number,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO notification_delivery_log (
          admin_id,
          notification_type,
          incident_id,
          delivery_channel,
          status,
          message_content
        )
        VALUES ($1, $2, $3, 'push', 'sent', $4)
      `;

      await pool.query(query, [
        adminId,
        notificationType,
        incidentId,
        JSON.stringify(payload),
      ]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }
}

export const adminPushNotificationService = new AdminPushNotificationService();
