import { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Nâng thanh tab cao hơn so với mép đáy (cộng thêm vào safe area). */
const EXTRA_FLOAT_LIFT = 26;

/**
 * Khoảng đẩy bottom sheet / nội dung map (thanh nổi + lift + đệm).
 */
/** Đủ chỗ cho thanh nổi (safe + lift + pill) — chỉnh nếu sheet/map vẫn chồng tab */
export const FLOATING_TAB_CLEARANCE = 118;

/** Padding đáy ScrollView (explore, …) */
export const TAB_BAR_HEIGHT = FLOATING_TAB_CLEARANCE + 8;

/** Màu highlight tab đang chọn — xanh đậm kiểu TripNest */
const TAB_ACTIVE_BLUE = "#3B82F6";

const TABS = [
  { key: "explore", label: "Khám phá", icon: "explore", route: "/(tabs)/explore" },
  { key: "map", label: "Bản đồ", icon: "map", route: "/(tabs)/map" },
  { key: "ai", label: "AI", icon: "auto-awesome", route: "/(tabs)/ai" },
  { key: "trips", label: "Chuyến đi", icon: "luggage", route: "/(tabs)/trips" },
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

  const currentKey = useMemo(() => resolveTabKey(pathname), [pathname]);

  const bottom = Math.max(insets.bottom, 8) + EXTRA_FLOAT_LIFT;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.floatingOuter, { marginBottom: bottom }]}>
        <BlurView
          intensity={Platform.OS === "ios" ? 100 : 85}
          tint="dark"
          style={styles.blurFill}
        >
          {/* Lớp phủ rất nhẹ — trong suốt, để mờ mờ lộ map/content */}
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
                  accessibilityLabel={tab.label}
                  style={({ pressed }) => [
                    styles.tabPress,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      !active && styles.iconCircleIdle,
                      active && styles.iconCircleActive,
                    ]}
                  >
                    <MaterialIcons
                      name={tab.icon}
                      size={22}
                      color={active ? "#FFFFFF" : "rgba(255,255,255,0.78)"}
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: {
        elevation: 22,
      },
    }),
  },
  blurFill: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
  },
  /** Lớp phủ rất nhẹ — trong suốt hơn để thấy blur phía sau */
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,10,18,0.18)",
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
  /** Vòng tròn — khít như mockup */
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleIdle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  /** Tab đang chọn — vòng tròn xanh đặc như mockup */
  iconCircleActive: {
    backgroundColor: TAB_ACTIVE_BLUE,
    borderWidth: 0,
    shadowColor: TAB_ACTIVE_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
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
