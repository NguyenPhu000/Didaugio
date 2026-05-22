import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QUERY_KEYS } from "../constants/query-keys";
import {
  REACT_QUERY_PERSIST_BUSTER,
  TRIP_OFFLINE_MAX_AGE_MS,
} from "../constants/trip-offline-cache";

const PERSIST_STORAGE_KEY = "didaugio-react-query-cache";

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_STORAGE_KEY,
  throttleTime: 1000,
});

const tripsRootKey = QUERY_KEYS.trips.all()[0];

/**
 * Chỉ persist các query thuộc domain trips (list + detail).
 */
export function shouldPersistTripQuery(query) {
  const root = query.queryKey?.[0];
  return root === tripsRootKey;
}

export const tripPersistOptions = {
  persister: asyncStoragePersister,
  maxAge: TRIP_OFFLINE_MAX_AGE_MS,
  buster: REACT_QUERY_PERSIST_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistTripQuery,
  },
};
