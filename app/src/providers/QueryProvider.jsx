import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { tripPersistOptions } from "./queryPersist";
import { TRIP_OFFLINE_GC_MS } from "../constants/trip-offline-cache";

function createAppQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
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

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={tripPersistOptions}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
