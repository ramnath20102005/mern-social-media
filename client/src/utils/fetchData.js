import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-app-name.vercel.app/api'
        : 'http://localhost:8080/api'
});

export const getDataAPI = async (url,token) => {
    const res = await api.get(`/${url}`,{
        headers: { Authorization: token}
    });
    return res;
}

export const postDataAPI = async (url, post, token) => {
  const res = await api.post(`/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};

export const putDataAPI = async (url, post, token) => {
  const res = await api.put(`/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};

export const patchDataAPI = async (url, post, token) => {
  const res = await api.patch(`/${url}`, post, {
    headers: { Authorization: token },
  });
  return res;
};


export const deleteDataAPI = async (url, token) => {
  const res = await api.delete(`/${url}`, {
    headers: { Authorization: token },
  });
  return res;
};