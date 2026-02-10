import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL, TIMEOUT } from "../../constants/api";

// Create Axios instance
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor
client.interceptors.request.use(
  async (config) => {
    // Mobile-specific headers
    config.headers["x-platform"] = Platform.OS;
    config.headers["x-app-version"] = "1.0.0";

    // Note: We'll inject the token from Zustand store in the actual API calls
    // or use a separate helper to get the token if needed here.
    // For now, let's assume the token is passed in headers or managed via store.
    
    // In a real app with Zustand, we might do:
    // const token = useAuthStore.getState().accessToken;
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: "Không có kết nối mạng. Vui lòng kiểm tra lại.",
        code: "NETWORK_ERROR",
      });
    }

    // Handle 401 Unauthorized (Token refresh logic would go here)
    if (error.response.status === 401 && !originalRequest._retry) {
      // TODO: Implement token refresh logic
    }

    // Format error response
    const errorMessage =
      error.response.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
    
    return Promise.reject({
      message: errorMessage,
      code: error.response.data?.errorCode || "UNKNOWN_ERROR",
      status: error.response.status,
      data: error.response.data,
    });
  }
);

export default client;
