/**
 * API Configuration Utility
 * 
 * This handles the API URL configuration for different environments.
 * Azure Static Web Apps environment variables aren't working properly,
 * so we use runtime detection as a fallback.
 */

export function getApiBaseUrl(): string {
  // First try environment variable (for local development)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Runtime detection for production (fallback when env vars don't work)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domains
    if (hostname === 'www.safelynotify.com' || hostname === 'safelynotify.com') {
      return 'https://safelynotify.azurewebsites.net';
    }
  }

  // Default fallback for local development
  return 'http://localhost:3001';
}

// Debug logging (remove after fixing Azure env vars)
if (typeof window !== 'undefined') {
  console.log('🔍 CONFIG DEBUG - hostname:', window.location.hostname);
  console.log('🔍 CONFIG DEBUG - API URL:', getApiBaseUrl());
  console.log('🔍 CONFIG DEBUG - env var:', process.env.NEXT_PUBLIC_API_URL);
}