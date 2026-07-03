/**
 * Business API - Profile, Admin, Dashboard
 * Base: /api/business
 * (Phân biệt với "Service layer" Backend — đây là file gọi HTTP API)
 */
import api from "@/constants/api";

const BASE_URL = "/business";

const sanitizeParams = (params = {}) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

const DOC_FILE_KEYS = ["idCardFront", "idCardBack", "businessLicense"];

const isBrowserFile = (value) =>
  typeof File !== "undefined" && value instanceof File;

/** Gửi multipart đúng với multer + Cloudinary phía server */
const appendBusinessMultipart = (formData, data) => {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (DOC_FILE_KEYS.includes(key)) {
      if (isBrowserFile(value)) formData.append(key, value);
      continue;
    }
    formData.append(key, value === "" ? "" : String(value));
  }
};

const formDataRequestConfig = {
  transformRequest: [
    (payload, headers) => {
      if (payload instanceof FormData) {
        delete headers["Content-Type"];
      }
      return payload;
    },
  ],
};

// Profile
export const getProfile = async () => {
  const response = await api.get(`${BASE_URL}/profile`);
  return response;
};

export const register = async (data) => {
  const formData = new FormData();
  appendBusinessMultipart(formData, data);
  const response = await api.post(
    `${BASE_URL}/register`,
    formData,
    formDataRequestConfig,
  );
  return response;
};

export const updateProfile = async (data) => {
  const hasNewDoc = DOC_FILE_KEYS.some((key) => isBrowserFile(data[key]));
  if (!hasNewDoc) {
    const response = await api.put(`${BASE_URL}/profile`, data);
    return response;
  }
  const formData = new FormData();
  appendBusinessMultipart(formData, data);
  const response = await api.put(
    `${BASE_URL}/profile`,
    formData,
    formDataRequestConfig,
  );
  return response;
};

export const contractSign = async (data = {}) => {
  const response = await api.put(`${BASE_URL}/profile/contract-sign`, data);
  return response;
};

export const sendContractOtp = async () => {
  const response = await api.post(`${BASE_URL}/profile/contract-otp`);
  return response;
};

export const downloadContract = async (businessId, params = {}) => {
  const response = await api.get(`${BASE_URL}/${businessId}/contract`, {
    params,
    responseType: "blob",
  });
  return response;
};

// Dashboard
export const getDashboard = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/dashboard`, {
    params: sanitizeParams(params),
  });
  return response;
};

// My Places (for service form dropdown)
export const getMyPlaces = async () => {
  const response = await api.get(`${BASE_URL}/places`);
  return response;
};

// Admin
export const getAll = async (params = {}) => {
  const response = await api.get(BASE_URL, { params: sanitizeParams(params) });
  return response;
};

export const getById = async (id) => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response;
};

export const approve = async (id, data = {}) => {
  const response = await api.put(`${BASE_URL}/${id}/approve`, data);
  return response;
};

export const reject = async (id, reason) => {
  const response = await api.put(`${BASE_URL}/${id}/reject`, {
    rejectionReason: reason,
  });
  return response;
};

export const suspend = async (id, suspensionReason) => {
  const response = await api.put(`${BASE_URL}/${id}/suspend`, {
    suspensionReason,
  });
  return response;
};

export const reactivate = async (id) => {
  const response = await api.put(`${BASE_URL}/${id}/reactivate`);
  return response;
};

export const terminate = async (id, terminationReason) => {
  const response = await api.put(`${BASE_URL}/${id}/terminate`, {
    terminationReason,
  });
  return response;
};

export const decryptProfile = async (data) => {
  const response = await api.post(`${BASE_URL}/profile/decrypt`, data);
  return response;
};

export default {
  getProfile,
  register,
  updateProfile,
  contractSign,
  sendContractOtp,
  downloadContract,
  getDashboard,
  getMyPlaces,
  getAll,
  getById,
  approve,
  reject,
  suspend,
  reactivate,
  terminate,
  decryptProfile,
};
