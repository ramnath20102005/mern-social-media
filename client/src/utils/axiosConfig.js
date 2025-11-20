import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  withCredentials: true
});

// Add a request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't already tried to refresh the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_CONFIG.baseURL}/refresh_token`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Update the Authorization header
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        
        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
