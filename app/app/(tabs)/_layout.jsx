import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

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
    key: "saved",
    labelKey: "tabs.saved",
    icon: "bookmark",
    route: "/(tabs)/saved",
    color: TAB_ACTIVE_SECONDARY,
  },
  {
    key: "trips",
    labelKey: "tabs.trips",
    icon: "luggage",
    route: "/(tabs)/trips",
    color: TAB_ACTIVE_SECONDARY,
  },
];

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

function FloatingBottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const currentKey = useMemo(() => resolveTabKey(pathname), [pathname]);
  const hideForImmersiveRoute = currentKey === "ai";

  const bottom = Math.max(insets.bottom, 8) + EXTRA_FLOAT_LIFT;

  if (hideForImmersiveRoute) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.floatingOuter, { marginBottom: bottom }]}>
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
      </View>
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
    shadowColor: TAB_ACTIVE_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="map" />
        <Tabs.Screen name="ai" />
        <Tabs.Screen name="trips" />
        <Tabs.Screen name="saved" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingBottomTabBar />
    </View>
  );
}
