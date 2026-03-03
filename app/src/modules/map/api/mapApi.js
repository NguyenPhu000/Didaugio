import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getHomeApi = (params) =>
  client.get(ENDPOINTS.places.home, { params });

export const getDistrictsGeoJSON = () =>
  client.get(ENDPOINTS.boundaries.districts);

export const getWardsGeoJSON = () =>
  client.get(ENDPOINTS.boundaries.wards);
