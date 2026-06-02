import axios from 'axios';

const api = axios.create({
  baseURL: '',  // Vite proxy handles /api and /auth
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const originalRequest = err.config;
      // Don't retry if the failing request IS the refresh endpoint
      if (originalRequest.url === '/auth/refresh') {
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
      if (originalRequest._retry) {
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
      const refresh = sessionStorage.getItem('refresh_token');
      if (refresh) {
        originalRequest._retry = true;
        try {
          const { data } = await api.post('/auth/refresh', { refresh_token: refresh });
          sessionStorage.setItem('access_token', data.access_token);
          sessionStorage.setItem('refresh_token', data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          sessionStorage.clear();
          window.location.href = '/login';
        }
      } else {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
