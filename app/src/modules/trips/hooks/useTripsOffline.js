import { logger } from "../../../lib/logger";
import { useEffect, useRef, useState } from "react";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { getMyTripsApi, createTripApi, deleteTripApi, getTripDetailApi } from "../api/tripsApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { TRIP_OFFLINE_GC_MS } from "../../../constants/trip-offline-cache";
import { OFFLINE_STORAGE_KEYS } from "../../../constants/storage";
import { createRandomId } from "../../../utils/createRandomId";

const TRIPS_CACHE_KEY = OFFLINE_STORAGE_KEYS.TRIPS_CACHE;
const CACHE_VERSION = "v5";
const CACHE_EXPIRY_MS = TRIP_OFFLINE_GC_MS;

const getCacheKey = (key) => `${CACHE_VERSION}:${key}`;

// ─── Storage Helpers ─────────────────────────────────────────────────────────────

export const persistTripsToStorage = async (trips) => {
  const cacheData = {
    data: trips,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };
  try {
    await safeAsyncStorage.setItem(
      getCacheKey(TRIPS_CACHE_KEY),
      JSON.stringify(cacheData),
    );
  } catch (error) {
    // If storage is full, clear stale cache and retry once
    if (error?.message?.includes("SQLITE_FULL") || error?.code === 13) {
      try {
        await clearTripsCache();
        await safeAsyncStorage.setItem(
          getCacheKey(TRIPS_CACHE_KEY),
          JSON.stringify(cacheData),
        );
        return;
      } catch (retryError) {
        logger.warn("[TripsOffline] Storage full, retry after cleanup also failed:", retryError);
        return;
      }
    }
    logger.warn("[TripsOffline] Failed to persist trips:", error);
  }
};

export const loadTripsFromStorage = async () => {
  try {
    const raw = await safeAsyncStorage.getItem(getCacheKey(TRIPS_CACHE_KEY));
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
    logger.warn("[TripsOffline] Failed to load trips from storage:", error);
    return null;
  }
};

