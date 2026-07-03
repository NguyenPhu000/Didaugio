import React, { useEffect, useCallback, useRef } from "react";
import safeAsyncStorage from "../../../utils/safeAsyncStorage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import {
  getSavedPlacesApi,
  getSavedCollectionsApi,
} from "../api/savedApi";

const SAVED_PLACES_CACHE_KEY = "@saved_places_cache";
const SAVED_COLLECTIONS_CACHE_KEY = "@saved_collections_cache";
const CACHE_VERSION = "v1";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (key) => `${CACHE_VERSION}:${key}`;

/**
 * Lưu data vào safeAsyncStorage với metadata
 */
const persistToStorage = async (key, data) => {
  try {
    const payload = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    await safeAsyncStorage.setItem(getCacheKey(key), JSON.stringify(payload));
  } catch {
    // Silently fail - offline cache is best-effort
  }
};

/**
 * Đọc data từ safeAsyncStorage
 * @returns {data, isStale, age} hoặc null nếu không có cache
 */
const loadFromStorage = async (key) => {
  try {
    const raw = await safeAsyncStorage.getItem(getCacheKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const age = Date.now() - (parsed.timestamp || 0);
    const isStale = age > CACHE_EXPIRY_MS;

    return {
      data: parsed.data,
      isStale,
      age,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
};

/**
 * Xóa cache
 */
export const clearSavedCache = async () => {
  try {
    await safeAsyncStorage.multiRemove([
      getCacheKey(SAVED_PLACES_CACHE_KEY),
      getCacheKey(SAVED_COLLECTIONS_CACHE_KEY),
    ]);
  } catch {
    // Silently fail
  }
};

/**
 * Hook chính để cache saved places
 * - Ưu tiên đọc từ cache trước (instant load)
 * - Fetch từ server khi online
 * - Tự động sync khi có mạng trở lại
 */
export function useSavedPlacesCached(enabled = true) {
  const queryClient = useQueryClient();
  const isFetchingRef = useRef(false);
  const hasShownOfflineToastRef = useRef(false);

  // NetInfo listener for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && !isFetchingRef.current) {
        // Network restored - trigger refresh
        queryClient.invalidateQueries({ queryKey: ["saved-places"] });
        queryClient.invalidateQueries({ queryKey: ["saved-collections"] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Load saved places with offline support
  const {
    data: savedData = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["saved-places"],
    queryFn: async () => {
      isFetchingRef.current = true;
      try {
        const result = await getSavedPlacesApi();
        const places = result?.data || [];
        await persistToStorage(SAVED_PLACES_CACHE_KEY, places);
        hasShownOfflineToastRef.current = false;
        return places;
      } catch (err) {
        // If fetch fails, try to load from cache
        const cached = await loadFromStorage(SAVED_PLACES_CACHE_KEY);
        if (cached) {
          if (!hasShownOfflineToastRef.current) {
            hasShownOfflineToastRef.current = true;
          }
          return cached.data;
        }
        throw err;
      } finally {
        isFetchingRef.current = false;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // Initial load from cache (for instant UI)
  const loadInitialCache = useCallback(async () => {
    const cached = await loadFromStorage(SAVED_PLACES_CACHE_KEY);
    return cached?.data || [];
  }, []);

  // Check if showing stale data
  const isShowingStaleData = useCallback(async () => {
    const cached = await loadFromStorage(SAVED_PLACES_CACHE_KEY);
    return cached?.isStale || false;
  }, []);

  // Get cache metadata
  const getCacheMetadata = useCallback(async () => {
    const cached = await loadFromStorage(SAVED_PLACES_CACHE_KEY);
    if (!cached) return null;
    return {
      age: cached.age,
      isStale: cached.isStale,
      lastUpdated: cached.timestamp ? new Date(cached.timestamp) : null,
    };
  }, []);

  return {
    savedData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isFetching,
    dataUpdatedAt,
    loadInitialCache,
    isShowingStaleData,
    getCacheMetadata,
    clearSavedCache,
  };
}

/**
 * Hook để cache saved collections
 */
export function useSavedCollectionsCached(enabled = true) {
  const {
    data: collections = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["saved-collections"],
    queryFn: async () => {
      const result = await getSavedCollectionsApi();
      const cols = result?.data || [];
      await persistToStorage(SAVED_COLLECTIONS_CACHE_KEY, cols);
      return cols;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => (Array.isArray(data) ? data : []),
  });

  return {
    collections,
    isLoading,
    isError,
    refetch,
    isRefetching,
  };
}

/**
 * Hook để check network status
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = React.useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
