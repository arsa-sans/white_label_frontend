import axios from 'axios';

let rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
// Ensure rawBaseUrl ends with /api/v1
if (!rawBaseUrl.endsWith('/api/v1')) {
  rawBaseUrl = rawBaseUrl.replace(/\/+$/, '') + '/api/v1';
}

export const api = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
