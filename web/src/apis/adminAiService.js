import api from "@/constants/api";

const BASE = "/v1/admin/ai";

export const adminAiService = {
  getOverview: () => api.get(`${BASE}/overview`),
  getConfig: () => api.get(`${BASE}/config`),
  saveDraft: (payload) => api.put(`${BASE}/config/draft`, payload),
  testConfig: (payload) => api.post(`${BASE}/config/test`, payload),
  publishConfig: (payload) => api.post(`${BASE}/config/publish`, payload),
  rollbackConfig: (payload) => api.post(`${BASE}/config/rollback`, payload),
  updateKillSwitch: (payload) => api.put(`${BASE}/kill-switch`, payload),
  getLogs: (params) => api.get(`${BASE}/logs`, { params }),
};

export default adminAiService;
