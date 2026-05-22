import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTripDetailApi,
  updateTripApi,
  addDestinationApi,
  removeDestinationApi,
  reorderDestinationsApi,
  updateDestinationApi,
  moveDestinationApi,
} from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { TRIP_OFFLINE_GC_MS } from "../../../constants/trip-offline-cache";

export function useTripDetail(id) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.detail(id),
    queryFn: () => getTripDetailApi(id),
    enabled: !!id,
    select: (res) => res?.data || null,
    staleTime: 2 * 60 * 1000,
    gcTime: TRIP_OFFLINE_GC_MS,
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.trips.detail(tripId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
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
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            destinations: (old.data.destinations || []).filter(
              (dest) => String(dest.id) !== String(destId),
            ),
          },
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

/**
 * Reorder destinations within a day with optimistic update.
 * Destinations are immediately reordered in UI while the API call runs.
 * On error, the previous state is restored.
 */
export function useReorderDestinations(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dayNumber, orderedIds }) => reorderDestinationsApi(tripId, { dayNumber, orderedIds }),
    onMutate: async ({ dayNumber, orderedIds }) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);
      await queryClient.cancelQueries({ queryKey });
      const previousTrip = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.data) return old;
        const dayDests = (old.data.destinations || []).filter((d) => d.dayNumber === dayNumber);
        const otherDests = (old.data.destinations || []).filter((d) => d.dayNumber !== dayNumber);
        const reordered = orderedIds.map((id) => dayDests.find((d) => String(d.id) === String(id))).filter(Boolean);
        return { ...old, data: { ...old.data, destinations: [...otherDests, ...reordered] } };
      });
      return { previousTrip };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrip) {
        queryClient.setQueryData(QUERY_KEYS.trips.detail(tripId), context.previousTrip);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

/**
 * Update a destination's data with optimistic update.
 * The destination is immediately updated in UI while the API call runs.
 * On error, the previous state is restored.
 */
export function useUpdateDestination(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ destId, data }) => updateDestinationApi(tripId, destId, data),
    onMutate: async ({ destId, data }) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);
      await queryClient.cancelQueries({ queryKey });
      const previousTrip = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            destinations: (old.data.destinations || []).map((d) =>
              String(d.id) === String(destId) ? { ...d, ...data } : d,
            ),
          },
        };
      });
      return { previousTrip };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrip) {
        queryClient.setQueryData(QUERY_KEYS.trips.detail(tripId), context.previousTrip);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

/**
 * Move a destination to a different day with optimistic update.
 * The destination is immediately moved in UI while the API call runs.
 * On error, the previous state is restored.
 */
export function useMoveDestination(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ destId, newDayNumber, newOrder }) => moveDestinationApi(tripId, destId, { newDayNumber, newOrder }),
    onMutate: async ({ destId, newDayNumber, newOrder }) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);
      await queryClient.cancelQueries({ queryKey });
      const previousTrip = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.data) return old;
        const dest = (old.data.destinations || []).find((d) => String(d.id) === String(destId));
        if (!dest) return old;
        const filtered = (old.data.destinations || []).filter((d) => String(d.id) !== String(destId));
        const moved = { ...dest, dayNumber: newDayNumber, order: newOrder };
        return { ...old, data: { ...old.data, destinations: [...filtered, moved] } };
      });
      return { previousTrip };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrip) {
        queryClient.setQueryData(QUERY_KEYS.trips.detail(tripId), context.previousTrip);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}
