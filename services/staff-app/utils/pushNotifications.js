import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return { granted: false, token: null };
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission denied');
      return { granted: false, token: null };
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with actual project ID from app.json
    });

    return {
      granted: true,
      token: tokenData.data,
    };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { granted: false, token: null };
  }
}

/**
 * Register push token with backend
 */
export async function registerPushToken(token) {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId = Device.modelName || 'unknown';

    const response = await apiClient('/api/admin/push-token', {
      method: 'POST',
      body: JSON.stringify({
        token,
        device_type: deviceType,
        device_id: deviceId,
      }),
    });

    console.log('Push token registered successfully');
    return response;
  } catch (error) {
    console.error('Failed to register push token:', error);
    throw error;
  }
}

/**
 * Deactivate push token (on logout)
 */
export async function deactivatePushToken(token) {
  try {
    await apiClient('/api/admin/push-token', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });

    console.log('Push token deactivated');
  } catch (error) {
    console.error('Failed to deactivate push token:', error);
  }
}

/**
 * Setup notification listeners
 * Returns a cleanup function
 */
export function setupNotificationListeners(navigation) {
  // Notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    // You can show a custom in-app notification here if desired
  });

  // User tapped on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);

    const data = response.notification.request.content.data;

    // Handle deep linking based on notification type
    if (data.type === 'incident_assigned' || data.type === 'status_changed' || data.type === 'high_priority_incident') {
      const incidentId = data.incident_id;
      if (incidentId && navigation) {
        navigation.navigate('IncidentDetail', { incidentId: parseInt(incidentId) });
      }
    } else if (data.type === 'dispute_submitted') {
      const incidentId = data.incident_id;
      if (incidentId && navigation) {
        navigation.navigate('IncidentDetail', { incidentId: parseInt(incidentId) });
      }
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from School Safety App',
        data: { type: 'test' },
      },
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.error('Error scheduling test notification:', error);
  }
}
