import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { QueryProvider } from "./QueryProvider";
import { NotificationProvider } from "./NotificationProvider";
import { useAuthStore } from "../stores/authStore";
import { useUIStore } from "../stores/uiStore";
import { getMeApi } from "../modules/auth/api/authApi";
import { ErrorBoundary } from "../components/ErrorBoundary";

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { isHydrated, accessToken, isGuest } = useAuthStore();
  const hasOnboarded = useUIStore((s) => s.hasOnboarded);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const isLoggedIn = !!accessToken || isGuest;

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isLoggedIn && inAuthGroup) {
      if (!hasOnboarded && accessToken) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)/map");
      }
    } else if (isLoggedIn && !inOnboarding && !hasOnboarded && accessToken) {
      router.replace("/onboarding");
    }
  }, [isHydrated, accessToken, isGuest, segments, hasOnboarded]);

  if (!isHydrated) return null;

  return children;
};

const Bootstrap = ({ children }) => {
  const hydrate = useAuthStore((state) => state.hydrate);

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
          <AuthGuard>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthGuard>
        </Bootstrap>
      </QueryProvider>
    </ErrorBoundary>
  );
};
