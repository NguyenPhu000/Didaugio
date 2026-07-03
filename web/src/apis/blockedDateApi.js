import api from "@/constants/api";

const BASE_URL = "/business/blocked-dates";

export const blockedDateApi = {
  getAll: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response;
  },

  create: async (data) => {
    const response = await api.post(BASE_URL, data);
    return response;
  },

  remove: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response;
  },
};
