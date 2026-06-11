import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlaceServicesApi,
  createBookingApi,
  getMyBookingsApi,
  getMyBookingDetailApi,
  getMyBookingQRApi,
  linkMyBookingToTripApi,
  cancelBookingApi,
} from "../api/bookingApi";
import { QUERY_KEYS } from "../../../constants/query-keys";

const normalizePlaceId = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export function usePlaceServices(placeId) {
  const normalizedPlaceId = normalizePlaceId(placeId);

  return useQuery({
    queryKey: ["place-services", normalizedPlaceId],
    queryFn: () => getPlaceServicesApi(normalizedPlaceId),
    enabled: !!normalizedPlaceId,
    select: (res) => {
      const list = res?.data || [];
      if (!normalizedPlaceId) return [];
      return list.filter(
        (service) => Number(service?.place?.id) === normalizedPlaceId,
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBookingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

export function useMyBookings(filters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.bookings.list(), filters],
    queryFn: () => getMyBookingsApi(filters),
    select: (res) => {
      const raw = res?.data;
      return {
        data: Array.isArray(raw) ? raw : [],
        pagination: res?.pagination || null,
      };
    },
  });
}

export function useMyBookingDetail(bookingId) {
  const normalizedId = Number(bookingId);
  return useQuery({
    queryKey: QUERY_KEYS.bookings.detail(normalizedId),
    queryFn: () => getMyBookingDetailApi(normalizedId),
    enabled: Number.isInteger(normalizedId) && normalizedId > 0,
    select: (res) => res?.data || null,
  });
}

export function useMyBookingQR(bookingId, options = {}) {
  const normalizedId = Number(bookingId);
  const enabledByCaller = options?.enabled ?? true;

  return useQuery({
    queryKey: [...QUERY_KEYS.bookings.detail(normalizedId), "qr"],
    queryFn: () => getMyBookingQRApi(normalizedId),
    enabled:
      enabledByCaller && Number.isInteger(normalizedId) && normalizedId > 0,
    retry: 1,
    select: (res) => res?.data || null,
  });
}

export function useLinkBookingToTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, tripId }) =>
      linkMyBookingToTripApi(bookingId, tripId),
    onSuccess: (_, variables) => {
      const id = Number(variables?.bookingId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });

      if (Number.isInteger(id) && id > 0) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.bookings.detail(id),
        });
      }
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, cancelReason }) =>
      cancelBookingApi(bookingId, { cancelReason }),
    onSuccess: (_, variables) => {
      const id = Number(variables?.bookingId);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings.all() });

      if (Number.isInteger(id) && id > 0) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.bookings.detail(id),
        });
      }
    },
  });
}
