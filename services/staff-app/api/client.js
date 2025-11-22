/**
 * Enhanced API Client with JWT Authentication
 * Supports all backend endpoints for the staff mobile app
 */
import Constants from 'expo-constants';
import { getAuthToken } from '../utils/secureStorage';

// Get the API base URL from environment variables
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001';

/**
 * Make an authenticated fetch request to the API
 * @param {string} endpoint - API endpoint (e.g., '/api/admin/incidents')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} requiresAuth - Whether this endpoint requires authentication
 * @returns {Promise} - Response data
 */
export const apiClient = async (endpoint, options = {}, requiresAuth = true) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add JWT token if authentication is required
  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = (email, password) => {
  return apiClient(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    false // No auth required for login
  );
};

/**
 * Get current user information
 * @returns {Promise<object>}
 */
export const getCurrentUser = () => {
  return apiClient('/api/auth/me', { method: 'GET' });
};

/**
 * Update user profile
 * @param {object} profileData - {name, password, etc.}
 * @returns {Promise<object>}
 */
export const updateProfile = (profileData) => {
  return apiClient('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// ============================================================================
// INCIDENT APIs
// ============================================================================

/**
 * Get all incidents for the current admin's institution
 * @param {object} filters - {status, category, search, limit, offset}
 * @returns {Promise<{incidents: array, total: number}>}
 */
export const getIncidents = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.assignedToMe) params.append('assignedToMe', 'true');
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/admin/incidents?${queryString}` : '/api/admin/incidents';

  return apiClient(endpoint, { method: 'GET' });
};

/**
 * Get incident detail
 * @param {number} incidentId
 * @returns {Promise<object>}
 */
export const getIncidentDetail = (incidentId) => {
  return apiClient(`/api/admin/incidents/${incidentId}`, { method: 'GET' });
};

/**
 * Assign an incident to the current user
 * @param {number} incidentId
 * @returns {Promise<object>}
 */
export const assignIncident = (incidentId) => {
  return apiClient(`/api/incidents/${incidentId}/assign`, { method: 'POST' });
};

/**
 * Add a note to an incident
 * @param {number} incidentId
 * @param {string} note
 * @returns {Promise<object>}
 */
export const addIncidentNote = (incidentId, note) => {
  return apiClient(`/api/incidents/${incidentId}/note`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
};

/**
 * Update incident status
 * @param {number} incidentId
 * @param {string} status - 'open', 'in_progress', 'resolved', 'closed'
 * @param {string} notes - Optional notes about the status change
 * @returns {Promise<object>}
 */
export const updateIncidentStatus = (incidentId, status, notes = '') => {
  return apiClient(`/api/admin/incidents/${incidentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
};

/**
 * Flag incident as false report
 * @param {number} incidentId
 * @param {string} reason
 * @param {string} notes
 * @returns {Promise<object>}
 */
export const flagAsFalse = (incidentId, reason, notes = '') => {
  return apiClient(`/api/admin/incidents/${incidentId}/flag-false`, {
    method: 'POST',
    body: JSON.stringify({ reason, notes }),
  });
};

/**
 * Confirm incident as false report (super admin only)
 * @param {number} incidentId
 * @param {string} finalNotes
 * @returns {Promise<object>}
 */
export const confirmFalseReport = (incidentId, finalNotes = '') => {
  return apiClient(`/api/admin/incidents/${incidentId}/confirm-false`, {
    method: 'POST',
    body: JSON.stringify({ finalNotes }),
  });
};

/**
 * Restore false report flag
 * @param {number} incidentId
 * @param {string} reason
 * @returns {Promise<object>}
 */
export const restoreFalseReport = (incidentId, reason = '') => {
  return apiClient(`/api/admin/incidents/${incidentId}/restore`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Get reporter history by fingerprint
 * @param {string} fingerprint
 * @returns {Promise<{incidents: array, reputation: object}>}
 */
export const getReporterHistory = (fingerprint) => {
  return apiClient(`/api/admin/reporter-history/${fingerprint}`, { method: 'GET' });
};

/**
 * Block a reporter
 * @param {string} fingerprint
 * @param {string} reason
 * @returns {Promise<object>}
 */
export const blockReporter = (fingerprint, reason) => {
  return apiClient(`/api/admin/block-reporter`, {
    method: 'POST',
    body: JSON.stringify({ fingerprint, reason }),
  });
};

// ============================================================================
// PUSH NOTIFICATION APIs
// ============================================================================

/**
 * Register device push notification token
 * @param {string} token - Expo push token
 * @param {string} deviceType - 'ios' or 'android'
 * @param {string} deviceName - Optional device name
 * @returns {Promise<object>}
 */
export const registerPushToken = (token, deviceType, deviceName = '') => {
  return apiClient('/api/push/register-token', {
    method: 'POST',
    body: JSON.stringify({ token, deviceType, deviceName }),
  });
};

/**
 * Get notification preferences
 * @returns {Promise<object>}
 */
export const getNotificationPreferences = () => {
  return apiClient('/api/push/preferences', { method: 'GET' });
};

/**
 * Update notification preferences
 * @param {object} preferences
 * @returns {Promise<object>}
 */
export const updateNotificationPreferences = (preferences) => {
  return apiClient('/api/push/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};
