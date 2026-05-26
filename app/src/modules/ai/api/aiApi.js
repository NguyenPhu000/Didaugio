import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";
import { AI_REQUEST_TIMEOUT } from "../../../constants/api";

const aiTripRequestConfig = { timeout: AI_REQUEST_TIMEOUT };

export const generateTripApi = (preferences) =>
  client.post(ENDPOINTS.profile.generateTrip, preferences, aiTripRequestConfig);

export const generateTripPreviewApi = (preferences) =>
  client.post(
    ENDPOINTS.profile.generateTrip,
    { ...preferences, previewOnly: true },
    aiTripRequestConfig,
  );

export const confirmGeneratedTripApi = (preferences) =>
  client.post(
    ENDPOINTS.profile.generateTrip,
    { ...preferences, previewOnly: false },
    aiTripRequestConfig,
  );

export const getMyTripsApi = (params) =>
  client.get(ENDPOINTS.profile.trips, { params });
