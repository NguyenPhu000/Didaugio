import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "didaugio_access_token";
const REFRESH_TOKEN_KEY = "didaugio_refresh_token";
const USER_KEY = "didaugio_user";
const SECURE_STORE_OPTIONS = {
  keychainService: "didaugio.auth",
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const safeGetItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
  } catch {
    return null;
  }
};

const safeSetItem = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
    return true;
  } catch {
    return false;
  }
};

const safeDeleteItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
    return true;
  } catch {
    return false;
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,
  hydrationError: null,
  isGuest: false,

  enterGuestMode: () => set({ isGuest: true }),
  exitGuestMode: () => set({ isGuest: false }),
  isAuthenticated: () => !!get().accessToken,
  setUser: (user) => set({ user }),

  hydrate: async () => {
    let accessToken = null;
    let refreshToken = null;
    let user = null;

    try {
      const [storedAccessToken, storedRefreshToken, userJson] =
        await Promise.all([
          safeGetItem(ACCESS_TOKEN_KEY),
          safeGetItem(REFRESH_TOKEN_KEY),
          safeGetItem(USER_KEY),
        ]);

      accessToken = storedAccessToken || null;
      refreshToken = storedRefreshToken || null;

      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch {
          user = null;
          await safeDeleteItem(USER_KEY);
        }
      }

      set({
        accessToken,
        refreshToken,
        user,
        isHydrated: true,
        hydrationError: null,
      });
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isHydrated: true,
        hydrationError: "AUTH_HYDRATE_FAILED",
      });
    }
  },

  setSession: async ({ user, accessToken, refreshToken }) => {
    const nextUser = user || null;
    const nextAccessToken = accessToken || null;
    const nextRefreshToken = refreshToken || null;

    set({
      user: nextUser,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      isGuest: false,
      hydrationError: null,
    });

    await Promise.all([
      nextAccessToken
        ? safeSetItem(ACCESS_TOKEN_KEY, nextAccessToken)
        : safeDeleteItem(ACCESS_TOKEN_KEY),
      nextRefreshToken
        ? safeSetItem(REFRESH_TOKEN_KEY, nextRefreshToken)
        : safeDeleteItem(REFRESH_TOKEN_KEY),
      nextUser
        ? safeSetItem(USER_KEY, JSON.stringify(nextUser))
        : safeDeleteItem(USER_KEY),
    ]);
  },

  clearSession: async () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isGuest: false,
      hydrationError: null,
    });

    await Promise.all([
      safeDeleteItem(ACCESS_TOKEN_KEY),
      safeDeleteItem(REFRESH_TOKEN_KEY),
      safeDeleteItem(USER_KEY),
    ]);
  },

  getAccessToken: () => get().accessToken,
}));
