/**
 * Simple in-memory cache for API responses
 * Helps reduce API calls for frequently accessed data like incident details
 */

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached data
 * @property {number} timestamp - When the data was cached
 * @property {number} ttl - Time to live in milliseconds
 */

/**
 * Generate cache key
 * @param {string} type - Type of data (e.g., 'incident', 'user')
 * @param {string|number} id - Unique identifier
 * @returns {string} Cache key
 */
function generateKey(type, id) {
  return `${type}:${id}`;
}

/**
 * Check if cache entry is still valid
 * @param {CacheEntry} entry - Cache entry to check
 * @returns {boolean} True if valid, false if expired
 */
function isValid(entry) {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get data from cache
 * @param {string} type - Type of data
 * @param {string|number} id - Unique identifier
 * @returns {any|null} Cached data or null if not found/expired
 */
export function getFromCache(type, id) {
  const key = generateKey(type, id);
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (!isValid(entry)) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Store data in cache
 * @param {string} type - Type of data
 * @param {string|number} id - Unique identifier
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export function setCache(type, id, data, ttl = CACHE_TTL) {
  const key = generateKey(type, id);
  const entry = {
    data,
    timestamp: Date.now(),
    ttl
  };
  
  cache.set(key, entry);
}

/**
 * Remove specific item from cache
 * @param {string} type - Type of data
 * @param {string|number} id - Unique identifier
 */
export function removeFromCache(type, id) {
  const key = generateKey(type, id);
  cache.delete(key);
}

/**
 * Clear all cached data of a specific type
 * @param {string} type - Type of data to clear
 */
export function clearCacheByType(type) {
  const keysToDelete = [];
  
  for (const key of cache.keys()) {
    if (key.startsWith(`${type}:`)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const stats = {
    totalEntries: cache.size,
    validEntries: 0,
    expiredEntries: 0,
    types: {}
  };
  
  for (const [key, entry] of cache.entries()) {
    const [type] = key.split(':');
    stats.types[type] = (stats.types[type] || 0) + 1;
    
    if (isValid(entry)) {
      stats.validEntries++;
    } else {
      stats.expiredEntries++;
    }
  }
  
  return stats;
}

/**
 * React hook for cached data with automatic fetching
 * @param {string} type - Type of data
 * @param {string|number} id - Unique identifier
 * @param {Function} fetchFunction - Function to fetch data if not in cache
 * @returns {Object} { data, loading, error, refetch }
 */
import { useState, useEffect } from 'react';

export function useCachedData(type, id, fetchFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = getFromCache(type, id);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }
      
      // Fetch from API
      const fetchedData = await fetchFunction();
      
      // Cache the result
      setCache(type, id, fetchedData);
      setData(fetchedData);
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch ${type}:${id}`, err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [type, id]);
  
  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true)
  };
}

// Clean up expired entries periodically
setInterval(() => {
  const keysToDelete = [];
  
  for (const [key, entry] of cache.entries()) {
    if (!isValid(entry)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
}, 60000); // Every minute