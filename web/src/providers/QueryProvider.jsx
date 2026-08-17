import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";

const isDev = import.meta.env.DEV;

function TanstackDevtoolsController() {
  const { user } = useAuthStore();
  const [isBusinessRoute, setIsBusinessRoute] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname.startsWith("/business");
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsBusinessRoute(window.location.pathname.startsWith("/business"));
    };

    window.addEventListener("popstate", handleLocationChange);
    const intervalId = setInterval(handleLocationChange, 500);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(intervalId);
    };
  }, []);

  // Ẩn icon Tanstack Devtools ở tất cả trang /business hoặc đối với tài khoản Business / Staff
  const isBusinessUser =
    user?.roleId === ROLES.BUSINESS ||
    user?.roleId === ROLES.STAFF ||
    user?.role?.name?.toLowerCase().includes("business") ||
    user?.role?.name?.toLowerCase().includes("staff");

  if (!isDev || isBusinessRoute || isBusinessUser) {
    return null;
  }

  return <ReactQueryDevtools initialIsOpen={false} />;
}

export const QueryProvider = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <TanstackDevtoolsController />
    </QueryClientProvider>
  );
};
