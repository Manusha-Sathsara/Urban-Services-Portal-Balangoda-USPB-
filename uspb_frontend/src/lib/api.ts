import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach double-submit CSRF token on state-changing requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method || "get").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const csrf = readCookie("uspb_csrf_token");
      if (csrf && config.headers) {
        config.headers["X-CSRF-Token"] = csrf;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise: Promise<void> | null = null;

// Automatically attempt a single session refresh on 401 before failing
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url || "";

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/refresh") &&
      !url.includes("/auth/me")
    ) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post("/auth/refresh")
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
        }
        await refreshPromise;
        return api(original);
      } catch {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?expired=1";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
