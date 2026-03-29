import { useEffect } from "react";
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

  useEffect(() => {
    if (!accessToken || !Notifications) return;

    registerForPushNotifications()
      .then((pushToken) => {
        if (!pushToken) return;
        return apiClient.patch(ENDPOINTS.profile.pushToken, { pushToken });
      })
      .catch(() => {});

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Push] Received:", notification.request.content.title);
      },
    );

    return () => subscription.remove();
  }, [accessToken]);

  return children;
}
