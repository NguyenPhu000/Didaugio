import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "didaugio_access_token";
const REFRESH_TOKEN_KEY = "didaugio_refresh_token";
const USER_KEY = "didaugio_user";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  isGuest: false,

  enterGuestMode: () => set({ isGuest: true }),
  exitGuestMode: () => set({ isGuest: false }),
  isAuthenticated: () => !!get().accessToken,
  setUser: (user) => set({ user }),

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);

    let user = null;
    try {
      if (userJson) user = JSON.parse(userJson);
    } catch {
      user = null;
    }

    set({
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user,
      isHydrated: true,
    });
  },

  setSession: async ({ user, accessToken, refreshToken }) => {
    set({ user, accessToken, refreshToken });

    await Promise.all([
      accessToken
        ? SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken)
        : SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      refreshToken
        ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken)
        : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      user
        ? SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
        : SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },

  clearSession: async () => {
    set({ user: null, accessToken: null, refreshToken: null, isGuest: false });
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  },

  getAccessToken: () => get().accessToken,
}));
