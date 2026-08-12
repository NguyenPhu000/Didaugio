import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import {
  getTripDetailApi,
  updateTripApi,
  addDestinationApi,
  removeDestinationApi,
  reorderTripStopsApi,
  updateDestinationApi,
  moveTripStopApi,
} from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { TRIP_OFFLINE_GC_MS } from "../../../constants/trip-offline-cache";
import { OFFLINE_STORAGE_KEYS } from "../../../constants/storage";
import { getTripCacheDestinations, mapTripCacheValue } from "../utils/tripCache";

const getDestinationClientId = (dest) => dest?.stopId ?? dest?.id;

const isNetworkError = (error) =>
  !(error?.status || error?.response?.status) &&
  (error?.message === "Network Error" || error?.code === "ERR_NETWORK" || !error?.response);

async function queueOfflineTripUpdate(tripId, data) {
  const storageKey = OFFLINE_STORAGE_KEYS.PENDING_TRIP_ACTIONS;
  const raw = await safeAsyncStorage.getItem(storageKey);
  const actions = raw ? JSON.parse(raw) : [];
  const nextActions = Array.isArray(actions) ? actions : [];
  nextActions.push({
    id: `trip-update-${Date.now()}`,
    type: "UPDATE_TRIP",
    data: { tripId, data },
    createdAt: Date.now(),
  });
  await safeAsyncStorage.setItem(storageKey, JSON.stringify(nextActions));
}

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
    mutationFn: async (data) => {
      try {
        return await updateTripApi(id, data);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        await queueOfflineTripUpdate(id, data);
        return { pending: true };
      }
    },
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
        return mapTripCacheValue(old, (trip) => ({
          ...trip,
          destinations: getTripCacheDestinations(trip).filter(
            (dest) => String(dest.id) !== String(destId),
          ),
        }));
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
    mutationFn: ({ dayNumber, orderedIds }) => {
      const updates = orderedIds.map((stopId, index) => ({
        stopId,
        dayNumber,
        sequence: index + 1,
      }));
      return reorderTripStopsApi(tripId, updates);
    },
    onMutate: async ({ dayNumber, orderedIds }) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);
      await queryClient.cancelQueries({ queryKey });
      const previousTrip = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        return mapTripCacheValue(old, (trip) => {
          const destinations = getTripCacheDestinations(trip);
          const dayDests = destinations.filter((d) => d.dayNumber === dayNumber);
          const otherDests = destinations.filter((d) => d.dayNumber !== dayNumber);
          const reordered = orderedIds
            .map((id) => dayDests.find((d) => String(getDestinationClientId(d)) === String(id)))
            .filter(Boolean);
          return { ...trip, destinations: [...otherDests, ...reordered] };
        });
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
        return mapTripCacheValue(old, (trip) => ({
          ...trip,
          destinations: getTripCacheDestinations(trip).map((d) =>
            String(d.id) === String(destId) ? { ...d, ...data } : d,
          ),
        }));
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
    mutationFn: ({ destId, newDayNumber, newOrder, startTime, endTime, note }) =>
      moveTripStopApi(tripId, destId, {
        newDayNumber,
        newOrder,
        startTime,
        endTime,
        note,
      }),
    onMutate: async ({ destId, newDayNumber, newOrder }) => {
      const queryKey = QUERY_KEYS.trips.detail(tripId);
      await queryClient.cancelQueries({ queryKey });
      const previousTrip = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => {
        return mapTripCacheValue(old, (trip) => {
          const destinations = getTripCacheDestinations(trip);
          const dest = destinations.find((d) => String(getDestinationClientId(d)) === String(destId));
          if (!dest) return trip;
          const filtered = destinations.filter((d) => String(getDestinationClientId(d)) !== String(destId));
          const moved = { ...dest, dayNumber: newDayNumber, order: newOrder };
          return { ...trip, destinations: [...filtered, moved] };
        });
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
