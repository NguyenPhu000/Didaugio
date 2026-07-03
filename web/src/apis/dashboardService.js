import api from "@/constants/api";

export const dashboardService = {
  getStats: () => api.get("/dashboard/stats"),
  getTimeline: () => api.get("/dashboard/timeline"),
  getHealth: () => api.get("/dashboard/health"),
  getOnlineUsers: () => api.get("/dashboard/online-users"),
};

export default dashboardService;
