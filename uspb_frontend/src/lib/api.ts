import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      let token =
        localStorage.getItem("uspb_auth_token") ||
        sessionStorage.getItem("uspb_auth_token");

      // Auto-fetch demo session in local development if no session exists yet
      if (!token && !config.url?.includes("/auth/")) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/demo-token`);
          if (res.data?.success && res.data.data?.token) {
            token = res.data.data.token;
            localStorage.setItem("uspb_auth_token", token as string);
          }
        } catch {
          // If demo token is not available (e.g. production), proceed without token
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors with automatic retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      originalRequest._retry = true;
      if (typeof window !== "undefined") {
        // Clear expired/invalid token
        localStorage.removeItem("uspb_auth_token");
        sessionStorage.removeItem("uspb_auth_token");

        // Attempt one auto-recovery via demo-token in local development
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/demo-token`);
          if (res.data?.success && res.data.data?.token) {
            const newToken = res.data.data.token as string;
            localStorage.setItem("uspb_auth_token", newToken);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          // If demo recovery fails, proceed to reject
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
