import axios from 'axios';

const API = axios.create({
  //baseURL: import.meta.env.VITE_API_URL || '/api',
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Interceptor para adjuntar el Token JWT
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;