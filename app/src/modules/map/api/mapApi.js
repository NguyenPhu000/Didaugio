import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Home data: categories + featuredPlaces + banners */
export const getHomeApi = (params) =>
  client.get(ENDPOINTS.app.home, { params });
