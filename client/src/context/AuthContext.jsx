import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi, logoutApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('collabhub_token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('collabhub_token');
      if (storedToken) {
        try {
          const data = await getMeApi();
          if (data && data.success && data.user) {
            setCurrentUser(data.user);
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token invalid or user no longer exists
            localStorage.removeItem('collabhub_token');
            setToken(null);
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Session restoration failed:', error.message);
          localStorage.removeItem('collabhub_token');
          setToken(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const data = await loginApi({ email, password });
      if (data && data.success) {
        localStorage.setItem('collabhub_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    try {
      const data = await registerApi({ name, email, password });
      if (data && data.success) {
        localStorage.setItem('collabhub_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('collabhub_token');
      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update current user profile state
  const updateUser = (updatedUser) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedUser
    }));
  };

  const value = {
    currentUser,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to consume AuthContext cleanly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
