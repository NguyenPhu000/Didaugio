import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Home data: categories + featured places (public) */
export const getHomeApi = (params) =>
  client.get(ENDPOINTS.app.home, { params });

/** Paginated place search — supports search, categoryId, districtId, page, limit */
export const searchPlacesApi = (params) =>
  client.get(ENDPOINTS.app.places, { params });

/** Services list — used in explore filter setup */
export const getServicesApi = () => client.get(ENDPOINTS.app.services);
