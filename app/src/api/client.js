import axios from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT } from "../constants/api";
import { useAuthStore } from "../stores/authStore";
import { ENDPOINTS } from "./endpoints";
import i18n from "@/i18n";

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
const REFRESH_QUEUE_TIMEOUT_MS = 12000;

const PUBLIC_AUTH_PATHS = new Set([
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.loginGoogle,
]);

const normalizeRequestPath = (requestUrl) => {
  const raw = String(requestUrl || "")
    .split("?")[0]
    .trim();
  if (!raw) return "";

  let path = raw;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    path = new URL(path).pathname;
  }

  if (path.startsWith("/api/")) {
    path = path.slice(4);
  }

  return path.replace(/\/+$/, "") || "/";
};

const isPublicAuthRequest = (requestUrl) =>
  PUBLIC_AUTH_PATHS.has(normalizeRequestPath(requestUrl));

const isRefreshRequest = (requestUrl) =>
  normalizeRequestPath(requestUrl) === ENDPOINTS.auth.refresh;

const enqueueRequestWhileRefreshing = () =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({
        message: i18n.t("client.refreshTimeout"),
        status: 401,
        code: "REFRESH_TIMEOUT",
      });
    }, REFRESH_QUEUE_TIMEOUT_MS);

    failedQueue.push({
      resolve: (token) => {
        clearTimeout(timeoutId);
        resolve(token);
      },
      reject: (err) => {
        clearTimeout(timeoutId);
        reject(err);
      },
    });
  });

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

// Retry logic cho GET requests trên mobile network
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

client.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(buildError(error));
    }

    // Retry cho GET requests bị network error hoặc 5xx
    const retryCount = originalRequest._retryCount || 0;
    const shouldRetry =
      originalRequest.method === "get" &&
      retryCount < MAX_RETRIES &&
      (!error.response || error.response.status >= 500);

    if (shouldRetry) {
      originalRequest._retryCount = retryCount + 1;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * retryCount));
      return client(originalRequest);
    }

    const requestUrl = originalRequest?.url || "";
    const isPublicRequest = isPublicAuthRequest(requestUrl);
    const isRefreshCall = isRefreshRequest(requestUrl);

    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !isPublicRequest &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;

      const store = useAuthStore.getState();
      const refreshToken = store.refreshToken;

      if (!refreshToken) {
        await store.clearSession();
        return Promise.reject(buildError(error));
      }

      if (isRefreshing) {
        return enqueueRequestWhileRefreshing()
          .then((newToken) => {
            if (!newToken) {
              return Promise.reject({
                message: i18n.t("client.invalidSession"),
                status: 401,
                code: "INVALID_REFRESH_RESPONSE",
              });
            }

            originalRequest.headers = originalRequest.headers || {};
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

        if (!accessToken) {
          throw new Error("Missing access token in refresh response");
        }

        await store.setSession({
          user: user || store.user,
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
        });

        processQueue(null, accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(buildError(refreshError), null);
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
    error?.response?.data?.message || i18n.t("errors.unknown");
  return {
    message,
    status: error?.response?.status,
    code: error?.response?.data?.errorCode || "UNKNOWN_ERROR",
    raw: error,
  };
}

export default client;
