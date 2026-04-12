import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getMyTripsApi = (params) =>
  client.get(ENDPOINTS.profile.trips, { params });

export const getTripDetailApi = (id) =>
  client.get(ENDPOINTS.profile.tripDetail(id));

export const createTripApi = (data) =>
  client.post(ENDPOINTS.profile.createTrip, data);

export const updateTripApi = (id, data) =>
  client.patch(ENDPOINTS.profile.updateTrip(id), data);

export const deleteTripApi = (id) =>
  client.delete(ENDPOINTS.profile.deleteTrip(id));

export const addDestinationApi = (tripId, data) =>
  client.post(ENDPOINTS.profile.addDestination(tripId), data);

export const removeDestinationApi = (tripId, destId) =>
  client.delete(ENDPOINTS.profile.removeDestination(tripId, destId));
