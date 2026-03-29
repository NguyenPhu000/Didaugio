import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getPlaceServicesApi = (placeId) =>
  client.get(ENDPOINTS.places.services, { params: { placeId } });

export const createBookingApi = (data) =>
  client.post(ENDPOINTS.booking.create, data);
