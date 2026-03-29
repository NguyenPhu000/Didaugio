import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaceServicesApi, createBookingApi } from "../api/bookingApi";
import { QUERY_KEYS } from "../../../constants/query-keys";

export function usePlaceServices(placeId) {
  return useQuery({
    queryKey: ["place-services", placeId],
    queryFn: () => getPlaceServicesApi(placeId),
    enabled: !!placeId,
    select: (res) => res?.data || [],
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBookingApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings.all() }),
  });
}
