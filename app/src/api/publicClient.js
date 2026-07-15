import axios, { isCancel } from "axios";
import { API_BASE_CANDIDATES, REQUEST_TIMEOUT } from "../constants/api";

const buildPublicError = (error) => ({
  message:
    error?.response?.data?.message ||
    error?.message ||
    "Không thể tải dữ liệu công khai từ hệ thống.",
  status: error?.response?.status,
  code: error?.response?.data?.errorCode || "PUBLIC_REQUEST_FAILED",
  attemptedBases: API_BASE_CANDIDATES,
  raw: error,
});

export async function getPublicWithFallback(endpoint, config = {}) {
  let lastError = null;

  for (const baseURL of API_BASE_CANDIDATES) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        ...config,
      });
      return response.data;
    } catch (error) {
      if (isCancel(error) || error?.code === "ERR_CANCELED") {
        throw error;
      }
      lastError = error;
    }
  }

  throw buildPublicError(lastError);
}
