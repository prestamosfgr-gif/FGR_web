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

// Interceptor de respuesta: si la sesión expiró o el usuario fue suspendido (401),
// se limpia la sesión local y se vuelve a la pantalla de inicio de sesión.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const esLogin = url.includes('/api/Auth/login') || url.includes('/api/Auth/register');
    if (status === 401 && !esLogin && localStorage.getItem('fgr_token')) {
      localStorage.removeItem('fgr_token');
      localStorage.removeItem('fgr_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
