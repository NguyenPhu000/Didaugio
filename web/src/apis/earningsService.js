import api from "@/constants/api";

const BASE_URL = "/business";

const earningsService = {
  getEarnings: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/earnings`, { params });
    return response;
  },

  getSummary: async () => {
    const response = await api.get(`${BASE_URL}/earnings/summary`);
    return response;
  },

  createPayoutRequest: async (data) => {
    const response = await api.post(`${BASE_URL}/payouts/request`, data);
    return response;
  },
};

export default earningsService;
