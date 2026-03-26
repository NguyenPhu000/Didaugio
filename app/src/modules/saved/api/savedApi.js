import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getSavedPlacesApi = (params) =>
  client.get(ENDPOINTS.profile.savedPlaces, { params });

export const savePlaceApi = (placeId, note = null) =>
  client.post(ENDPOINTS.profile.savedPlaceById(placeId), { note });

export const unsavePlaceApi = (placeId) =>
  client.delete(ENDPOINTS.profile.savedPlaceById(placeId));
