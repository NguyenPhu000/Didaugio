import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QUERY_KEYS } from "../constants/query-keys";
import {
  REACT_QUERY_PERSIST_BUSTER,
  TRIP_OFFLINE_MAX_AGE_MS,
} from "../constants/trip-offline-cache";

const PERSIST_STORAGE_KEY = "didaugio-react-query-cache";

const tripsRootKey = QUERY_KEYS.trips.all()[0];

function slimPlace(place) {
  if (!place || typeof place !== "object") return place;
  const { thumbnail, images, ...rest } = place;
  return rest;
}

/** Strip heavy base64 images from trip destinations to stay under Android's 2MB CursorWindow limit. */
function slimTrip(trip) {
  if (!trip || typeof trip !== "object") return trip;
  const { destinations, bookings, ...rest } = trip;
  const slimmedDestinations = Array.isArray(destinations)
    ? destinations.map((d) => ({
        ...d,
        place: slimPlace(d.place),
      }))
    : [];
  return {
    ...rest,
    destinations: slimmedDestinations,
    destinationCount: slimmedDestinations.length,
  };
}

const basePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_STORAGE_KEY,
  throttleTime: 1000,
});

export const asyncStoragePersister = {
  persistClient: async (persistedClient) => {
    if (persistedClient && persistedClient.clientState && Array.isArray(persistedClient.clientState.queries)) {
      const slimmedQueries = persistedClient.clientState.queries.map((q) => {
        const root = q.queryKey?.[0];
        if (root === tripsRootKey && q.state?.data) {
          const data = q.state.data;
          let slimmedData = data;
          if (Array.isArray(data)) {
            slimmedData = data.map(slimTrip);
          } else if (data?.data && typeof data.data === "object" && !Array.isArray(data.data)) {
            slimmedData = { ...data, data: slimTrip(data.data) };
          } else if (data && typeof data === "object" && !Array.isArray(data)) {
            slimmedData = slimTrip(data);
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
      return await basePersister.persistClient({
        ...persistedClient,
        clientState: {
          ...persistedClient.clientState,
          queries: slimmedQueries,
        },
      });
    }
    return await basePersister.persistClient(persistedClient);
  },
  restoreClient: async () => {
    return await basePersister.restoreClient();
  },
  removeClient: async () => {
    return await basePersister.removeClient();
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
