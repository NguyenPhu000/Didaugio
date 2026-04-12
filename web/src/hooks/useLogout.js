import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/apis/authService";
import { AUTH_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

export const useLogout = ({ onBeforeNavigate } = {}) => {
  const navigate = useNavigate();
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const setLogoutInProgress = useAuthStore(
    (state) => state.setLogoutInProgress,
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutInProgress(true);

    try {
      if (refreshToken) {
        await authService.logout(refreshToken, {
          skipAuthRefresh: true,
          skipAuthRedirect: true,
        });
      }
    } catch {
      // Local auth state is still cleared in finally to avoid stale sessions.
    } finally {
      logout();
      if (typeof onBeforeNavigate === "function") {
        onBeforeNavigate();
      }
      navigate(AUTH_ROUTES.LOGIN, { replace: true });
      setIsLoggingOut(false);
    }
  }, [
    isLoggingOut,
    refreshToken,
    setLogoutInProgress,
    logout,
    onBeforeNavigate,
    navigate,
  ]);

  return {
    handleLogout,
    isLoggingOut,
  };
};
