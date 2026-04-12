import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ROLES } from "@/constants/constants";
import { STORAGE_KEYS } from "@/constants/timing";

/**
 * Read persisted auth state synchronously from localStorage at module load time.
 * This ensures the FIRST render already has the correct auth values,
 * preventing the "redirect to login on F5" race condition with Zustand v5's
 * async persist hydration.
 */
const getPersistedAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state ?? {};
    }
  } catch {
    // Ignore malformed persisted auth state.
  }
  return {};
};

const _p = getPersistedAuth();

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State — seeded from localStorage so first render is already correct
      user: _p.user ?? null,
      accessToken: _p.accessToken ?? null,
      refreshToken: _p.refreshToken ?? null,
      isAuthenticated: _p.isAuthenticated ?? false,
      isLoading: false,
      isLoggingOut: false,

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
