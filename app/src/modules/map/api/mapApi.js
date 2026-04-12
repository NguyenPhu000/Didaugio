import { ENDPOINTS } from "../../../api/endpoints";
import { PLACE_STATUS } from "../../../constants/preferences";
import { getPublicWithFallback } from "../../../api/publicClient";

export const getHomeApi = (params) =>
  getPublicWithFallback(ENDPOINTS.places.home, { params });

export const getMapPlacesApi = ({ limit = 500, sortBy = "newest" } = {}) =>
  getPublicWithFallback(ENDPOINTS.places.list, {
    params: { status: PLACE_STATUS.APPROVED, limit, sortBy },
  });

export const getDistrictsGeoJSON = () =>
  getPublicWithFallback(ENDPOINTS.boundaries.districts);

export const getWardsGeoJSON = () =>
  getPublicWithFallback(ENDPOINTS.boundaries.wards);
