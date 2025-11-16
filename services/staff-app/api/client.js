import Constants from 'expo-constants';

// Get the API base URL from environment variables
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001';

/**
 * Make a fetch request to the API
 * @param {string} endpoint - API endpoint (e.g., '/incidents')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise} - Response data
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get all incidents
 */
export const getIncidents = () => {
  return apiClient('/incidents', { method: 'GET' });
};

/**
 * Assign an incident to the current user
 * @param {string} incidentId - Incident ID
 */
export const assignIncident = (incidentId) => {
  return apiClient(`/incidents/${incidentId}/assign`, { method: 'POST' });
};
