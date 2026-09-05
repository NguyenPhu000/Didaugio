import { authService } from "@/apis/authService";
import { useAuthStore } from "@/stores/authStore";
import { withBrowserRefreshLock } from "./refreshLock";

export { withBrowserRefreshLock } from "./refreshLock";

export const createBrowserSessionBootstrap = ({
  refreshSession = (config) => authService.refreshToken(config),
  authStore = useAuthStore,
  runWithLock = withBrowserRefreshLock,
} = {}) => {
  let bootstrapPromise = null;

  return () => {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      try {
        return await runWithLock(async () => {
          const response = await refreshSession({
            skipAuthRefresh: true,
            skipAuthRedirect: true,
          });
          const { user, accessToken } = response?.data || {};
          if (!response?.success || !user || !accessToken) {
            throw new Error("Invalid browser refresh response");
          }
          authStore.getState().setSession({ user, accessToken });
          return true;
        });
      } catch {
        authStore.getState().logout();
        return false;
      } finally {
        authStore.getState().setLoading(false);
      }
    })();

    return bootstrapPromise;
  };
};

export const bootstrapBrowserSession = createBrowserSessionBootstrap();
