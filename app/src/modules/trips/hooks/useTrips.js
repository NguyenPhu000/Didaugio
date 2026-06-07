import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyTripsApi,
  createTripApi,
  deleteTripApi,
  saveTripApi,
  unsaveTripApi,
  getSavedTripsApi,
  duplicateTripApi,
  createTripShareApi,
  getTripSharesApi,
  deleteTripShareApi,
} from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { TRIP_OFFLINE_GC_MS } from "../../../constants/trip-offline-cache";

export function useTrips(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.list(),
    queryFn: async () => {
      const response = await getMyTripsApi();
      return response?.data || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: TRIP_OFFLINE_GC_MS,
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

function setTripSavedFlag(qc, tripId, isSaved) {
  qc.setQueriesData({ queryKey: ["trips"] }, (old) => {
    if (!Array.isArray(old)) return old;
    return old.map((t) =>
      String(t.id) === String(tripId) ? { ...t, isSaved } : t,
    );
  });
  qc.setQueriesData({ queryKey: QUERY_KEYS.trips.detail(tripId) }, (old) => {
    if (!old) return old;
    return {
      ...old,
      isSaved,
      data: old.data ? { ...old.data, isSaved } : undefined,
    };
  });
}

export function useSaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId) => saveTripApi(tripId),
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.trips.all() });
      setTripSavedFlag(queryClient, tripId, true);
    },
    onError: (_err, tripId) => {
      setTripSavedFlag(queryClient, tripId, false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

export function useUnsaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId) => unsaveTripApi(tripId),
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.trips.all() });
      setTripSavedFlag(queryClient, tripId, false);
    },
    onError: (_err, tripId) => {
      setTripSavedFlag(queryClient, tripId, true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

export function useDuplicateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tripId) => duplicateTripApi(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
    },
  });
}

export function useTripShares(tripId) {
  return useQuery({
    queryKey: QUERY_KEYS.trips.shares(tripId),
    queryFn: () => getTripSharesApi(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTripShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, data }) => createTripShareApi(tripId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips", "shares"] });
    },
  });
}

export function useDeleteTripShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shareId }) => deleteTripShareApi(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.shares() });
    },
  });
}
