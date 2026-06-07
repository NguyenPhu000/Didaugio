import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const getPlaceServicesApi = (placeId) =>
  client.get(ENDPOINTS.places.services, { params: { placeId } });

export const getMyBookingsApi = (params = {}) =>
  client.get(ENDPOINTS.profile.bookings, { params });

export const getMyBookingDetailApi = (bookingId) =>
  client.get(ENDPOINTS.profile.bookingDetail(bookingId));

export const getMyBookingQRApi = (bookingId) =>
  client.get(ENDPOINTS.profile.bookingQr(bookingId));

export const linkMyBookingToTripApi = (bookingId, tripId) =>
  client.post(ENDPOINTS.profile.bookingLinkTrip(bookingId), { tripId });

export const createBookingApi = (data) => {
  const serviceId = Number(data?.serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    throw {
      message: "Missing or invalid serviceId to create booking",
      status: 400,
      code: "VALIDATION_ERROR",
    };
  }

  const payload = {
    ...data,
  };
  delete payload.serviceId;

  return client.post(ENDPOINTS.booking.createByService(serviceId), payload);
};
