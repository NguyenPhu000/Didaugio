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

export const reorderDestinationsApi = (tripId, data) =>
  client.patch(ENDPOINTS.profile.reorderDestinations(tripId), data);

export const linkBookingToTripApi = (tripId, bookingId, data = {}) =>
  client.post(ENDPOINTS.profile.linkBookingToTrip(tripId, bookingId), data);

export const reorderTripStopsApi = (tripId, updates) =>
  client.patch(ENDPOINTS.profile.reorderTripStops(tripId), { updates });

export const updateDestinationApi = (tripId, destId, data) =>
  client.patch(ENDPOINTS.profile.updateDestination(tripId, destId), data);

export const moveDestinationApi = (tripId, destId, data) =>
  client.patch(ENDPOINTS.profile.moveDestination(tripId, destId), data);

export const saveTripApi = (tripId) =>
  client.post(ENDPOINTS.profile.savedTripById(tripId));

export const unsaveTripApi = (tripId) =>
  client.delete(ENDPOINTS.profile.savedTripById(tripId));

export const getSavedTripsApi = () =>
  client.get(ENDPOINTS.profile.savedTrips);

// ─── Trip Share ──────────────────────────────────────────────────────────────

export const createTripShareApi = (tripId, data) =>
  client.post(ENDPOINTS.profile.tripShare(tripId), data);

export const getTripSharesApi = (tripId) =>
  client.get(ENDPOINTS.profile.tripShare(tripId));

export const deleteTripShareApi = (tripId, shareId) =>
  client.delete(ENDPOINTS.profile.tripShareById(tripId, shareId));

export const accessTripShareApi = (shareCode, data) =>
  client.post(ENDPOINTS.profile.accessTripShare(shareCode), data);

// ─── Trip Duplicate ──────────────────────────────────────────────────────────

export const duplicateTripApi = (tripId) =>
  client.post(ENDPOINTS.profile.duplicateTrip(tripId));
