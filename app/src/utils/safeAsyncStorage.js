import AsyncStorage from "@react-native-async-storage/async-storage";

const CLEANUP_COOLDOWN_MS = 30_000;
let lastCleanupAttempt = 0;
let diskFullFlag = false;

const CACHE_KEY_PATTERNS = [
  "v5:",
  "query-cache",
  "react-query",
  "REACT_QUERY_OFFLINE_CACHE",
  "didaugio-react-query-cache",
];

const PRESERVE_KEYS = new Set([
  "ai-planner-store",
  "ai-context-store",
  "auth-storage",
  "user-session",
]);

async function aggressiveCleanup() {
  const now = Date.now();
  if (now - lastCleanupAttempt < CLEANUP_COOLDOWN_MS) return;
  lastCleanupAttempt = now;

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    if (!allKeys?.length) return;

    const keysToRemove = allKeys.filter((key) => {
      if (PRESERVE_KEYS.has(key)) return false;
      return CACHE_KEY_PATTERNS.some((pat) => key.includes(pat));
    });

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(
        `[safeAsyncStorage] Đã xóa ${keysToRemove.length} cache keys:`,
        keysToRemove.slice(0, 5),
      );
    }

    diskFullFlag = false;
  } catch (err) {
    console.warn("[safeAsyncStorage] Cleanup thất bại:", err?.message);
  }
}

function isDiskFullError(error) {
  return (
    error?.message?.includes("SQLITE_FULL") ||
    error?.code === 13 ||
    error?.message?.includes("database or disk is full")
  );
}

const safeAsyncStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      if (isDiskFullError(error)) {
        diskFullFlag = true;
        await aggressiveCleanup();
      }
      console.warn(`[safeAsyncStorage] getItem failed for key "${key}":`, error?.message);
      return null;
    }
  },

  setItem: async (key, value) => {
    if (diskFullFlag) {
      await aggressiveCleanup();
      if (diskFullFlag) return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (!isDiskFullError(error)) {
        console.warn(`[safeAsyncStorage] setItem failed for key "${key}":`, error?.message);
        return;
      }

      diskFullFlag = true;
      await aggressiveCleanup();

      try {
        await AsyncStorage.setItem(key, value);
        diskFullFlag = false;
      } catch (retryError) {
        console.warn(
          `[safeAsyncStorage] Retry setItem "${key}" thất bại — bỏ qua persist`,
        );
      }
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`[safeAsyncStorage] removeItem failed for key "${key}":`, error?.message);
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.clear();
      diskFullFlag = false;
    } catch (error) {
      console.warn("[safeAsyncStorage] clear failed:", error?.message);
    }
  },

  getAllKeys: async () => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.warn("[safeAsyncStorage] getAllKeys failed:", error?.message);
      return [];
    }
  },

  multiGet: async (keys) => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.warn("[safeAsyncStorage] multiGet failed:", error?.message);
      return [];
    }
  },

  multiSet: async (keyValuePairs) => {
    if (diskFullFlag) {
      await aggressiveCleanup();
      if (diskFullFlag) return;
    }

    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      if (!isDiskFullError(error)) {
        console.warn("[safeAsyncStorage] multiSet failed:", error?.message);
        return;
      }

      diskFullFlag = true;
      await aggressiveCleanup();

      try {
        await AsyncStorage.multiSet(keyValuePairs);
        diskFullFlag = false;
      } catch (retryError) {
        console.warn("[safeAsyncStorage] Retry multiSet thất bại — bỏ qua persist");
      }
    }
  },

  multiRemove: async (keys) => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.warn("[safeAsyncStorage] multiRemove failed:", error?.message);
    }
  },

  resetDiskFullFlag: () => {
    diskFullFlag = false;
  },
};

export default safeAsyncStorage;
