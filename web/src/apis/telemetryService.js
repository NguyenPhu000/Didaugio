import api from "@/constants/api";

const sanitizeParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

const telemetryService = {
  trackPlace: (placeId, payload) =>
    api.post(`/telemetry/places/${placeId}`, payload),
  getBusinessHeatmap: (params = {}) =>
    api.get("/telemetry/business/heatmap", { params: sanitizeParams(params) }),
  getAdminHeatmap: (params = {}) =>
    api.get("/telemetry/admin/heatmap", { params: sanitizeParams(params) }),
};

export default telemetryService;
