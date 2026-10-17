import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Auth token attached to request');
      } else {
        console.warn('⚠️ Token found but is empty');
      }
    } catch (e) {
      console.error('❌ Failed to parse auth token:', e);
    }
  } else {
    console.warn('⚠️ No auth token in localStorage');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login if unauthorized
      localStorage.removeItem("auth");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
