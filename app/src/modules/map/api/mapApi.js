import { ENDPOINTS } from "../../../api/endpoints";
import { getPublicWithFallback } from "../../../api/publicClient";
import { isValidMapViewport } from "../utils/mapViewportValidation";

export const getHomeApi = (params, config = {}) =>
  getPublicWithFallback(ENDPOINTS.places.home, { ...config, params });

export const getMapPlacesApi = (viewport, signal) => {
  if (!isValidMapViewport(viewport)) {
    return Promise.resolve([]);
  }

  return getPublicWithFallback(ENDPOINTS.places.v2Map, {
    params: { ...viewport, limit: 200 },
    signal,
  });
};

export const getDistrictsGeoJSON = (config = {}) =>
  getPublicWithFallback(ENDPOINTS.boundaries.districts, config);

export const getWardsGeoJSON = (config = {}) =>
  getPublicWithFallback(ENDPOINTS.boundaries.wards, config);
