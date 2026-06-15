import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    // 🚀 Removed the strict 'no-cache' headers so the browser can breathe
  },
  withCredentials: true,
});

// 🚀 PROMISE DEDUPLICATOR
// Prevents 6 components from making 6 identical API calls at the same time
// 🚀 PROMISE DEDUPLICATOR
const pendingRequests = new Map();

const originalGet = api.get;

api.get = async (url: string, config?: any) => {
  // 🚀 THE FIX: Serialize the params into the key!
  // Now '/complaints?category=IT' and '/complaints?category=Academics' have different keys.
  const queryString = config?.params ? JSON.stringify(config.params) : '';
  const key = `${url}-${queryString}`;

  // If a request for this EXACT url + exact parameters is in-flight, return the existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Otherwise, fire the network request and store the promise
  const promise = originalGet(url, config).finally(() => {
    // Clear the promise from memory after 2 seconds.
    setTimeout(() => pendingRequests.delete(key), 2000);
  });

  pendingRequests.set(key, promise);
  return promise;
};

export default api;