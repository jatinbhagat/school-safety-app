/**
 * Network utilities for handling online/offline states
 * Provides hooks and utilities for network connectivity detection
 */
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Network state object
 * @typedef {Object} NetworkState
 * @property {boolean} isConnected - Whether device is connected to internet
 * @property {string} type - Connection type (wifi, cellular, none, etc.)
 * @property {boolean} isInternetReachable - Whether internet is actually reachable
 * @property {Object} details - Additional connection details
 */

/**
 * React hook for network connectivity state
 * @returns {NetworkState} Current network state
 */
export function useNetworkState() {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: true,
    details: {}
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details || {}
      });
    });

    // Subscribe to state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details || {}
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
}

/**
 * React hook that only provides online/offline status
 * @returns {boolean} True if connected to internet
 */
export function useIsOnline() {
  const networkState = useNetworkState();
  return networkState.isConnected && networkState.isInternetReachable !== false;
}

/**
 * Check if device is currently online
 * @returns {Promise<boolean>} Promise that resolves to online status
 */
export async function isOnline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  } catch (error) {
    console.warn('Failed to check network state:', error);
    return false;
  }
}

/**
 * Wait for network connection to be restored
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30 seconds)
 * @returns {Promise<boolean>} Promise that resolves when online or timeout
 */
export function waitForConnection(timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkConnection = async () => {
      const online = await isOnline();
      
      if (online) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }
      
      setTimeout(checkConnection, 1000);
    };
    
    checkConnection();
  });
}

/**
 * Retry a function when network connection is restored
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} delay - Delay between retries in milliseconds (default: 1000)
 * @returns {Promise} Promise that resolves with function result or rejects after max retries
 */
export async function retryWhenOnline(fn, maxRetries = 3, delay = 1000) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const online = await isOnline();
      
      if (!online) {
        throw new Error('No network connection');
      }
      
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries > maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
      }
      
      console.log(`Retry ${retries}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Enhanced fetch function that handles offline scenarios
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} Enhanced fetch promise
 */
export async function offlineAwareFetch(url, options = {}) {
  const online = await isOnline();
  
  if (!online) {
    throw new Error('No network connection available');
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      // Add a reasonable timeout
      timeout: options.timeout || 10000
    });
    
    return response;
  } catch (error) {
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      throw new Error('Network connection lost during request');
    }
    
    throw error;
  }
}

/**
 * Get user-friendly network status message
 * @param {NetworkState} networkState - Current network state
 * @returns {string|null} User-friendly message or null if connected
 */
export function getNetworkStatusMessage(networkState) {
  if (!networkState.isConnected) {
    return 'No internet connection. Please check your network settings.';
  }
  
  if (networkState.isInternetReachable === false) {
    return 'Connected to network but unable to reach the internet.';
  }
  
  if (networkState.type === 'cellular' && networkState.details?.cellularGeneration === '2g') {
    return 'Slow network detected. Some features may be limited.';
  }
  
  return null;
}

/**
 * Simple network status indicator component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function NetworkStatusBar() {
  const networkState = useNetworkState();
  const message = getNetworkStatusMessage(networkState);
  
  if (!message) {
    return null;
  }
  
  return (
    <View style={[
      styles.networkBanner, 
      networkState.isConnected ? styles.slowNetwork : styles.noNetwork
    ]}>
      <Text style={styles.networkMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  networkBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  noNetwork: {
    backgroundColor: '#FF3B30',
  },
  slowNetwork: {
    backgroundColor: '#FF9500',
  },
  networkMessage: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});