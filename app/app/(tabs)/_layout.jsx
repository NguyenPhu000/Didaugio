import { useCallback, useEffect, useMemo } from "react";
import { InteractionManager, Platform, Pressable, StyleSheet, View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { getCmsExploreLandingApi } from "../../src/api/cms";
import { QUERY_KEYS } from "../../src/constants/query-keys";
import { getHomeApi as getExploreHomeApi } from "../../src/modules/explore/api/exploreApi";
import { getMapPlacesApi } from "../../src/modules/map/api/mapApi";
import { useAuthStore } from "../../src/stores/authStore";

/** Nang thanh tab cao hon so voi mep day (cong them vao safe area). */
const EXTRA_FLOAT_LIFT = 26;

/**
 * Khoang day bottom sheet / noi dung map (thanh noi + lift + dem).
 */
/** Du cho thanh noi (safe + lift + pill) - chinh neu sheet/map van chong tab */
export const FLOATING_TAB_CLEARANCE = 118;

/** Padding day ScrollView (explore, ...) */
export const TAB_BAR_HEIGHT = FLOATING_TAB_CLEARANCE + 8;

/** Mau tab theo phong cach Stitch: neo dam + surface sang. */
const TAB_ACTIVE_BLUE = "#101E2C";
const TAB_ACTIVE_SECONDARY = "#101E2C";
const TAB_IDLE_ICON = "#54647A";

const TABS = [
  {
    key: "map",
    labelKey: "tabs.map",
    icon: "location-on",
    route: "/(tabs)/map",
    color: TAB_ACTIVE_BLUE,
  },
  {
    key: "explore",
    labelKey: "tabs.explore",
    icon: "explore",
    route: "/(tabs)/explore",
    color: TAB_ACTIVE_BLUE,
  },
  {
    key: "trips",
    labelKey: "tabs.trips",
    icon: "luggage",
    route: "/(tabs)/trips",
    color: TAB_ACTIVE_SECONDARY,
  },
  {
    key: "saved",
    labelKey: "tabs.saved",
    icon: "bookmark",
    route: "/(tabs)/saved",
    color: TAB_ACTIVE_SECONDARY,
  },
];
const SWIPE_TAB_KEYS = TABS.map((tab) => tab.key);
const SWIPE_DISTANCE = 34;
const SWIPE_VELOCITY = 360;
const MAX_DRAG_OFFSET = 12;
const MAP_PLACES_PREFETCH_LIMIT = 500;
const PUBLIC_PREFETCH_STALE_TIME = 5 * 60 * 1000;

function resolveTabKey(pathname) {
  if (!pathname) return "explore";
  const p = pathname.toLowerCase();
  if (p.includes("/map")) return "map";
  if (p.includes("/ai")) return "ai";
  if (p.includes("/trips")) return "trips";
  if (p.includes("/saved")) return "saved";
  if (p.includes("/profile")) return "profile";
  if (p.includes("/explore")) return "explore";
  return "explore";
}

function forStackedCardTransition({ current }) {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0.88, 1, 0.92],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-18, 0, 22],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0.985, 1, 0.99],
          }),
        },
      ],
    },
  };
}

function prefetchTabData(queryClient, isLoggedIn) {
  // Chỉ prefetch các dữ liệu tĩnh hoặc thiết yếu cho màn hình đầu tiên (Explore/Map)
  queryClient.prefetchQuery({
    queryKey: ["cms-explore-landing"],
    queryFn: () => getCmsExploreLandingApi().then((res) => res?.data || res),
    staleTime: PUBLIC_PREFETCH_STALE_TIME,
  });

  queryClient.prefetchQuery({
    queryKey: ["home-categories"],
    queryFn: () => getExploreHomeApi({ limit: 1 }),
    staleTime: 10 * 60 * 1000,
  });

  queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.places.list({
      status: "approved",
      limit: MAP_PLACES_PREFETCH_LIMIT,
    }),
    queryFn: () => getMapPlacesApi({ limit: MAP_PLACES_PREFETCH_LIMIT }),
    staleTime: PUBLIC_PREFETCH_STALE_TIME,
  });
}

function FloatingBottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const currentKey = useMemo(() => resolveTabKey(pathname), [pathname]);
  const hideForImmersiveRoute = currentKey === "ai";
  const dragX = useSharedValue(0);
  const dragActive = useSharedValue(0);

  const bottom = Math.max(insets.bottom, 8) + EXTRA_FLOAT_LIFT;

  const navigateBySwipe = useCallback(
    (direction) => {
      const currentIndex = SWIPE_TAB_KEYS.indexOf(currentKey);
      if (currentIndex < 0) return;

      const nextIndex = currentIndex + direction;
      const nextTab = TABS[nextIndex];
      if (!nextTab) return;

      router.replace(nextTab.route);
    },
    [currentKey, router],
  );

  const tabSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          dragActive.value = withTiming(1, { duration: 110 });
        })
        .onUpdate((event) => {
          const clamped = Math.max(
            -MAX_DRAG_OFFSET,
            Math.min(MAX_DRAG_OFFSET, event.translationX * 0.16),
          );
          dragX.value = clamped;
        })
        .onEnd((event) => {
          const shouldSwipe =
            Math.abs(event.translationX) > SWIPE_DISTANCE ||
            Math.abs(event.velocityX) > SWIPE_VELOCITY;

          dragActive.value = withTiming(0, { duration: 140 });
          dragX.value = withSpring(0, { damping: 18, stiffness: 240 });

          if (!shouldSwipe) {
            return;
          }

          runOnJS(navigateBySwipe)(event.translationX < 0 ? 1 : -1);
        })
        .onFinalize(() => {
          dragActive.value = withTiming(0, { duration: 140 });
          dragX.value = withSpring(0, { damping: 18, stiffness: 240 });
        }),
    [dragActive, dragX, navigateBySwipe],
  );

  const animatedBarStyle = useAnimatedStyle(() => {
    const dragDistance = Math.abs(dragX.value);
    return {
      opacity: interpolate(dragActive.value, [0, 1], [1, 0.96]),
      transform: [
        { translateX: dragX.value },
        { scale: interpolate(dragDistance, [0, MAX_DRAG_OFFSET], [1, 0.985]) },
      ],
    };
  });

  if (hideForImmersiveRoute) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <GestureDetector gesture={tabSwipeGesture}>
        <Animated.View style={[styles.floatingOuter, { marginBottom: bottom }, animatedBarStyle]}>
          <BlurView
            intensity={Platform.OS === "ios" ? 100 : 85}
            tint="light"
            style={styles.blurFill}
          >
            <View style={styles.glassTint} />
            <View style={styles.barRow}>
              {TABS.map((tab) => {
                const active = tab.key === currentKey;
                const onNavigate = () => {
                  if (active) return;
                  router.push(tab.route);
                };

                return (
                  <Pressable
                    key={tab.key}
                    onPress={onNavigate}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(tab.labelKey)}
                    style={({ pressed }) => [
                      styles.tabPress,
                      pressed && { opacity: 0.88 },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        !active && styles.iconCircleIdle,
                        active && [
                          styles.iconCircleActive,
                          { backgroundColor: tab.color },
                        ],
                      ]}
                    >
                      <MaterialIconsRounded
                        name={tab.icon}
                        size={22}
                        color={active ? "#FFFFFF" : TAB_IDLE_ICON}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </BlurView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  floatingOuter: {
    alignSelf: "center",
    marginHorizontal: 16,
    borderRadius: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  blurFill: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(116,119,124,0.2)",
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 50,
  },
  tabPress: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleIdle: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.66)",
  },
  iconCircleActive: {
    backgroundColor: TAB_ACTIVE_BLUE,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: TAB_ACTIVE_BLUE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default function TabsLayout() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isLoggedIn = !!accessToken && !isGuest;

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      prefetchTabData(queryClient, isLoggedIn);
    });

    return () => {
      task.cancel?.();
    };
  }, [isLoggedIn, queryClient]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          sceneStyleInterpolator: forStackedCardTransition,
          transitionSpec: {
            animation: "timing",
            config: {
              duration: 170,
            },
          },
        }}
      >
        <Tabs.Screen name="map" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="trips" />
        <Tabs.Screen name="saved" />
        <Tabs.Screen name="ai" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingBottomTabBar />
    </View>
  );
}
