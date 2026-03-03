import axios from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../constants/api";
import { useAuthStore } from "../stores/authStore";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const store = useAuthStore.getState();
      const refreshToken = store.refreshToken;

      if (!refreshToken) {
        await store.clearSession();
        return Promise.reject(buildError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        const {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        } = res.data?.data || res.data || {};

        await store.setSession({
          user: user || store.user,
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
        });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await store.clearSession();
        return Promise.reject(buildError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(buildError(error));
  },
);

function buildError(error) {
  const message =
    error?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
  return {
    message,
    status: error?.response?.status,
    code: error?.response?.data?.errorCode || "UNKNOWN_ERROR",
    raw: error,
  };
}

export default client;
