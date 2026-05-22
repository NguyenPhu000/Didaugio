import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { getMyTripsApi, createTripApi, deleteTripApi } from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { TRIP_OFFLINE_GC_MS } from "../../../constants/trip-offline-cache";

const TRIPS_CACHE_KEY = "@trips_cache";
const CACHE_VERSION = "v2";
const CACHE_EXPIRY_MS = TRIP_OFFLINE_GC_MS;

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
let _netSubscribed = false;

function _notifyNetListeners() {
  _netListeners.forEach((cb) => cb(_netState));
}

function _ensureNetSubscription() {
  if (_netSubscribed) return;
  _netSubscribed = true;
  NetInfo.addEventListener((state) => {
    _netState.isConnected = state.isConnected ?? true;
    _netState.isInternetReachable = state.isInternetValidationEnabled
      ? state.isInternetReachable !== false
      : _netState.isConnected;
    _notifyNetListeners();
  });
}

export function useNetworkStatus() {
  const [net, setNet] = useState({ ..._netState });

  useEffect(() => {
    _ensureNetSubscription();
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

  useEffect(() => {
    _ensureNetSubscription();

    const handler = (state) => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = state.isConnected;

      setIsOffline(!state.isConnected);

      if (wasOffline && state.isConnected) {
        queryClient.invalidateQueries({ queryKey: ["trips"] });
      }
    };

    _netListeners.add(handler);
    handler(_netState);

    return () => {
      _netListeners.delete(handler);
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: QUERY_KEYS.trips.list(),
    queryFn: async () => {
      const response = await getMyTripsApi();
      const trips = response?.data || [];
      await persistTripsToStorage(trips);
      return trips;
    },
    enabled: enabled && isOnlineRef.current,
    staleTime: 5 * 60 * 1000,
    gcTime: TRIP_OFFLINE_GC_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: "always",
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

  const rawData = isOffline ? cachedData : query.data;
  const safeData = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : [];

  return {
    data: safeData,
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
    queryKey: QUERY_KEYS.trips.detail(tripId),
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
    gcTime: TRIP_OFFLINE_GC_MS,
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
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
        queryClient.setQueryData(QUERY_KEYS.trips.list(), (old) =>
          (old || []).filter(
            (t) => t.id !== tripId && String(t.id) !== String(tripId),
          ),
        );
        await queuePending("DELETE_TRIP", tripId);
        return { success: true, pending: true };
      }

      try {
        const response = await deleteTripApi(tripId);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
        return response;
      } catch (error) {
        await queuePending("DELETE_TRIP", tripId);
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}
