import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Note: withCredentials: true is no longer strictly required for Bearer tokens,
  // but it doesn't hurt to leave it if other endpoints rely on it.
  withCredentials: true, 
});

// 🚀 NEW: Automatically attach the token to every request
api.interceptors.request.use((config) => {
  // Safety check for Next.js SSR
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 🚀 PROMISE DEDUPLICATOR (Kept perfectly intact!)
const pendingRequests = new Map();
const originalGet = api.get;

api.get = async (url: string, config?: any) => {
  const queryString = config?.params ? JSON.stringify(config.params) : '';
  const key = `${url}-${queryString}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = originalGet(url, config).finally(() => {
    setTimeout(() => pendingRequests.delete(key), 2000);
  });

  pendingRequests.set(key, promise);
  return promise;
};

export default api;