export const clearTripsCache = async () => {
  try {
    await safeAsyncStorage.removeItem(getCacheKey(TRIPS_CACHE_KEY));
  } catch (error) {
    logger.warn("[TripsOffline] Failed to clear trips cache:", error);
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
  const isOnlineRef = useRef(false);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedData, setCachedData] = useState(null);

  useEffect(() => {
    _ensureNetSubscription();

    const handler = (state) => {
      const wasOffline = !isOnlineRef.current;
      isOnlineRef.current = state.isConnected;

      setIsOffline(!state.isConnected);

      if (wasOffline && state.isConnected) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
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
      return response?.data || [];
    },
    enabled: enabled && isOnlineRef.current,
    staleTime: 5 * 60 * 1000,
    gcTime: TRIP_OFFLINE_GC_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
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
      const tripResponse = await getTripDetailApi(tripId);
      const trip = tripResponse?.data || null;

      if (trip) {
        try {
          await safeAsyncStorage.setItem(
            getCacheKey(storageKey),
            JSON.stringify({
              data: trip,
              timestamp: Date.now(),
              version: CACHE_VERSION,
            }),
          );
        } catch (storageError) {
          logger.warn("[TripsOffline] Failed to cache trip detail:", storageError);
        }
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
      const pendingActionsKey = OFFLINE_STORAGE_KEYS.PENDING_TRIP_ACTIONS;
      const clientRequestId = tripData.clientRequestId || createRandomId("trip-create");
      const idempotentTripData = { ...tripData, clientRequestId };

      const queuePending = async (type, data) => {
        try {
          const raw = await safeAsyncStorage.getItem(pendingActionsKey);
          const actions = raw ? JSON.parse(raw) : [];
          const tempId = createRandomId("temp");
          actions.push({ type, data, tempId, timestamp: Date.now() });
          await safeAsyncStorage.setItem(pendingActionsKey, JSON.stringify(actions));
          return tempId;
        } catch (storageError) {
          logger.warn("[TripsOffline] Failed to queue pending create action:", storageError);
          return createRandomId("temp");
        }
      };

      if (!isConnected) {
        const tempId = await queuePending("CREATE_TRIP", idempotentTripData);
        return { success: true, pending: true, tempId };
      }

      try {
        const response = await createTripApi(idempotentTripData);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
        return response;
      } catch (error) {
        const isNetworkError = !(error?.status || error?.response?.status)
          && (error?.message === "Network Error" || error?.code === "ERR_NETWORK" || !error?.response);
        if (isNetworkError) await queuePending("CREATE_TRIP", idempotentTripData);
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
      const pendingActionsKey = OFFLINE_STORAGE_KEYS.PENDING_TRIP_ACTIONS;

      const queuePending = async (type, id) => {
        try {
          const raw = await safeAsyncStorage.getItem(pendingActionsKey);
          const actions = raw ? JSON.parse(raw) : [];
          actions.push({ type, data: { id }, tempId: String(id), timestamp: Date.now() });
          await safeAsyncStorage.setItem(pendingActionsKey, JSON.stringify(actions));
        } catch (storageError) {
          logger.warn("[TripsOffline] Failed to queue pending delete action:", storageError);
        }
      };

      if (!isConnected) {
        const currentList = queryClient.getQueryData(QUERY_KEYS.trips.list()) || [];
        const updatedTrips = currentList.filter(
          (t) => t.id !== tripId && String(t.id) !== String(tripId),
        );
        queryClient.setQueryData(QUERY_KEYS.trips.list(), updatedTrips);
        await persistTripsToStorage(updatedTrips);
        await queuePending("DELETE_TRIP", tripId);
        return { success: true, pending: true };
      }

      try {
        const response = await deleteTripApi(tripId);
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
        return response;
      } catch (error) {
        const isNetworkError = !(error?.status || error?.response?.status)
          && (error?.message === "Network Error" || error?.code === "ERR_NETWORK" || !error?.response);
        if (isNetworkError) await queuePending("DELETE_TRIP", tripId);
        throw error;
      }
    },
    isOffline: !isConnected,
  };
}

/**
 * Loại bỏ các cặp CREATE+DELETE triệt tiêu nhau và các action trung gian.
 * Kịch bản: User tạo trip offline → thêm destination → xóa trip offline.
 * Nếu chỉ gửi CREATE+DELETE sẽ lãng phí, còn action ADD_DESTINATION sẽ lỗi 404.
 */
function dedupOfflineActions(actions) {
  // Bước 1: Tìm tempId bị triệt tiêu (CREATE bị DELETE cancel)
  const cancelledTempIds = new Set();
  actions.forEach((action, i) => {
    if (action.type === "DELETE_TRIP") {
      const createIdx = actions.findIndex(
        (c) => c.type === "CREATE_TRIP" && c.tempId && c.tempId === action.tempId,
      );
      if (createIdx !== -1 && createIdx < i) {
        cancelledTempIds.add(action.tempId);
      }
    }
  });

  // Bước 2: Lọc bỏ tất cả action liên quan đến tempId bị triệt tiêu
  if (cancelledTempIds.size === 0) return actions;
  return actions.filter((action) => !cancelledTempIds.has(action.tempId));
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { isConnected } = useNetworkStatus();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isConnected || isSyncingRef.current) return;

    const flushQueue = async () => {
      isSyncingRef.current = true;
      try {
        const pendingActionsKey = OFFLINE_STORAGE_KEYS.PENDING_TRIP_ACTIONS;
        const raw = await safeAsyncStorage.getItem(pendingActionsKey);
        if (!raw) {
          isSyncingRef.current = false;
          return;
        }

        let actions = JSON.parse(raw);
        if (actions.length === 0) {
          isSyncingRef.current = false;
          return;
        }

        // Triệt tiêu cặp CREATE+DELETE và action trung gian
        actions = dedupOfflineActions(actions);

        if (actions.length === 0) {
          await safeAsyncStorage.removeItem(pendingActionsKey);
          isSyncingRef.current = false;
          return;
        }

        const remainingActions = [];
        const idMapRaw = await safeAsyncStorage.getItem(OFFLINE_STORAGE_KEYS.TRIP_ID_MAP);
        const idMap = idMapRaw ? JSON.parse(idMapRaw) : {};

        for (const action of actions) {
          try {
            if (action.type === "CREATE_TRIP") {
              const response = await createTripApi(action.data);
              const serverId = response?.data?.id;
              if (action.tempId && serverId) idMap[action.tempId] = serverId;
            } else if (action.type === "DELETE_TRIP") {
              const queuedId = action.data?.id || action.data;
              const idToDelete = idMap[String(queuedId)] || queuedId;
              await deleteTripApi(idToDelete);
            }
          } catch (err) {
            const isNetworkError = !err.response || err.message === "Network Error" || err.code === "ERR_NETWORK";
            if (isNetworkError) {
              remainingActions.push(action);
            }
          }
        }

        await safeAsyncStorage.setItem(
          OFFLINE_STORAGE_KEYS.TRIP_ID_MAP,
          JSON.stringify(idMap),
        );

        if (remainingActions.length > 0) {
          await safeAsyncStorage.setItem(pendingActionsKey, JSON.stringify(remainingActions));
        } else {
          await safeAsyncStorage.removeItem(pendingActionsKey);
        }

        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trips.all() });
      } catch (error) {
        logger.warn("[OfflineSync] Sync error:", error);
      } finally {
        isSyncingRef.current = false;
      }
    };

    flushQueue();
  }, [isConnected, queryClient]);
}
