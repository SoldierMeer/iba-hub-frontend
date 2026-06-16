// import axios from 'axios';

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://iba-hub-backend.onrender.com/api/v1',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true,
// });

// // 1. Interceptor (This must run before any request is made)
// api.interceptors.request.use((config) => {
//   if (typeof window !== 'undefined') {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// }, (error) => Promise.reject(error));

// // 2. Promise Deduplicator (Modified to respect the interceptor)
// const pendingRequests = new Map();

// // We override the api.get method directly on the instance
// const originalGet = api.get;
// api.get = async (url: string, config?: any) => {
//   const queryString = config?.params ? JSON.stringify(config.params) : '';
//   const key = `${url}-${queryString}`;

//   if (pendingRequests.has(key)) {
//     return pendingRequests.get(key);
//   }

//   // Calling 'api.get' inside here now correctly triggers the interceptor
//   const promise = originalGet(url, config).finally(() => {
//     setTimeout(() => pendingRequests.delete(key), 2000);
//   });

//   pendingRequests.set(key, promise);
//   return promise;
// };

// export default api;

// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://iba-hub-backend.onrender.com/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Interceptor only handles the Auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

export default api;