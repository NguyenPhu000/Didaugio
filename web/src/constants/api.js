import axios from "axios";
import { API_BASE_URL } from "./constants";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Flag để tránh refresh token nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    console.log(
      "API Request:",
      config.url,
      "Token:",
      accessToken ? "exists" : "missing"
    );
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and auto refresh token
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.config.url, "Data:", response.data);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    // Nếu lỗi 401 và chưa retry
    if (response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh thì đợi
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

      // Nếu không có refresh token thì logout
      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.data.accessToken;

          // Cập nhật access token mới
          useAuthStore.getState().setAccessToken(newAccessToken);

          // Retry các request đang chờ
          processQueue(null, newAccessToken);

          // Retry request gốc
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("Refresh token failed");
        }
      } catch (refreshError) {
        // Refresh token thất bại - logout
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle validation errors (400) with detailed messages
    if (response?.status === 400 && response?.data?.errors) {
      const validationErrors = response.data.errors;
      const errorMessages = validationErrors.map(
        (err) => `${err.field}: ${err.message}`
      );
      const message = `Lỗi validation:\n${errorMessages.join('\n')}`;
      return Promise.reject(new Error(message));
    }

    // Return error message
    const message =
      response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
    return Promise.reject(new Error(message));
  }
);

export default api;
