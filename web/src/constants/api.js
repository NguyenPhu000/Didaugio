import axios from "axios";
import { API_BASE_URL } from "./constants";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES } from "./routes";
import { API_TIMEOUT } from "./timing";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;
    const requestUrl = originalRequest?.url || "";
    const isPublicAuthRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
      "/auth/resend-verification-public",
      "/auth/google",
      "/auth/google/exchange",
    ].some((path) => requestUrl.includes(path));
    const hasAccessToken = Boolean(useAuthStore.getState().accessToken);

    if (
      response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRequest &&
      hasAccessToken
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = AUTH_ROUTES.LOGIN;
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        if (refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        throw new Error("Refresh token failed");
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = AUTH_ROUTES.LOGIN;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (response?.status === 401 && !isPublicAuthRequest && !hasAccessToken) {
      useAuthStore.getState().logout();
      window.location.href = AUTH_ROUTES.LOGIN;
    }

    if (response?.status === 400 && response?.data?.errors) {
      const errorMessages = response.data.errors.map(
        (err) => `${err.field}: ${err.message}`,
      );
      const validationError = new Error(
        `Lỗi validation:\n${errorMessages.join("\n")}`,
      );
      validationError.status = response?.status;
      validationError.errorCode = response?.data?.errorCode;
      validationError.data = response?.data;
      return Promise.reject(validationError);
    }

    const message =
      response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
    const apiError = new Error(message);
    apiError.status = response?.status;
    apiError.errorCode = response?.data?.errorCode;
    apiError.data = response?.data;

    return Promise.reject(apiError);
  },
);

export default api;
