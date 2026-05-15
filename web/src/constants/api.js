import axios from "axios";
import { API_BASE_URL } from "./constants";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES } from "./routes";
import { API_TIMEOUT } from "./timing";
import { applyBusinessApiErrorUx } from "@/utils/businessApiErrorUx";
import { toast } from "sonner";

/**
 * Instance axios dùng chung. Trên response lỗi, có thể truyền:
 * `{ skipBusinessErrorUX: true }` trong config để bỏ qua toast/redirect mã cổng doanh nghiệp
 * (NO_BUSINESS_PROFILE, BUSINESS_SUSPENDED, …) — dùng khi tự xử lý trong caller.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT,
});

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification-public",
  "/auth/google",
  "/auth/google/exchange",
  "/auth/google/exchange-result",
]);

const normalizeRequestPath = (requestUrl) => {
  const raw = String(requestUrl || "")
    .split("?")[0]
    .trim();
  if (!raw) return "";

  let normalizedPath = raw;
  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    normalizedPath = new URL(normalizedPath).pathname;
  }

  if (normalizedPath.startsWith("/api/")) {
    normalizedPath = normalizedPath.slice(4);
  }

  return normalizedPath.replace(/\/+$/, "") || "/";
};

const isPublicAuthRequest = (requestUrl) =>
  PUBLIC_AUTH_PATHS.has(normalizeRequestPath(requestUrl));

const isRefreshRequest = (requestUrl) =>
  normalizeRequestPath(requestUrl) === "/auth/refresh";

const redirectToLogin = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== AUTH_ROUTES.LOGIN) {
    window.location.assign(AUTH_ROUTES.LOGIN);
  }
};

const clearAuthAndRedirect = () => {
  useAuthStore.getState().logout();
  redirectToLogin();
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

const rejectPendingQueue = (error) => {
  if (failedQueue.length > 0) {
    processQueue(error, null);
  }
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
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const { response } = error;

    const requestUrl = originalRequest?.url || "";
    const isPublicRequest = isPublicAuthRequest(requestUrl);
    const isRefresh = isRefreshRequest(requestUrl);
    const hasAccessToken = Boolean(useAuthStore.getState().accessToken);
    const isLogoutInProgress = Boolean(useAuthStore.getState().isLoggingOut);
    const skipAuthRefresh = Boolean(originalRequest?.skipAuthRefresh);
    const skipAuthRedirect = Boolean(originalRequest?.skipAuthRedirect);

    if (
      response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicRequest &&
      !isRefresh &&
      hasAccessToken &&
      !skipAuthRefresh &&
      !isLogoutInProgress
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (!token) {
              return Promise.reject(new Error("Missing refreshed token"));
            }

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      const refreshToken = useAuthStore.getState().refreshToken;
      originalRequest._retry = true;

      if (!refreshToken) {
        rejectPendingQueue(new Error("Missing refresh token"));
        if (!skipAuthRedirect) {
          clearAuthAndRedirect();
        }
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } },
        );

        if (refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.data.accessToken;

          if (useAuthStore.getState().isLoggingOut) {
            throw new Error("Logout in progress");
          }

          useAuthStore.getState().setAccessToken(newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }

        throw new Error("Refresh token failed");
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (!skipAuthRedirect && !useAuthStore.getState().isLoggingOut) {
          clearAuthAndRedirect();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      response?.status === 401 &&
      !isPublicRequest &&
      !hasAccessToken &&
      !skipAuthRedirect &&
      !isLogoutInProgress
    ) {
      clearAuthAndRedirect();
    }

    // Handle 403 Forbidden — permissions may have been revoked mid-session
    if (response?.status === 403 && !isPublicRequest && hasAccessToken) {
      const errorCode = response?.data?.errorCode;

      // If the 403 is from a permission/auth endpoint itself, force logout to avoid infinite loops
      const isPermissionEndpoint =
        normalizeRequestPath(requestUrl).includes("/permissions") ||
        errorCode === "FORBIDDEN_USER" ||
        errorCode === "FORBIDDEN_SYSTEM_ROLE";

      if (isPermissionEndpoint) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (!originalRequest?.skipPermissionToast && !originalRequest?._403Shown) {
        originalRequest._403Shown = true;
        toast.error(
          "Quyền truy cập của bạn đã thay đổi, vui lòng tải lại trang.",
        );
      }
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

    if (
      !originalRequest?.skipBusinessErrorUX &&
      applyBusinessApiErrorUx(apiError)
    ) {
      // Đã toast (+ redirect tuỳ mã); error.globalBusinessUxHandled = true
    }

    return Promise.reject(apiError);
  },
);

export default api;
