import { create } from "zustand";
import { ROLES } from "@/constants/constants";
import { STORAGE_KEYS } from "@/constants/timing";

try {
  globalThis.localStorage?.removeItem(STORAGE_KEYS.AUTH);
} catch {
  // Storage may be unavailable in SSR or privacy-restricted browsers.
}

export const useAuthStore = create((set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      isLoggingOut: false,

      // Actions
      setAuth: (user, accessToken) => {
        set({
          user,
          accessToken,
          refreshToken: null,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setSession: ({ user, accessToken }) => {
        set((state) => ({
          user: user ?? state.user,
          accessToken: accessToken ?? state.accessToken,
          refreshToken: null,
          isAuthenticated: Boolean(accessToken ?? state.accessToken),
          isLoading: false,
        }));
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setLogoutInProgress: (isLoggingOut) => {
        set({ isLoggingOut });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          isLoggingOut: false,
        });
        try {
          globalThis.localStorage?.removeItem(STORAGE_KEYS.AUTH);
        } catch {
          // Memory state is authoritative even when storage is unavailable.
        }
      },

      // Getters
      getUser: () => get().user,
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => null,
      // Legacy support - alias for accessToken
      get token() {
        return get().accessToken;
      },
      isAdmin: () => {
        const user = get().user;
        return (
          user?.roleId === ROLES.SUPER_ADMIN || user?.roleId === ROLES.ADMIN
        );
      },
      isBusiness: () => {
        const user = get().user;
        return user?.roleId === ROLES.BUSINESS;
      },
}));
