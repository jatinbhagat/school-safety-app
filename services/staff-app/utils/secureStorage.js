/**
 * Secure Token Storage using AsyncStorage
 * Provides secure storage for JWT tokens and user data
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@school_safety_auth_token',
  USER_DATA: '@school_safety_user_data',
  DEVICE_ID: '@school_safety_device_id',
  PUSH_TOKEN: '@school_safety_push_token',
};

/**
 * Store authentication token
 */
export const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    return true;
  } catch (error) {
    console.error('Error storing auth token:', error);
    return false;
  }
};

/**
 * Get authentication token
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Store user data
 */
export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

/**
 * Get user data
 */
export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Store device ID
 */
export const storeDeviceId = async (deviceId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    return true;
  } catch (error) {
    console.error('Error storing device ID:', error);
    return false;
  }
};

/**
 * Get device ID
 */
export const getDeviceId = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * Store push notification token
 */
export const storePushToken = async (pushToken) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, pushToken);
    return true;
  } catch (error) {
    console.error('Error storing push token:', error);
    return false;
  }
};

/**
 * Get push notification token
 */
export const getPushToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Clear all authentication data (logout)
 */
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};
