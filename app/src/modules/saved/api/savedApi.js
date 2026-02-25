import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Get saved places for authenticated user */
export const getSavedPlacesApi = (params) =>
  client.get(ENDPOINTS.app.mySavedPlaces, { params });

/** Add a place to saved list */
export const savePlaceApi = (placeId, note = null) =>
  client.post(ENDPOINTS.app.mySavedPlaceById(placeId), { note });

/** Remove a place from saved list */
export const unsavePlaceApi = (placeId) =>
  client.delete(ENDPOINTS.app.mySavedPlaceById(placeId));
