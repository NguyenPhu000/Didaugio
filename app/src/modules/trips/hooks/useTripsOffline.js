import React, { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { getMyTripsApi, createTripApi, deleteTripApi } from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";

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
      JSON.stringify(cacheData),
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

    if (cacheData.version !== CACHE_VERSION) {
      await clearTripsCache();
      return null;
    }

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

// ─── Network Status Hook (singleton — safe to call multiple times) ─────────────

const _netState = { isConnected: true, isInternetReachable: true };
const _netListeners = new Set();

function _notifyNetListeners() {
  _netListeners.forEach((cb) => cb(_netState));
}

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    _netState.isConnected = state.isConnected ?? true;
    _netState.isInternetReachable = state.isInternetValidationEnabled
      ? state.isInternetReachable !== false
      : _netState.isConnected;
    _notifyNetListeners();
  });
  return unsubscribe;
}, []);

export function useNetworkStatus() {
  const [net, setNet] = useState({ ..._netState });

  useEffect(() => {
    _netListeners.add(setNet);
    return () => {
      _netListeners.delete(setNet);
    };
  }, []);

  return net;
}

// ─── Cached Trips Hook ─────────────────────────────────────────────────────────

export function useTripsCached(enabled = true) {
  const queryClient = useQueryClient();
  const isOnlineRef = useRef(true);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedData, setCachedData] = useState(null);

  // Listen to shared network state
  useEffect(() => {
    _netListeners.add((state) => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = state.isConnected;

      setIsOffline(!state.isConnected);

      if (wasOffline && state.isConnected) {
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
      }
    });
  }, [queryClient]);

  const query = useQuery({
    queryKey: ["trips", "cached"],
    queryFn: async () => {
      const response = await getMyTripsApi();
      const trips = response?.data || [];
      await persistTripsToStorage(trips);
      return trips;
    },
    enabled: enabled && isOnlineRef.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Load cached data when offline
  useEffect(() => {
    if (!isOffline) return;
    if (query.data) {
      setCachedData(query.data);
      return;
    }
    loadTripsFromStorage().then((cache) => {
      if (cache?.data) setCachedData(cache.data);
    });
  }, [isOffline, query.data]);

  // Persist online data to storage
  useEffect(() => {
    if (query.data?.length > 0) {
      persistTripsToStorage(query.data);
    }
  }, [query.data]);

  return {
    data: isOffline ? cachedData || [] : query.data || [],
    isLoading:
      query.isLoading || (isOffline && !cachedData && query.isFetching),
    isError: isOffline ? false : query.isError,
    isOffline,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

// ─── Trip Detail Cached Hook ───────────────────────────────────────────────────

export function useTripDetailCached(tripId, enabled = true) {
  const storageKey = `${TRIPS_CACHE_KEY}_detail_${tripId}`;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const tripsResponse = await getMyTripsApi();
      const trips = tripsResponse?.data || [];
      const trip = trips.find(
        (t) => t.id === tripId || String(t.id) === String(tripId),
      );

      if (trip) {
        await AsyncStorage.setItem(
          getCacheKey(storageKey),
          JSON.stringify({
            data: trip,
            timestamp: Date.now(),
            version: CACHE_VERSION,
          }),
        );
      }

      return trip;
    },
    enabled: enabled && !!tripId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return { data, isLoading, isError, refetch };
}

// ─── Create Trip with Offline Support ─────────────────────────────────────────

export function useCreateTripCached() {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();

  return {
    mutateAsync: async (tripData) => {
      const pendingActionsKey = "@pending_trip_actions";

      const queuePending = async (type, data) => {
        const raw = await AsyncStorage.getItem(pendingActionsKey);
        const actions = raw ? JSON.parse(raw) : [];
        actions.push({ type, data, timestamp: Date.now() });
        await AsyncStorage.setItem(pendingActionsKey, JSON.stringify(actions));
      };

      if (!isConnected) {
        await queuePending("CREATE_TRIP", tripData);
        return { success: true, pending: true };
      }

      try {
        const response = await createTripApi(tripData);
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
        return response;
      } catch (error) {
        await queuePending("CREATE_TRIP", tripData);
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}

// ─── Delete Trip with Offline Support ─────────────────────────────────────────

export function useDeleteTripCached() {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();

  return {
    mutateAsync: async (tripId) => {
      const pendingActionsKey = "@pending_trip_actions";

      const queuePending = async (type, id) => {
        const raw = await AsyncStorage.getItem(pendingActionsKey);
        const actions = raw ? JSON.parse(raw) : [];
        actions.push({ type, data: { id }, timestamp: Date.now() });
        await AsyncStorage.setItem(pendingActionsKey, JSON.stringify(actions));
      };

      if (!isConnected) {
        // Optimistically remove from cache
        queryClient.setQueryData(["trips", "cached"], (old) =>
          (old || []).filter(
            (t) => t.id !== tripId && String(t.id) !== String(tripId),
          ),
        );
        await queuePending("DELETE_TRIP", tripId);
        return { success: true, pending: true };
      }

      try {
        const response = await deleteTripApi(tripId);
        queryClient.invalidateQueries({ queryKey: ["trips", "cached"] });
        return response;
      } catch (error) {
        await queuePending("DELETE_TRIP", tripId);
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}
