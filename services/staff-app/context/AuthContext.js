/**
 * Authentication Context
 * Manages authentication state and provides login/logout functionality
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStorage from '../utils/secureStorage';
import { login as apiLogin, getCurrentUser } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStorage.getAuthToken();

      if (token) {
        // Token exists, fetch user data
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token might be expired, clear auth data
      await SecureStorage.clearAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Call login API
      const response = await apiLogin(email, password);

      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      // Store token and user data
      await SecureStorage.storeAuthToken(response.token);
      await SecureStorage.storeUserData(response.user);

      // Update state
      setUser(response.user);

      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear storage
      await SecureStorage.clearAuthData();

      // Clear state
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      await SecureStorage.storeUserData(userData);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
