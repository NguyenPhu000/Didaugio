import api from "@/constants/api";

export const dashboardService = {
  /** Trả về `{ success, data, message }` (axios đã unwrap response.data một lần). */
  getStats: () => api.get("/dashboard/stats"),

  getTimeline: () => api.get("/dashboard/timeline"),

  getHealth: () => api.get("/dashboard/health"),
};

export default dashboardService;
