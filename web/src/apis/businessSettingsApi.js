import api from "@/constants/api";

const BASE_URL = "/business/settings";

export const businessSettingsApi = {
  getSettings: async () => {
    const response = await api.get(BASE_URL);
    return response;
  },

  updateSettings: async (data) => {
    const response = await api.put(BASE_URL, data);
    return response;
  },
};
