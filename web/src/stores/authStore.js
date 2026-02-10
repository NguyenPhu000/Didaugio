import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROLES } from "@/constants/constants";
import { STORAGE_KEYS } from "@/constants/timing";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Clear localStorage explicitly
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      },

      // Getters
      getUser: () => get().user,
      getAccessToken: () => get().accessToken,
      getRefreshToken: () => get().refreshToken,
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
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Skip hydration during SSR
      skipHydration: false,
      // Version for migration
      version: 1,
      // Migrate function to handle version changes
      migrate: (persistedState, version) => {
        // If no version or version 1, return as is
        if (version === 1) {
          return persistedState;
        }
        return persistedState;
      },
    },
  ),
);
