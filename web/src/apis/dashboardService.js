import api from "@/constants/api";

export const dashboardService = {
  getStats: () => api.get("/dashboard/stats"),
  getTimeline: (params) => api.get("/dashboard/timeline", { params }),
  getHealth: () => api.get("/dashboard/health"),
  getOnlineUsers: () => api.get("/dashboard/online-users"),
};

export default dashboardService;
