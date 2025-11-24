import { Request, Response } from 'express';
import { pool } from '../db';
import { firebaseService } from '../utils/firebase';

/**
 * POST /api/admin/push-token
 * Register or update push notification token for an admin
 */
export async function registerPushToken(req: Request, res: Response) {
  try {
    const { token, device_type, device_id } = req.body;
    const adminId = req.admin?.adminId;
    const institutionId = req.admin?.institutionId;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Token is required',
      });
    }

    if (!device_type || !['ios', 'android', 'web'].includes(device_type)) {
      return res.status(400).json({
        error: 'Invalid device_type. Must be one of: ios, android, web',
      });
    }

    // Check if token already exists
    const existingQuery = `
      SELECT id FROM push_notification_tokens
      WHERE token = $1 AND admin_id = $2
    `;

    const existingResult = await pool.query(existingQuery, [token, adminId]);

    if (existingResult.rows.length > 0) {
      // Update existing token
      const updateQuery = `
        UPDATE push_notification_tokens
        SET
          device_type = $1,
          device_id = $2,
          is_active = true,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      await pool.query(updateQuery, [device_type, device_id, existingResult.rows[0].id]);

      return res.status(200).json({
        message: 'Push token updated successfully',
      });
    } else {
      // Insert new token
      const insertQuery = `
        INSERT INTO push_notification_tokens (
          admin_id,
          institution_id,
          token,
          device_type,
          device_id,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
      `;

      await pool.query(insertQuery, [
        adminId,
        institutionId,
        token,
        device_type,
        device_id || null,
      ]);

      return res.status(201).json({
        message: 'Push token registered successfully',
      });
    }
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({
      error: 'Failed to register push token',
    });
  }
}

/**
 * DELETE /api/admin/push-token
 * Deactivate a push notification token
 */
export async function deactivatePushToken(req: Request, res: Response) {
  try {
    const { token } = req.body;
    const adminId = req.admin?.adminId;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
      });
    }

    const updateQuery = `
      UPDATE push_notification_tokens
      SET is_active = false, updated_at = NOW()
      WHERE token = $1 AND admin_id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [token, adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Token not found',
      });
    }

    res.status(200).json({
      message: 'Push token deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating push token:', error);
    res.status(500).json({
      error: 'Failed to deactivate push token',
    });
  }
}

/**
 * GET /api/admin/notification-preferences
 * Get notification preferences for the current admin
 */
export async function getNotificationPreferences(req: Request, res: Response) {
  try {
    const adminId = req.admin?.adminId;

    const query = `
      SELECT
        notification_type,
        enabled,
        channels
      FROM notification_preferences
      WHERE admin_id = $1
    `;

    const result = await pool.query(query, [adminId]);

    res.status(200).json({
      preferences: result.rows,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
    });
  }
}

/**
 * PUT /api/admin/notification-preferences
 * Update notification preferences for the current admin
 */
export async function updateNotificationPreferences(req: Request, res: Response) {
  try {
    const { notification_type, enabled, channels } = req.body;
    const adminId = req.admin?.adminId;

    if (!notification_type) {
      return res.status(400).json({
        error: 'notification_type is required',
      });
    }

    // Valid notification types
    const validTypes = [
      'incident_assigned',
      'incident_status_changed',
      'new_incident_created',
      'high_priority_incident',
      'dispute_submitted',
    ];

    if (!validTypes.includes(notification_type)) {
      return res.status(400).json({
        error: `Invalid notification_type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Valid channels
    const validChannels = ['push', 'email', 'sms'];
    if (channels && !Array.isArray(channels)) {
      return res.status(400).json({
        error: 'channels must be an array',
      });
    }

    if (channels && !channels.every((ch: string) => validChannels.includes(ch))) {
      return res.status(400).json({
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
      });
    }

    // Check if preference exists
    const existingQuery = `
      SELECT id FROM notification_preferences
      WHERE admin_id = $1 AND notification_type = $2
    `;

    const existingResult = await pool.query(existingQuery, [adminId, notification_type]);

    if (existingResult.rows.length > 0) {
      // Update existing preference
      const updateQuery = `
        UPDATE notification_preferences
        SET
          enabled = COALESCE($1, enabled),
          channels = COALESCE($2, channels),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        enabled,
        channels ? JSON.stringify(channels) : null,
        existingResult.rows[0].id,
      ]);

      return res.status(200).json({
        message: 'Notification preference updated',
        preference: result.rows[0],
      });
    } else {
      // Create new preference
      const insertQuery = `
        INSERT INTO notification_preferences (
          admin_id,
          notification_type,
          enabled,
          channels
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        adminId,
        notification_type,
        enabled !== undefined ? enabled : true,
        JSON.stringify(channels || ['push']),
      ]);

      return res.status(201).json({
        message: 'Notification preference created',
        preference: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
    });
  }
}

/**
 * POST /api/admin/test-notification
 * Send a test push notification to verify setup
 */
export async function sendTestNotification(req: Request, res: Response) {
  try {
    const adminId = req.admin?.adminId;

    // Get admin's active push tokens
    const tokensQuery = `
      SELECT token FROM push_notification_tokens
      WHERE admin_id = $1 AND is_active = true
    `;

    const tokensResult = await pool.query(tokensQuery, [adminId]);

    if (tokensResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No active push tokens found',
        message: 'Please register your device first using the mobile app',
      });
    }

    // Send test notification to the first token
    const token = tokensResult.rows[0].token;

    const result = await firebaseService.sendNotification({
      token,
      title: 'Test Notification',
      body: 'Your push notifications are working correctly!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      return res.status(200).json({
        message: 'Test notification sent successfully',
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        error: 'Failed to send test notification',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
    });
  }
}
