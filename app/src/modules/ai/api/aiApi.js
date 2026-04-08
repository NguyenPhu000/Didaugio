import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const generateTripApi = (preferences) =>
  client.post(ENDPOINTS.profile.generateTrip, preferences);

export const generateTripPreviewApi = (preferences) =>
  client.post(ENDPOINTS.profile.generateTrip, {
    ...preferences,
    previewOnly: true,
  });

export const confirmGeneratedTripApi = (preferences) =>
  client.post(ENDPOINTS.profile.generateTrip, {
    ...preferences,
    previewOnly: false,
  });

export const getMyTripsApi = (params) =>
  client.get(ENDPOINTS.profile.trips, { params });
