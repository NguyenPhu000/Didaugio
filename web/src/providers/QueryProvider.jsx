import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";
import { resolveRoleId } from "@/utils/authRouting";

const isDev = import.meta.env.DEV;

function TanstackDevtoolsController() {
  const { user, isAuthenticated } = useAuthStore();
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.pathname.startsWith("/admin");
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(window.location.pathname.startsWith("/admin"));
    };

    window.addEventListener("popstate", handleLocationChange);
    const intervalId = setInterval(handleLocationChange, 500);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      clearInterval(intervalId);
    };
  }, []);

  const roleId = resolveRoleId(user);
  const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  // Chỉ hiển thị Tanstack Devtools ở môi trường Dev, đã đăng nhập và đang ở cổng /admin của Admin/Super Admin
  if (!isDev || !isAuthenticated || !isAdmin || !isAdminRoute) {
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
