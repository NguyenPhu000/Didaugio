import { ENDPOINTS } from "../../../api/endpoints";
import { getPublicWithFallback } from "../../../api/publicClient";

export const getHomeApi = (params, config = {}) =>
  getPublicWithFallback(ENDPOINTS.places.home, {
    ...config,
    params: { ...params, client: "mobile" },
  });

export const searchPlacesApi = (params, config = {}) =>
  getPublicWithFallback(ENDPOINTS.places.list, {
    ...config,
    params: { ...params, client: "mobile" },
  });

export const getServicesApi = () =>
  getPublicWithFallback(ENDPOINTS.places.services);
