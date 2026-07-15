import { ENDPOINTS } from "../../../api/endpoints";
import { getPublicWithFallback } from "../../../api/publicClient";
import { isValidMapViewport } from "../utils/mapViewportValidation";

export const getHomeApi = (params) =>
  getPublicWithFallback(ENDPOINTS.places.home, { params });

export const getMapPlacesApi = (viewport, signal) => {
  if (!isValidMapViewport(viewport)) {
    return Promise.resolve([]);
  }

  return getPublicWithFallback(ENDPOINTS.places.v2Map, {
    params: { ...viewport, limit: 200 },
    signal,
  });
};

export const getDistrictsGeoJSON = () =>
  getPublicWithFallback(ENDPOINTS.boundaries.districts);

export const getWardsGeoJSON = () =>
  getPublicWithFallback(ENDPOINTS.boundaries.wards);
