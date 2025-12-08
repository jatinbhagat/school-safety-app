import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken, deactivatePushToken } from '../api/client';

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
 * Request notification permissions and get push token
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

    // Get project ID from configuration
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) {
      console.warn('No Expo project ID found. Push notifications may not work properly.');
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
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
export async function registerPushTokenWithBackend(token) {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId = Device.osInternalBuildId || Device.deviceId || 'unknown';

    const response = await registerPushToken(token, deviceType, deviceId);
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
export async function deactivatePushTokenFromBackend(token) {
  try {
    await deactivatePushToken(token);
    console.log('Push token deactivated');
  } catch (error) {
    console.error('Failed to deactivate push token:', error);
  }
}

/**
 * Setup notification listeners
 * Returns a cleanup function
 */
export function setupNotificationListeners(navigationRef) {
  // Notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    // Show badge or alert to user that they received a notification
    const { title, body, data } = notification.request.content;
    
    // You can customize in-app notification display here
    // For now, we'll just log and let the default behavior handle it
  });

  // User tapped on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);

    const data = response.notification.request.content.data;
    
    // Handle deep linking based on notification type
    if (data?.type && navigationRef?.current) {
      const navigation = navigationRef.current;
      
      switch (data.type) {
        case 'incident_assigned':
        case 'incident_updated':
        case 'status_changed':
        case 'high_priority_incident':
        case 'dispute_submitted':
          if (data.incident_id) {
            navigation.navigate('IncidentDetail', { 
              incidentId: parseInt(data.incident_id) 
            });
          }
          break;
          
        case 'system_announcement':
          // Navigate to notifications or home screen
          navigation.navigate('IncidentsList');
          break;
          
        default:
          // Default behavior - navigate to home
          navigation.navigate('IncidentsList');
      }
    }
  });

  // Return cleanup function
  return () => {
    if (notificationListener) {
      Notifications.removeNotificationSubscription(notificationListener);
    }
    if (responseListener) {
      Notifications.removeNotificationSubscription(responseListener);
    }
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
export async function scheduleTestNotification(title = 'Test Notification', body = 'This is a test notification from School Safety App', data = {}) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'test', ...data },
        sound: true,
      },
      trigger: { seconds: 1 },
    });
    
    console.log('Test notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling test notification:', error);
    throw error;
  }
}

/**
 * Initialize push notifications for the app
 * This should be called at app startup
 */
export async function initializePushNotifications() {
  try {
    const { granted, token } = await requestNotificationPermissions();
    
    if (granted && token) {
      await registerPushTokenWithBackend(token);
      return { success: true, token };
    } else {
      console.warn('Push notifications not available or permission denied');
      return { success: false, token: null };
    }
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return { success: false, token: null };
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error getting notification permission status:', error);
    return 'undetermined';
  }
}
