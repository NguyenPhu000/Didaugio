import api from "@/constants/api";

export const dashboardService = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },

  getTimeline: async () => {
    const response = await api.get("/dashboard/timeline");
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get("/dashboard/health");
    return response.data;
  },
};

export default dashboardService;
