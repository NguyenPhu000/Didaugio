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

export default {
  getSettings,
  updateSettings,
};
