import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { QueryProvider } from "./QueryProvider";
import { useAuthStore } from "../stores/authStore";
import { getMeApi } from "../modules/auth/api/authApi";
import { ErrorBoundary } from "../components/ErrorBoundary";

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const { isHydrated, accessToken, isGuest } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isLoggedIn = !!accessToken || isGuest;

    if (!isLoggedIn && !inAuthGroup) {
      // Not authenticated → redirect to login
      router.replace("/(auth)/login");
    } else if (isLoggedIn && inAuthGroup) {
      // Already authenticated → redirect to app
      router.replace("/(tabs)/map");
    }
  }, [isHydrated, accessToken, isGuest, segments]);

  if (!isHydrated) return null;

  return children;
};

const Bootstrap = ({ children }) => {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    const init = async () => {
      await hydrate();

      // Background: refresh user profile nếu đang đăng nhập
      // Không block render — chỉ cập nhật user mới nhất từ server
      const { accessToken, setUser } = useAuthStore.getState();
      if (accessToken) {
        getMeApi()
          .then((res) => {
            const freshUser = res?.data || res;
            if (freshUser?.id) setUser(freshUser);
          })
          .catch(() => {
            // Token hết hạn → refresh interceptor (client.js) sẽ tự xử lý
            // khi có request tiếp theo; không cần làm gì ở đây
          });
      }
    };
    init();
  }, []);

  return children;
};

export const AppProvider = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <Bootstrap>
          <AuthGuard>{children}</AuthGuard>
        </Bootstrap>
      </QueryProvider>
    </ErrorBoundary>
  );
};
