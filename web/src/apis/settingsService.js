import api from "@/constants/api";

const BASE_URL = "/settings";

export const getSettings = async () => {
  const response = await api.get(BASE_URL);
  return response;
};

export const updateSettings = async (payload) => {
  const response = await api.put(BASE_URL, payload);
  return response;
};

export const getFeatureFlags = async () => {
  const response = await api.get(`${BASE_URL}/feature-flags`);
  return response;
};

export const updateFeatureFlag = async (key, enabled) => {
  const response = await api.put(`${BASE_URL}/feature-flags/${key}`, {
    enabled,
  });
  return response;
};

export const getSystemLogs = async (params = {}) => {
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
  const response = await api.get(`${BASE_URL}/logs`, { params: cleanParams });
  return response;
};

export const getSystemHealth = async () => {
  const response = await api.get(`${BASE_URL}/health`);
  return response;
};

export default {
  getSettings,
  updateSettings,
  getFeatureFlags,
  updateFeatureFlag,
  getSystemLogs,
  getSystemHealth,
};
