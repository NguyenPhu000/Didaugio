import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppState } from "react-native";
import { useEffect, useRef } from "react";
import React from "react";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Not needed for mobile
      refetchOnReconnect: true,
    },
  },
});

export function QueryProvider({ children }) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (
        Platform.OS !== "web" &&
        appState.current.match(/inactive|background/) &&
        status === "active"
      ) {
        queryClient.invalidateQueries();
      }
      appState.current = status;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
