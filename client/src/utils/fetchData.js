import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://mysocial-lvsn.onrender.com/api'
        : 'http://localhost:8080/api',
    withCredentials: true
});

// Add response interceptor to handle authentication errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If it's an authentication error (401 or 403), silently handle it
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Don't show persistent errors for auth failures
            console.log('Authentication error intercepted:', error.response.data?.msg);
            
            // Clear localStorage if auth fails
            if (error.response.data?.msg?.includes('login again') || 
                error.response.data?.msg?.includes('Please login')) {
                localStorage.removeItem('firstLogin');
            }
        }
        
        return Promise.reject(error);
    }
);

export const getDataAPI = async (url,token) => {
    const res = await api.get(url.startsWith('/') ? url : `/${url}`,{
        headers: { Authorization: token}
    });
    return res;
}

export const postDataAPI = async (url, post, token) => {
  const res = await api.post(url.startsWith('/') ? url : `/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};

export const putDataAPI = async (url, post, token) => {
  const res = await api.put(url.startsWith('/') ? url : `/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};

export const patchDataAPI = async (url, post, token) => {
  const res = await api.patch(url.startsWith('/') ? url : `/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};

export const deleteDataAPI = async (url, token) => {
  const res = await api.delete(url.startsWith('/') ? url : `/${url}`, {
    headers: { Authorization: token },
  });
  return res;
};