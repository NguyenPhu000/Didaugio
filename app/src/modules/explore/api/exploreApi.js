import { ENDPOINTS } from "../../../api/endpoints";
import { getPublicWithFallback } from "../../../api/publicClient";

export const getHomeApi = (params) =>
  getPublicWithFallback(ENDPOINTS.places.home, { params });

export const searchPlacesApi = (params) =>
  getPublicWithFallback(ENDPOINTS.places.list, { params });

export const getServicesApi = () =>
  getPublicWithFallback(ENDPOINTS.places.services);
