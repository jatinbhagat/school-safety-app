import * as admin from 'firebase-admin';

/**
 * Firebase Cloud Messaging (FCM) Service
 * Sends push notifications to mobile apps via Firebase
 */

interface PushNotificationOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
}

interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class FirebaseService {
  private initialized: boolean = false;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initialize() {
    try {
      // Check if Firebase credentials are configured
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!serviceAccountKey || serviceAccountKey === 'your_firebase_service_account_key_json_here') {
        console.warn('⚠️ Firebase not configured. Push notifications will be disabled.');
        this.isConfigured = false;
        return;
      }

      // Parse service account key (should be JSON string)
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Expected JSON string.');
        this.isConfigured = false;
        return;
      }

      // Initialize Firebase Admin
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId || serviceAccount.project_id,
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
      }

      this.initialized = true;
      this.isConfigured = true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendNotification(options: PushNotificationOptions): Promise<PushNotificationResult> {
    if (!this.isConfigured) {
      console.warn('⚠️ Firebase not configured. Push notification not sent.');
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.imageUrl,
        },
        data: options.data || {},
        apns: {
          payload: {
            aps: {
              badge: options.badge,
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Push notification sent successfully:', response);

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      console.error('❌ Failed to send push notification:', error);

      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'invalid_token',
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendMulticastNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number; invalidTokens: string[] }> {
    if (!this.isConfigured) {
      console.warn('⚠️ Firebase not configured. Push notifications not sent.');
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'default',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Track invalid tokens for cleanup
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      console.log(`✅ Multicast notification sent: ${response.successCount} success, ${response.failureCount} failed`);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      console.error('❌ Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }

  /**
   * Send notification to a topic (group of devices)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<PushNotificationResult> {
    if (!this.isConfigured) {
      console.warn('⚠️ Firebase not configured. Topic notification not sent.');
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Topic notification sent to '${topic}':`, response);

      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      console.error(`❌ Failed to send topic notification to '${topic}':`, error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('⚠️ Firebase not configured. Topic subscription skipped.');
      return;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`✅ Subscribed ${response.successCount} devices to topic '${topic}'`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic '${topic}':`, error);
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('⚠️ Firebase not configured. Topic unsubscription skipped.');
      return;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`✅ Unsubscribed ${response.successCount} devices from topic '${topic}'`);
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from topic '${topic}':`, error);
    }
  }
}

// Singleton instance
export const firebaseService = new FirebaseService();
