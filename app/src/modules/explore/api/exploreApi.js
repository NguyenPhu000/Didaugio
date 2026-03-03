import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getHomeApi = (params) =>
  client.get(ENDPOINTS.places.home, { params });

export const searchPlacesApi = (params) =>
  client.get(ENDPOINTS.places.list, { params });

export const getServicesApi = () =>
  client.get(ENDPOINTS.places.services);
