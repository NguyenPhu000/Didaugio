import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";

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
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function registerForPushNotifications() {
  if (!Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function NotificationProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id || null);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const lastSyncedRef = useRef({ userId: null, pushToken: null });

  useEffect(() => {
    if (!Notifications) return;

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] Received:", notification.request.content.title);
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(() => {
        // Hook point for deep-link handling on notification tap.
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

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

  return children;
}
