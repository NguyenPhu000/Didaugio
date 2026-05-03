import { useCallback } from "react";
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

/**
 * Remove a destination from a trip with optimistic update.
 * The destination is immediately removed from UI while the API call runs.
 * On error, the previous state is restored.
 */
export function useRemoveDestination(tripId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (destId) => removeDestinationApi(tripId, destId),

    onMutate: async (destId) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);

      await queryClient.cancelQueries({ queryKey });

      const previousTrip = queryClient.getQueryData(queryKey);

      // Optimistically remove the destination
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          destinations: (old.destinations || []).filter(
            (dest) => dest.id !== destId,
          ),
        };
      });

      return { previousTrip };
    },

    onError: (_err, _destId, context) => {
      // Restore on failure
      if (context?.previousTrip) {
        queryClient.setQueryData(
          QUERY_KEYS.trips.detail(tripId),
          context.previousTrip,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(tripId) });
    },
  });
}
