import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { createRandomId } from "../utils/createRandomId";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { QUERY_KEYS } from "../constants/query-keys";
import { useAuthStore } from "../stores/authStore";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch {
    // Push is optional in Expo Go and unsupported runtimes.
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

const BANNER_DURATION_MS = 4800;
const MAX_BANNER_QUEUE = 3;

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    null
  );
}

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

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    });
    return token.data;
  } catch {
    return null;
  }
}

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
    return "/(tabs)";
  }
  return null;
}

function getNotificationData(raw) {
  const content = raw?.request?.content || raw?.notification?.request?.content || raw || {};
  return content.data || raw?.metadata || raw?.data || {};
}

function normalizeIncomingNotification(raw) {
  const content = raw?.request?.content || raw?.notification?.request?.content || raw || {};
  const data = getNotificationData(raw);
  const id =
    raw?.id ||
    raw?.notificationId ||
    raw?.request?.identifier ||
    data?.notificationId ||
    data?.id ||
    createRandomId("notification");

  return {
    id: String(id),
    title: content.title || raw?.title || "Thông báo mới",
    body: content.body || content.message || raw?.body || raw?.message || "",
    data,
    recipientId: raw?.id || data?.recipientId || null,
  };
}

function ForegroundNotificationBanner({ notification, onPress, onDismiss }) {
  const translate = useRef(new Animated.ValueXY({ x: 0, y: -80 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  const dismiss = useCallback(
    (toValue = { x: 0, y: -100 }) => {
      Animated.parallel([
        Animated.timing(translate, {
          toValue,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(onDismiss);
    },
    [onDismiss, opacity, translate],
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 8,
      onPanResponderMove: Animated.event(
        [null, { dx: translate.x, dy: translate.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -28) {
          dismiss({ x: 0, y: -110 });
          return;
        }
        if (Math.abs(gesture.dx) > 52) {
          dismiss({ x: gesture.dx > 0 ? screenWidth : -screenWidth, y: 0 });
          return;
        }
        Animated.spring(translate, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  useEffect(() => {
    translate.setValue({ x: 0, y: -80 });
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translate, {
        toValue: { x: 0, y: 0 },
        damping: 18,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => dismiss(), BANNER_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [dismiss, notification?.id, opacity, translate]);

  if (!notification) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.bannerHost,
        { opacity, transform: translate.getTranslateTransform() },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.banner}
      >
        <View style={styles.bannerIcon}>
          <Ionicons name="notifications" size={19} color="#0F172A" />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          {!!notification.body && (
            <Text style={styles.bannerBody} numberOfLines={2}>
              {notification.body}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </Pressable>
    </Animated.View>
  );
}

const NotificationContext = createContext(null);

export function useNotificationActions() {
  return useContext(NotificationContext) ?? {
    setBadgeCount: () => {},
    clearBadge: () => {},
  };
}

export function NotificationProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id || null);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const lastSyncedRef = useRef({ userId: null, pushToken: null });
  const seenBannerIdsRef = useRef([]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeBanner, setActiveBanner] = useState(null);
  const [bannerQueue, setBannerQueue] = useState([]);

  const setBadgeCount = useCallback(async (count) => {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Badge support varies by Android launcher.
    }
  }, []);

  const clearBadge = useCallback(() => setBadgeCount(0), [setBadgeCount]);

  const invalidateNotificationQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.notifications.all(),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.notifications.unreadCount(),
    });
  }, [queryClient]);

  const enqueueBanner = useCallback((rawNotification) => {
    const notification = normalizeIncomingNotification(rawNotification);
    if (!notification.title && !notification.body) return;
    if (seenBannerIdsRef.current.includes(notification.id)) return;

    seenBannerIdsRef.current = [
      notification.id,
      ...seenBannerIdsRef.current,
    ].slice(0, 20);

    setBannerQueue((prev) =>
      [...prev, notification]
        .filter(
          (item, index, items) =>
            items.findIndex((candidate) => candidate.id === item.id) === index,
        )
        .slice(-MAX_BANNER_QUEUE),
    );
  }, []);

  const dismissBanner = useCallback(() => {
    setActiveBanner(null);
  }, []);

  const handleBannerPress = useCallback(() => {
    if (!activeBanner) return;

    if (activeBanner.recipientId) {
      apiClient
        .put(ENDPOINTS.notifications.markRead(activeBanner.recipientId))
        .catch(() => {});
    }
    invalidateNotificationQueries();

    const route = resolveNotificationRoute(activeBanner.data);
    dismissBanner();
    if (route) router.push(route);
  }, [activeBanner, dismissBanner, invalidateNotificationQueries, router]);

  useEffect(() => {
    if (activeBanner || bannerQueue.length === 0) return;
    const [next, ...rest] = bannerQueue;
    setActiveBanner(next);
    setBannerQueue(rest);
  }, [activeBanner, bannerQueue]);

  useEffect(() => {
    if (!Notifications) return;

    const handleColdStart = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        const data = response?.notification?.request?.content?.data;
        const route = resolveNotificationRoute(data);
        if (route) {
          setTimeout(() => router.push(route), 500);
        }
      } catch {
        // Non-critical: route will still work for warm responses.
      }
    };

    void handleColdStart();

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data;
        const route = resolveNotificationRoute(data);
        if (route) router.push(route);
      });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const handleSocketNotification = (notification) => {
      invalidateNotificationQueries();
      enqueueBanner(notification);
    };

    const handleAnnouncement = (announcement) => {
      invalidateNotificationQueries();
      enqueueBanner(announcement);
    };

    let pushCleanup = () => {};
    if (Notifications) {
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          invalidateNotificationQueries();
          enqueueBanner(notification);
        },
      );
      pushCleanup = () => receivedSubscription.remove();
    }

    let socketCleanup = () => {};
    try {
      const { getSocket } = require("../utils/socket");
      const socket = getSocket();
      if (socket) {
        socket.on("notification", handleSocketNotification);
        socket.on("announcement", handleAnnouncement);
        socketCleanup = () => {
          socket.off("notification", handleSocketNotification);
          socket.off("announcement", handleAnnouncement);
        };
      }
    } catch {
      // Socket is optional for screens that mount before realtime is ready.
    }

    return () => {
      pushCleanup();
      socketCleanup();
    };
  }, [enqueueBanner, invalidateNotificationQueries]);

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
        // Notification sync is non-blocking for auth flow.
      }
    };

    void syncPushToken();

    return () => {
      cancelled = true;
    };
  }, [accessToken, isHydrated, userId]);

  useEffect(() => {
    if (!accessToken) {
      clearBadge();
    }
  }, [accessToken, clearBadge]);

  return (
    <NotificationContext.Provider value={{ setBadgeCount, clearBadge }}>
      {children}
      <ForegroundNotificationBanner
        notification={activeBanner}
        onPress={handleBannerPress}
        onDismiss={dismissBanner}
      />
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  bannerHost: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 54,
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    minHeight: 70,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  bannerBody: {
    marginTop: 2,
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },
});
