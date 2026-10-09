import axios from 'axios';

// Base URL for Backend REST API
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 8000
});

// Axios Request Interceptor: Automatically attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('collabhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Service function to retrieve system health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching backend health:', error.message);
    return {
      success: false,
      message: 'Backend connection unavailable',
      database: 'Disconnected',
      error: error.message
    };
  }
};

/**
 * Register a new student account
 */
export const registerApi = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 */
export const loginApi = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Fetch current user from session token
 */
export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Logout user session
 */
export const logoutApi = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (err) {
    return { success: true };
  }
};

/**
 * Fetch user profile
 */
export const getProfileApi = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfileApi = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

export default api;
