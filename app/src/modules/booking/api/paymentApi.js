import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const checkoutApi = (data) =>
  client.post(ENDPOINTS.payments.checkout, data);

export const getPaymentStatusApi = (paymentId) =>
  client.get(ENDPOINTS.payments.detail(paymentId));

export const getPaymentByBookingApi = (bookingId) =>
  client.get(ENDPOINTS.payments.byBooking(bookingId));
