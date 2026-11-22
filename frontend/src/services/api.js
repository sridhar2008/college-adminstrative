import axios from 'axios';

// Production Cloud API fallback for live website deployment (e.g. GitHub Pages)
const DEFAULT_PROD_API = 'https://csms-backend-9lg0.onrender.com/api/v1';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const custom = localStorage.getItem('csms_custom_api_url');
  if (custom) return custom;
  
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000/api/v1';
  }
  return DEFAULT_PROD_API;
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user info
      localStorage.removeItem('csms_token');
      localStorage.removeItem('csms_user');
      // Do not redirect if it's the login attempt itself failing
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest && !window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
