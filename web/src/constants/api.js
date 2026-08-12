import axios from "axios";
import { API_BASE_URL } from "./constants";
import { useAuthStore } from "@/stores/authStore";
import { AUTH_ROUTES } from "./routes";
import { API_TIMEOUT } from "./timing";
import {
  BUSINESS_GATE_ERROR_CODES,
  applyBusinessApiErrorUx,
} from "@/utils/businessApiErrorUx";
import { toast } from "sonner";

axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

/**
 * Instance axios dùng chung. Trên response lỗi, có thể truyền:
 * `{ skipBusinessErrorUX: true }` trong config để bỏ qua toast/redirect mã cổng doanh nghiệp
 * (NO_BUSINESS_PROFILE, BUSINESS_SUSPENDED, …) — dùng khi tự xử lý trong caller.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Platform": "web",
  },
  timeout: API_TIMEOUT,
});

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/register-business",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification-public",
  "/auth/google",
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

let browserCsrfToken = null;
let browserCsrfRequest = null;

const fetchBrowserCsrfToken = async () => {
  const response = await axios.get(`${API_BASE_URL}/auth/csrf`, {
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "X-Client-Platform": "web",
    },
    timeout: API_TIMEOUT,
  });
  const token = response?.data?.data?.csrfToken;
  if (!token) {
    throw new Error("Missing CSRF token");
  }
  browserCsrfToken = token;
  return token;
};

const ensureBrowserCsrfToken = async () => {
  if (browserCsrfToken) return browserCsrfToken;
  if (!browserCsrfRequest) {
    browserCsrfRequest = fetchBrowserCsrfToken().finally(() => {
      browserCsrfRequest = null;
    });
  }
  return browserCsrfRequest;
};

const resetBrowserCsrfToken = () => {
  browserCsrfToken = null;
};

const requestBrowserRefresh = async () => {
  const request = async () =>
    axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "X-Client-Platform": "web",
          "X-CSRF-Token": await ensureBrowserCsrfToken(),
        },
      },
    );

  try {
    return await request();
  } catch (error) {
    const shouldRetryCsrf =
      error?.response?.status === 403 &&
      ["CSRF_TOKEN_MISSING", "CSRF_TOKEN_INVALID"].includes(
        error?.response?.data?.errorCode,
      );
    if (!shouldRetryCsrf) throw error;

    resetBrowserCsrfToken();
    return request();
  }
};

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

const shouldForceLogoutForError = (response, requestUrl, isPublicRequest) => {
  if (isPublicRequest) return false;

  const errorCode = response?.data?.errorCode;
  const status = response?.status;
  const normalizedPath = normalizeRequestPath(requestUrl);

  if (errorCode === "USER_NOT_FOUND") return true;
  if (errorCode === "TOKEN_EXPIRED") return true;
  if (errorCode === "INVALID_TOKEN") return true;
  if (errorCode === "ACCOUNT_BANNED") return true;
  if (errorCode === "ACCOUNT_INACTIVE") return true;
  if (status === 401) return true;

  if (status === 403 && normalizedPath.startsWith("/business")) {
    return ["BUSINESS_TERMINATED"].includes(errorCode);
  }

  return false;
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

let permissionSyncPromise = null;

const syncCurrentUserPermissions = () => {
  if (permissionSyncPromise) return permissionSyncPromise;

  permissionSyncPromise = api
    .get("/auth/me", {
      skipPermissionToast: true,
      skipAuthRedirect: true,
    })
    .then((response) => {
      const freshUser = response?.data || response;
      if (freshUser?.id) {
        useAuthStore.getState().setUser(freshUser);
      }
      return freshUser;
    })
    .finally(() => {
      permissionSyncPromise = null;
    });

  return permissionSyncPromise;
};

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (isRefreshRequest(config.url) && !config.headers["X-CSRF-Token"]) {
    config.headers["X-CSRF-Token"] = await ensureBrowserCsrfToken();
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
      isRefresh &&
      response?.status === 403 &&
      ["CSRF_TOKEN_MISSING", "CSRF_TOKEN_INVALID"].includes(
        response?.data?.errorCode,
      ) &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      resetBrowserCsrfToken();
      if (typeof originalRequest.headers?.delete === "function") {
        originalRequest.headers.delete("X-CSRF-Token");
      }
      if (originalRequest.headers) {
        delete originalRequest.headers["X-CSRF-Token"];
      }
      return api(originalRequest);
    }

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

      originalRequest._retry = true;

      isRefreshing = true;

      try {
        const refreshResponse = await requestBrowserRefresh();

        if (refreshResponse.data.success) {
          const {
            accessToken: newAccessToken,
            user: refreshedUser,
          } = refreshResponse.data.data || {};

          if (useAuthStore.getState().isLoggingOut) {
            throw new Error("Logout in progress");
          }

          if (!newAccessToken) {
            throw new Error("Missing refreshed token");
          }

          useAuthStore.getState().setSession({
            user: refreshedUser,
            accessToken: newAccessToken,
          });
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
        failedQueue = [];
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
      const normalizedPath = normalizeRequestPath(requestUrl);

      // Owner-side staff changes invalidate server cache immediately. Refresh
      // the persisted user once so the UI and the retried request use the same
      // permission snapshot without forcing a logout or a manual reload.
      if (
        errorCode === "FORBIDDEN" &&
        normalizedPath !== "/auth/me" &&
        !originalRequest._permissionSynced
      ) {
        originalRequest._permissionSynced = true;
        try {
          await syncCurrentUserPermissions();
          return api(originalRequest);
        } catch {
          // Continue through the normal forbidden response below.
        }
      }

      // If the 403 is from a permission/auth endpoint itself, force logout to avoid infinite loops
      const isPermissionEndpoint =
        normalizedPath.includes("/permissions") ||
        errorCode === "FORBIDDEN_USER" ||
        errorCode === "FORBIDDEN_SYSTEM_ROLE";

      if (isPermissionEndpoint) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      const isDomainGateError = [
        ...BUSINESS_GATE_ERROR_CODES,
        "EMAIL_NOT_VERIFIED",
        "ACCOUNT_INACTIVE",
      ].includes(errorCode);

      if (
        !isDomainGateError &&
        !originalRequest?.skipPermissionToast &&
        !originalRequest?._403Shown
      ) {
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
      hasAccessToken &&
      shouldForceLogoutForError(response, requestUrl, isPublicRequest) &&
      !isLogoutInProgress &&
      !skipAuthRedirect
    ) {
      clearAuthAndRedirect();
    }

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
