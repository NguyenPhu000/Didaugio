import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export const QueryProvider = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 2,
            refetchOnWindowFocus: false, // never refetch while staleTime valid
            refetchOnReconnect: "always",
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
