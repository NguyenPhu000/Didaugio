import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTripDetailApi,
  updateTripApi,
  addDestinationApi,
  removeDestinationApi,
} from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";

export function useTripDetail(id) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.detail(id),
    queryFn: () => getTripDetailApi(id),
    enabled: !!id,
    select: (res) => res?.data || null,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateTrip(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateTripApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

export function useAddDestination(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => addDestinationApi(tripId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.trips.detail(tripId),
      }),
  });
}

export function useRemoveDestination(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (destId) => removeDestinationApi(tripId, destId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.trips.detail(tripId),
      }),
  });
}
