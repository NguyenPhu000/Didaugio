import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QUERY_KEYS } from "../constants/query-keys";
import {
  REACT_QUERY_PERSIST_BUSTER,
  TRIP_OFFLINE_MAX_AGE_MS,
} from "../constants/trip-offline-cache";

const PERSIST_STORAGE_KEY = "didaugio-react-query-cache";

const tripsRootKey = QUERY_KEYS.trips.all()[0];

/** Strip heavy fields from trip objects before persisting to stay under Android's 2MB CursorWindow limit. */
function slimTrip(trip) {
  if (!trip || typeof trip !== "object") return trip;
  const { destinations, bookings, ...rest } = trip;
  return {
    ...rest,
    destinationCount: destinations?.length ?? 0,
  };
}

const basePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_STORAGE_KEY,
  throttleTime: 1000,
});

export const asyncStoragePersister = {
  ...basePersister,
  persistClient: (client) => {
    if (client && Array.isArray(client.queries)) {
      const slimmedQueries = client.queries.map((q) => {
        const root = q.queryKey?.[0];
        if (root === tripsRootKey && q.state?.data) {
          const data = q.state.data;
          let slimmedData = data;
          if (Array.isArray(data)) {
            slimmedData = data.map(slimTrip);
          } else if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
            slimmedData = { ...data, data: slimTrip(data.data) };
          }
          return {
            ...q,
            state: {
              ...q.state,
              data: slimmedData,
            },
          };
        }
        return q;
      });
      return basePersister.persistClient({
        ...client,
        queries: slimmedQueries,
      });
    }
    return basePersister.persistClient(client);
  },
};

/**
 * Chỉ persist các query thuộc domain trips (list + detail) và đã fetch thành công.
 * Tránh persist các query đang pending hoặc error để ngăn chặn lỗi hydration crash.
 */
export function shouldPersistTripQuery(query) {
  const root = query.queryKey?.[0];
  return root === tripsRootKey && query.state.status === "success";
}

export const tripPersistOptions = {
  persister: asyncStoragePersister,
  maxAge: TRIP_OFFLINE_MAX_AGE_MS,
  buster: REACT_QUERY_PERSIST_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: shouldPersistTripQuery,
  },
};
