import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { logoutApi } from "../api/authApi";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    accessToken,
    refreshToken,
    isGuest,
    enterGuestMode,
    exitGuestMode,
    clearSession,
    isAuthenticated,
  } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await logoutApi(refreshToken);
    } catch {
    } finally {
      exitGuestMode();
      await clearSession();
      router.replace("/(auth)/login");
    }
  }, [clearSession, exitGuestMode, router, refreshToken]);

  const continueAsGuest = useCallback(() => {
    enterGuestMode();
    router.replace("/(tabs)/map");
  }, [enterGuestMode, router]);

  return {
    user,
    accessToken,
    isGuest,
    isAuthenticated: isAuthenticated(),
    logout,
    continueAsGuest,
  };
}
