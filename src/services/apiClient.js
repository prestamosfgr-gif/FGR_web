import axios from 'axios';

// URL base de la API backend desplegada en Render (https://fgr-backend-oficial-xyjo.onrender.com)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://fgr-backend-oficial-xyjo.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // Aumentado a 15s para dar tiempo a Render si está despertando de reposo
});

// Interceptor para inyectar Token JWT en cada petición HTTP
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fgr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
