import { useEffect, useState } from "react";
import {
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { asyncStoragePersister, shouldPersistTripQuery } from "./queryPersist";
import { logger } from "../lib/logger";
import {
  REACT_QUERY_PERSIST_BUSTER,
  TRIP_OFFLINE_GC_MS,
  TRIP_OFFLINE_MAX_AGE_MS,
} from "../constants/trip-offline-cache";

const QUERY_RESTORE_TIMEOUT_MS = 1_500;

function createAppQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });

  client.setQueryDefaults(["trips"], {
    gcTime: TRIP_OFFLINE_GC_MS,
  });

  return client;
}

export const QueryProvider = ({ children }) => {
  const [queryClient] = useState(createAppQueryClient);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const persistOptions = {
      queryClient,
      persister: asyncStoragePersister,
      maxAge: TRIP_OFFLINE_MAX_AGE_MS,
      buster: REACT_QUERY_PERSIST_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: shouldPersistTripQuery,
      },
    };

    const [unsubscribe, restorePromise] = persistQueryClient(persistOptions);

    let active = true;
    let restoreReleased = false;
    const releaseRestoreGate = () => {
      if (restoreReleased) return;
      restoreReleased = true;
      if (active) setIsRestoring(false);
    };
    const restoreTimeout = setTimeout(releaseRestoreGate, QUERY_RESTORE_TIMEOUT_MS);

    restorePromise
      .catch((error) => {
        logger.warn("Query cache restore failed", error);
      })
      .finally(() => {
        clearTimeout(restoreTimeout);
        releaseRestoreGate();
      });

    return () => {
      active = false;
      clearTimeout(restoreTimeout);
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <IsRestoringProvider value={isRestoring}>{children}</IsRestoringProvider>
    </QueryClientProvider>
  );
};
