import { useEffect } from "react";
import { QueryProvider } from "./QueryProvider";
import { NotificationProvider } from "./NotificationProvider";
import { useAuthStore } from "../stores/authStore";
import { getMeApi } from "../modules/auth/api/authApi";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useOnlineStatusPing } from "../hooks/useOnlineStatusPing";

const Bootstrap = ({ children }) => {
  const hydrate = useAuthStore((state) => state.hydrate);
  useOnlineStatusPing();

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await hydrate();

        const { accessToken, setUser, clearSession } = useAuthStore.getState();
        if (!accessToken || !isMounted) {
          return;
        }

        try {
          const res = await getMeApi();
          const freshUser = res?.data || res;
          if (isMounted && freshUser?.id) {
            setUser(freshUser);
          }
        } catch (error) {
          if (error?.status === 401 && isMounted) {
            await clearSession();
          }
        }
      } catch {
        const { clearSession } = useAuthStore.getState();
        if (isMounted) {
          await clearSession();
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [hydrate]);

  return children;
};

export const AppProvider = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Bootstrap>
          <NotificationProvider>{children}</NotificationProvider>
        </Bootstrap>
      </QueryProvider>
    </ErrorBoundary>
  );
};
