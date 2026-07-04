import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";
import { QUERY_KEYS } from "../constants/query-keys";
import { useQueryClient } from "@tanstack/react-query";

const isExpoGo =
  Constants?.executionEnvironment === "storeClient" ||
  Constants?.appOwnership === "expo";

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    // expo-notifications chưa install — push notification sẽ bị disable
  }
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Lấy projectId từ app config.
 */
function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    null
  );
}

/**
 * Đăng ký push notification và trả về Expo push token.
 */
async function registerForPushNotifications() {
  if (!Notifications) return null;
  if (Constants?.isDevice === false) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0077b8",
      sound: "default",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const projectId = getProjectId();
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

/**
 * Resolve notification data thành route để navigate.
 */
function resolveNotificationRoute(data) {
  if (!data) return null;
  const type = String(data.type || "");

  if ((type.includes("booking") || data.bookingId) && data.bookingId) {
    return `/profile/booking/${data.bookingId}`;
  }
  if (data.placeId) {
    return `/place/${data.placeId}`;
  }
  if (data.businessId) {
    return `/(tabs)`;
  }
  return null;
}

/* ─── Context ──────────────────────────────────────── */

const NotificationContext = createContext(null);

/**
 * Hook để truy cập notification utilities từ bất kỳ component nào.
 * Trả về { setBadgeCount, clearBadge }.
 */
export function useNotificationActions() {
  return useContext(NotificationContext) ?? { setBadgeCount: () => {}, clearBadge: () => {} };
}

/* ─── Provider ─────────────────────────────────────── */

export function NotificationProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id || null);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const lastSyncedRef = useRef({ userId: null, pushToken: null });
  const router = useRouter();
  const queryClient = useQueryClient();

  const setBadgeCount = useCallback(async (count) => {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Badge không khả dụng trên một số Android launcher
    }
  }, []);

  const clearBadge = useCallback(() => setBadgeCount(0), [setBadgeCount]);

  // ─── Deep-link: navigate khi user tap notification ───
  useEffect(() => {
    if (!Notifications) return;

    // Cold-start: app bị kill, user tap notification → app mở ra
    // getLastNotificationResponse() trả về notification response cuối cùng
    const handleColdStart = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const data = response?.notification?.request?.content?.data;
          const route = resolveNotificationRoute(data);
          if (route) {
            // Delay nhẹ để router sẵn sàng
            setTimeout(() => router.push(route), 500);
          }
        }
      } catch {
        // Bỏ qua lỗi
      }
    };

    void handleColdStart();

    // Warm-start: app đang chạy (foreground/background), user tap notification
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        const route = resolveNotificationRoute(data);
        if (route) {
          router.push(route);
        }
      });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  // ─── Foreground listener: log + invalidate query ───
  useEffect(() => {
    if (!Notifications) return;

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "[Push] Received:",
          notification.request.content.title,
        );
        // Invalidate notification queries để UI cập nhật
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.notifications.all(),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.notifications.unreadCount(),
        });
      },
    );

    // Listen cho announcement event qua Socket.IO (nếu có socket)
    // Announcement cũng đến dưới dạng push notification nên query invalidation
    // ở trên sẽ tự động bắt được. Tuy nhiên nếu app đang foreground thì
    // push không hiện — cần invalidate query để UI cập nhật.
    const handleAnnouncement = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.unreadCount(),
      });
    };

    // Nếu Socket.IO được sử dụng, listen announcement event
    let socketCleanup = () => {};
    try {
      const { getSocket } = require("../utils/socket");
      const socket = getSocket();
      if (socket) {
        socket.on("announcement", handleAnnouncement);
        socketCleanup = () => socket.off("announcement", handleAnnouncement);
      }
    } catch {
      // Socket module không khả dụng — bỏ qua
    }

    return () => {
      receivedSubscription.remove();
      socketCleanup();
    };
  }, [queryClient]);

  // ─── Sync push token lên server ───
  useEffect(() => {
    if (!Notifications || !isHydrated) return;

    if (!accessToken || !userId) {
      lastSyncedRef.current = { userId: null, pushToken: null };
      return;
    }

    let cancelled = false;

    const syncPushToken = async () => {
      try {
        const pushToken = await registerForPushNotifications();
        if (!pushToken) return;

        const alreadySynced =
          lastSyncedRef.current.userId === userId &&
          lastSyncedRef.current.pushToken === pushToken;

        if (alreadySynced || cancelled) return;

        await apiClient.patch(ENDPOINTS.profile.pushToken, { pushToken });

        if (!cancelled) {
          lastSyncedRef.current = { userId, pushToken };
        }
      } catch {
        // Notification sync errors are intentionally non-blocking for auth flow.
      }
    };

    void syncPushToken();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isHydrated, userId]);

  // ─── Clear badge khi user logout ───
  useEffect(() => {
    if (!accessToken) {
      clearBadge();
    }
  }, [accessToken, clearBadge]);

  const contextValue = { setBadgeCount, clearBadge };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
