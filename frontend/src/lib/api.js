import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/register-invite',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

const toFriendlyAuthMessage = (serverMessage) => {
  const normalized = String(serverMessage || '').toLowerCase();
  if (normalized.includes('disabled') || normalized.includes('banned')) {
    return 'Your account has been banned. Please contact support.';
  }
  if (normalized.includes('not found') || normalized.includes('deleted')) {
    return 'Your account no longer exists. Please contact support.';
  }
  return 'Your session is no longer valid. Please log in again.';
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const hasSession = Boolean(localStorage.getItem('token'));
    const isAuthRequest = AUTH_ENDPOINTS.some((path) => requestUrl.includes(path));

    if (hasSession && !isAuthRequest && (status === 401 || status === 403)) {
      const serverMessage = error?.response?.data?.message;
      sessionStorage.setItem('auth_notice', toFriendlyAuthMessage(serverMessage));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
