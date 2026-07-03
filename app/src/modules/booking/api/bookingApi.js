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

export const linkBookingToTripApi = (
  bookingId,
  tripId,
  data = {},
) =>
  client.post(
    ENDPOINTS.profile.linkBookingToTrip(tripId, bookingId),
    data,
  );

export async function cancelBookingApi(bookingId, { cancelReason } = {}) {
  const id = Number(bookingId);
  if (!id || id <= 0) throw new Error("bookingId không hợp lệ");
  return client.put(ENDPOINTS.profile.bookingCancel(id), { cancelReason });
}

export const createBookingApi = (data) => {
  const serviceId = Number(data?.serviceId);
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    const err = new Error("Missing or invalid serviceId to create booking");
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const payload = {
    ...data,
  };
  delete payload.serviceId;

  return client.post(ENDPOINTS.booking.createByService(serviceId), payload);
};
