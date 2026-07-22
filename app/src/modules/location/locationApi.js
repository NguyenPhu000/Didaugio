import { getPublicWithFallback } from "../../api/publicClient";

const unpack = (payload) => ({
  data: Array.isArray(payload?.data) ? payload.data : [],
  datasetReleaseId: payload?.meta?.datasetReleaseId ?? null,
  releaseName: payload?.meta?.releaseName ?? null,
});

export const getProvinces = async ({ signal } = {}) =>
  unpack(await getPublicWithFallback("/v2/locations/provinces", { signal }));

export const getWards = async (provinceCode, { signal } = {}) => {
  if (!provinceCode) return { data: [], datasetReleaseId: null, releaseName: null };
  return unpack(
    await getPublicWithFallback(
      `/v2/locations/provinces/${encodeURIComponent(provinceCode)}/wards`,
      { signal },
    ),
  );
};

export const searchLocations = async ({ provinceCode, query, signal }) => {
  if (!provinceCode || !String(query || "").trim()) {
    return { data: [], datasetReleaseId: null, releaseName: null };
  }
  return unpack(
    await getPublicWithFallback("/v2/locations/search", {
      signal,
      params: { provinceCode, q: String(query).trim() },
    }),
  );
};
