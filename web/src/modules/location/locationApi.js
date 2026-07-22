import api from "@/constants/api";

const unpack = (payload) => ({
  data: Array.isArray(payload?.data) ? payload.data : [],
  datasetReleaseId: payload?.meta?.datasetReleaseId ?? null,
  releaseName: payload?.meta?.releaseName ?? null,
});

export const getProvinces = async () => unpack(await api.get("/v2/locations/provinces"));

export const getWards = async (provinceCode) => {
  if (!provinceCode) return { data: [], datasetReleaseId: null, releaseName: null };
  return unpack(
    await api.get(`/v2/locations/provinces/${encodeURIComponent(provinceCode)}/wards`),
  );
};

export const searchLocations = async ({ provinceCode, query }) => {
  if (!provinceCode || !String(query || "").trim()) {
    return { data: [], datasetReleaseId: null, releaseName: null };
  }
  return unpack(
    await api.get("/v2/locations/search", {
      params: { provinceCode, q: String(query).trim() },
    }),
  );
};
