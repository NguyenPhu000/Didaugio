import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyTripsApi, createTripApi, deleteTripApi } from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";

export function useTrips(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.list(),
    queryFn: () => getMyTripsApi(),
    enabled,
    select: (res) => res?.data || [],
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTripApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTripApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() }),
  });
}
