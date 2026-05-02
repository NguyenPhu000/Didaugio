import React, { useEffect, useCallback, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import {
  getMyTripsApi,
  createTripApi,
  deleteTripApi,
} from "../api/tripsApi";

const TRIPS_CACHE_KEY = "@trips_cache";
const CACHE_VERSION = "v1";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (key) => `${CACHE_VERSION}:${key}`;

// ─── Storage Helpers ─────────────────────────────────────────────────────────────

export const persistTripsToStorage = async (trips) => {
  try {
    const cacheData = {
      data: trips,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    await AsyncStorage.setItem(
      getCacheKey(TRIPS_CACHE_KEY),
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.warn("[TripsOffline] Failed to persist trips:", error);
  }
};

export const loadTripsFromStorage = async () => {
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(TRIPS_CACHE_KEY));
    if (!raw) return null;

    const cacheData = JSON.parse(raw);

    // Check version
    if (cacheData.version !== CACHE_VERSION) {
      await clearTripsCache();
      return null;
    }

    // Check expiry
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      return { ...cacheData, expired: true };
    }

    return cacheData;
  } catch (error) {
    console.warn("[TripsOffline] Failed to load trips from storage:", error);
    return null;
  }
};

export const clearTripsCache = async () => {
  try {
    await AsyncStorage.removeItem(getCacheKey(TRIPS_CACHE_KEY));
  } catch (error) {
    console.warn("[TripsOffline] Failed to clear trips cache:", error);
  }
};

// ─── Network Status Hook ────────────────────────────────────────────────────────

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetValidationEnabled
        ? state.isInternetReachable !== false
        : connected;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
}

// ─── Cached Trips Hook ─────────────────────────────────────────────────────────

export function useTripsCached(enabled = true) {
  const queryClient = useQueryClient();
  const [isOffline, setIsOffline] = useState(false);
  const [cachedData, setCachedData] = useState(null);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    remove,
  } = useQuery({
    queryKey: ["trips", "cached"],
    queryFn: async () => {
      const response = await getMyTripsApi();
      const trips = response?.data || [];

      // Persist to storage
      await persistTripsToStorage(trips);

      return trips;
    },
    enabled: enabled && !isOffline,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Load from storage when offline
  useEffect(() => {
    if (isOffline && !data) {
      loadTripsFromStorage().then((cache) => {
        if (cache?.data) {
          setCachedData(cache.data);
        }
      });
    }
  }, [isOffline, data]);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const wasOffline = isOffline;

      setIsOffline(!connected);

      // If we just came back online, invalidate the query to refresh
      if (wasOffline && connected) {
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
      }
    });

    return () => unsubscribe();
  }, [queryClient, isOffline]);

  // Update storage when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      persistTripsToStorage(data);
    }
  }, [data]);

  return {
    data: isOffline ? (cachedData || []) : (data || []),
    isLoading: isLoading || (isOffline && !cachedData && isFetching),
    isError: isError && isOffline ? false : isError,
    isOffline,
    refetch,
    isStale: !isFetching && (Date.now() - (queryClient.getQueryData(["trips", "cached"]) ?._timestamp || 0) > CACHE_EXPIRY_MS),
  };
}

// ─── Trip Detail Cached Hook ────────────────────────────────────────────────────

export function useTripDetailCached(tripId, enabled = true) {
  const storageKey = `${TRIPS_CACHE_KEY}_detail_${tripId}`;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const tripsResponse = await getMyTripsApi();
      const trips = tripsResponse?.data || [];
      const trip = trips.find((t) => t.id === tripId || String(t.id) === String(tripId));

      if (trip) {
        await AsyncStorage.setItem(
          getCacheKey(storageKey),
          JSON.stringify({
            data: trip,
            timestamp: Date.now(),
            version: CACHE_VERSION,
          })
        );
      }

      return trip;
    },
    enabled: enabled && !!tripId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
}

// ─── Create Trip with Offline Support ───────────────────────────────────────────

export function useCreateTripCached() {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();

  return {
    mutate: async (tripData) => {
      if (!isConnected) {
        // Store pending action
        const pendingActions = await AsyncStorage.getItem("@pending_trip_actions");
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push({
          type: "CREATE_TRIP",
          data: tripData,
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(
          "@pending_trip_actions",
          JSON.stringify(actions)
        );
        return { success: true, pending: true };
      }

      try {
        const response = await createTripApi(tripData);
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
        return response;
      } catch (error) {
        // If fails, queue for retry
        const pendingActions = await AsyncStorage.getItem("@pending_trip_actions");
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push({
          type: "CREATE_TRIP",
          data: tripData,
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(
          "@pending_trip_actions",
          JSON.stringify(actions)
        );
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}

// ─── Delete Trip with Offline Support ───────────────────────────────────────────

export function useDeleteTripCached() {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();

  return {
    mutate: async (tripId) => {
      if (!isConnected) {
        const pendingActions = await AsyncStorage.getItem("@pending_trip_actions");
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push({
          type: "DELETE_TRIP",
          data: { id: tripId },
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(
          "@pending_trip_actions",
          JSON.stringify(actions)
        );
        // Optimistically remove from cache
        queryClient.setQueryData(["trips", "cached"], (old) =>
          (old || []).filter((t) => t.id !== tripId && String(t.id) !== String(tripId))
        );
        return { success: true, pending: true };
      }

      try {
        const response = await deleteTripApi(tripId);
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
        return response;
      } catch (error) {
        const pendingActions = await AsyncStorage.getItem("@pending_trip_actions");
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push({
          type: "DELETE_TRIP",
          data: { id: tripId },
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(
          "@pending_trip_actions",
          JSON.stringify(actions)
        );
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}
