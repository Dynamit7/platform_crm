import axios from 'axios';

const api = axios.create({
  baseURL: '',  // Vite proxy handles /api and /auth
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const originalRequest = err.config;
      if (originalRequest._retry) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
      const refresh = localStorage.getItem('refresh_token');
      if (refresh && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data } = await api.post('/auth/refresh', { refresh_token: refresh });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
