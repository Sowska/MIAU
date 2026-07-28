import axios from 'axios';
import useToastStore from '../store/toastStore';
import useAuthStore from '../store/authStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach JWT token from localStorage on every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses — clear auth state and show toast
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      // Only show toast if user was previously authenticated
      if (authStore.token) {
        authStore.logout();
        useToastStore.getState().addToast('warning', 'Session expired. Please log in again.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
