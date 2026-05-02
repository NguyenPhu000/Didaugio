import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getSavedPlacesApi = (params) =>
  client.get(ENDPOINTS.profile.savedPlaces, { params });

export const getSavedCollectionsApi = () =>
  client.get(ENDPOINTS.profile.savedCollections);

export const savePlaceApi = (placeId, note = null, collectionName = undefined) => {
  const payload = { note };
  if (collectionName !== undefined) payload.collectionName = collectionName;
  return client.post(ENDPOINTS.profile.savedPlaceById(placeId), payload);
};

export const unsavePlaceApi = (placeId) =>
  client.delete(ENDPOINTS.profile.savedPlaceById(placeId));

export const renameSavedCollectionApi = ({ fromName, toName }) =>
  client.patch(ENDPOINTS.profile.savedCollectionByName(fromName), {
    name: toName,
  });

export const deleteSavedCollectionApi = (name) =>
  client.delete(ENDPOINTS.profile.savedCollectionByName(name));
