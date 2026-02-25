import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Generate and save AI trip itinerary (POST /app/me/trips/generate) */
export const generateTripApi = (preferences) =>
  client.post(ENDPOINTS.app.generateTrip, preferences);

/** Get user's saved trips */
export const getMyTripsApi = (params) =>
  client.get(ENDPOINTS.app.myTrips, { params });
