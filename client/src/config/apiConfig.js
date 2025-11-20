const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://mysocial-lvsn.onrender.com/api'  // Your Render backend URL
  : 'http://localhost:5000/api';              // Local development

export const API_CONFIG = {
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Important for sending cookies with requests
};

export default API_CONFIG;
