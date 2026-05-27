import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "../../src/modules/profile/hooks/useProfile";
import { useAuthStore } from "../../src/stores/authStore";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { TAB_SCREEN_PADDING, TAB_THEME } from "./tabTheme";
import { UpcomingTripCard } from "../../src/modules/profile/components/UpcomingTripCard";
import { MemoriesSection } from "../../src/modules/profile/components/MemoriesSection";
import { resolveMediaUrl } from "../../src/lib/media-url";
import { NotificationBell } from "../../src/components/composed/NotificationBell";

const ACCENT_BLUE = "#3478F6";

/* ====================== HELPERS ====================== */
function getDisplayName(profile, storedUser) {
  return (
    profile?.fullName ||
    profile?.profile?.fullName ||
    storedUser?.profile?.fullName ||
    storedUser?.fullName ||
    storedUser?.email?.split("@")[0] ||
    "Lữ khách"
  );
}

function getAvatarUri(profile, storedUser) {
  return resolveMediaUrl(
    profile?.avatar ||
      profile?.profile?.avatar ||
      storedUser?.profile?.avatar ||
      storedUser?.avatar ||
      null,
  );
}

function getLocation(profile, storedUser) {
  return (
    profile?.address ||
    profile?.profile?.address ||
    storedUser?.profile?.address ||
    storedUser?.address ||
    "Chưa cập nhật địa chỉ"
  );
}

function getBio(profile, storedUser) {
  return (
    profile?.bio ||
    profile?.profile?.bio ||
    storedUser?.profile?.bio ||
    storedUser?.bio ||
    ""
  );
}

function formatCompactNumber(value) {
  const num = Number(value || 0);
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
}

function buildStats(profile, storedUser, tripsCount = 0) {
  const reviewsCount = profile?.stats?.reviewsCount || 0;
  const savedCount = profile?.stats?.savedCount || 0;

  return [
    {
      key: "trips",
      value: formatCompactNumber(tripsCount),
      label: "CHUYẾN ĐI",
    },
    {
      key: "reviews",
      value: formatCompactNumber(reviewsCount),
      label: "ĐÁNH GIÁ",
    },
    {
      key: "saved",
      value: formatCompactNumber(savedCount),
      label: "ĐÃ LƯU",
    },
  ];
}

/* ====================== SUB COMPONENTS ====================== */
function ProfileHeader({ onSettingsPress }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={26} color="#0F172A" />
      </Pressable>
      <Text style={styles.headerTitle}>HỒ SƠ</Text>
      <View style={styles.headerRight}>
        <NotificationBell size={42} />
        <Pressable onPress={onSettingsPress} style={styles.settingsBtn}>
          <MaterialIcons name="settings" size={26} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}

function AvatarBlock({ avatarUri, displayName }) {
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarRing}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {displayName[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SettingsSection() {
  const router = useRouter();

  const settingsItems = [
    {
      icon: "confirmation-number",
      label: "Booking của tôi",
      route: "/profile/bookings",
    },
    {
      icon: "bookmark",
      label: "Địa điểm đã lưu",
      route: "/(tabs)/saved",
    },
    {
      icon: "credit-card",
      label: "Phương thức thanh toán",
      route: "/profile/payment-methods",
    },
    {
      icon: "notifications",
      label: "Thông báo",
      route: "/profile/notifications",
    },
  ];

  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Cài đặt</Text>
      <View style={styles.settingsList}>
        {settingsItems.map((item, index) => (
          <Pressable
            key={index}
            style={styles.settingItem}
            onPress={() => router.push(item.route)}
          >
            <MaterialIcons name={item.icon} size={24} color="#64748B" />
            <Text style={styles.settingLabel}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#64748B" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ====================== MAIN ====================== */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);
  const isLoggedIn = Boolean(accessToken) && !isGuest;

  if (!isLoggedIn) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ProfileHeader
          onSettingsPress={() => router.push("/profile/settings")}
        />
        <ScrollView
          style={styles.guestScroll}
          contentContainerStyle={[
            styles.guestContainer,
            { paddingBottom: TAB_BAR_HEIGHT + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Icon block */}
          <View style={styles.guestIconOuter}>
            <View style={styles.guestIconRing} />
            <View style={styles.guestIconWrap}>
              <MaterialIcons
                name="person-outline"
                size={40}
                color={ACCENT_BLUE}
              />
            </View>
          </View>

          {/* Text */}
          <Text style={styles.guestTitle}>Đăng nhập để mở khóa hồ sơ</Text>
          <Text style={styles.guestSubtitle}>
            Theo dõi chuyến đi, lưu kỷ niệm và đồng bộ dữ liệu trên mọi thiết
            bị.
          </Text>

          {/* Divider */}
          <View style={styles.guestDivider} />

          {/* Nút đăng nhập */}
          <Pressable
            onPress={() => {
              exitGuestMode();
              router.navigate("/(auth)/login");
            }}
            style={({ pressed }) => [
              styles.guestPrimaryBtn,
              pressed && styles.guestPressedScale,
            ]}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text style={styles.guestPrimaryText}>Đăng nhập</Text>
          </Pressable>

          {/* Nút đăng ký */}
          <Pressable
            onPress={() => {
              exitGuestMode();
              router.navigate("/(auth)/register");
            }}
            style={({ pressed }) => [
              styles.guestRegisterBtn,
              pressed && styles.guestPressedScale,
            ]}
          >
            <MaterialIcons name="person-add-alt-1" size={18} color="#fff" />
            <Text style={styles.guestRegisterText}>Đăng ký tài khoản mới</Text>
          </Pressable>

          {/* Nút khám phá */}
          <Pressable
            onPress={() => router.push("/(tabs)/map")}
            style={({ pressed }) => [
              styles.guestSecondaryBtn,
              pressed && styles.guestPressedScale,
            ]}
          >
            <Text style={styles.guestSecondaryText}>Khám phá bản đồ</Text>
          </Pressable>

          {/* Hint */}
          <Text style={styles.guestHint}>
            Miễn phí · Không cần thẻ tín dụng
          </Text>
        </ScrollView>
      </View>
    );
  }

  return <LoggedInProfileScreen insets={insets} storedUser={storedUser} />;
}

function LoggedInProfileScreen({ insets, storedUser }) {
  const router = useRouter();
  const { data: profile, isLoading, refetch, isRefetching } = useProfile(true);
  const { data: trips = [] } = useTrips(true);

  const displayName = getDisplayName(profile, storedUser);
  const avatarUri = getAvatarUri(profile, storedUser);
  const location = getLocation(profile, storedUser);
  const bio = getBio(profile, storedUser);
  const tripsCount = trips?.length || 0;
  const stats = buildStats(profile, storedUser, tripsCount);

  const upcomingTrip =
    trips.find((t) => t?.status !== "completed" && t?.status !== "cancelled") ||
    null;
  const completedTrips = trips
    .filter((t) => t?.status === "completed")
    .slice(0, 4);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${displayName}'s profile on Đi Đâu Giờ!`,
      });
    } catch {}
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ProfileHeader onSettingsPress={() => router.push("/profile/settings")} />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ACCENT_BLUE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {/* Avatar */}
          <AvatarBlock avatarUri={avatarUri} displayName={displayName} />

          {/* Name + Location */}
          <Text style={styles.username}>{displayName}</Text>
          {bio ? (
            <Text style={styles.bioText} numberOfLines={2}>
              {bio}
            </Text>
          ) : null}
          <View style={styles.locationPill}>
            <MaterialIcons name="location-on" size={16} color={ACCENT_BLUE} />
            <Text style={styles.locationText}>{location}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => router.push("/profile/edit")}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Chỉnh sửa hồ sơ</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Chia sẻ hồ sơ</Text>
            </Pressable>
          </View>

          {/* Stats - exactly like mockup */}
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.key} style={styles.statBox}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Upcoming Trip - exactly like first image */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chuyến đi sắp tới</Text>
              <Pressable onPress={() => router.push("/(tabs)/trips")}>
                <Text style={styles.viewAll}>Xem tất cả</Text>
              </Pressable>
            </View>
            {upcomingTrip ? (
              <UpcomingTripCard
                trip={upcomingTrip}
                onPress={() => router.push(`/trip/${upcomingTrip.id}`)}
              />
            ) : (
              <View
                style={[
                  styles.upcomingCard,
                  {
                    height: 120,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    elevation: 0,
                  },
                ]}
              >
                <MaterialIcons
                  name="travel-explore"
                  size={28}
                  color="#CBD5E1"
                />
                <Text
                  style={{
                    marginTop: 8,
                    color: "#64748B",
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  Chưa có chuyến đi nào sắp tới
                </Text>
              </View>
            )}
          </View>

          {/* Memories - exactly like second image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kỷ niệm</Text>
            <MemoriesSection completedTrips={completedTrips} />
          </View>

          {/* Settings - exactly like second image */}
          <View style={styles.section}>
            <SettingsSection />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/* ====================== STYLES (pixel-perfect with mockup) ====================== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: TAB_BAR_HEIGHT + 84 },

  guestScroll: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  guestContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    justifyContent: "center",
  },

  guestIconOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  guestIconRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(52,120,246,0.08)",
  },
  guestIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },
  guestTitle: {
    fontSize: 24,
    fontFamily: TOKENS.font.heading,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  guestSubtitle: {
    fontSize: 15,
    fontFamily: TOKENS.font.regular,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
  },

  guestDivider: {
    width: 48,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginVertical: 28,
  },

  guestPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: ACCENT_BLUE,
    marginBottom: 12,
    shadowColor: ACCENT_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  guestPrimaryText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  guestRegisterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "#0F172A",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  guestRegisterText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  guestSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  guestSecondaryText: {
    color: "#334155",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },

  guestPressedScale: {
    opacity: 0.88,
    transform: [{ scale: 0.975 }],
  },

  guestHint: {
    marginTop: 18,
    fontSize: 12,
    fontFamily: TOKENS.font.regular,
    color: "#94A3B8",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    color: "#0F172A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsBtn: { padding: 4 },

  avatarContainer: { alignItems: "center", marginTop: 12 },
  avatarRing: {
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: "#fff",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: { width: 110, height: 110, borderRadius: 999 },
  avatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "#E0F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 46,
    fontFamily: TOKENS.font.heading,
    color: ACCENT_BLUE,
  },

  username: {
    textAlign: "center",
    fontSize: 24,
    fontFamily: TOKENS.font.heading,
    color: "#0F172A",
    marginTop: 16,
  },
  bioText: {
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 32,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    fontFamily: TOKENS.font.regular,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: ACCENT_BLUE,
    fontFamily: TOKENS.font.semibold,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: ACCENT_BLUE,
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: "center",
  },
  outlineBtnText: {
    color: "#334155",
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 28,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statNumber: {
    fontSize: 26,
    fontFamily: TOKENS.font.heading,
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 6,
    textTransform: "uppercase",
    fontFamily: TOKENS.font.medium,
  },

  /* Section common */
  section: { marginTop: 24, paddingHorizontal: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: TOKENS.font.semibold,
    color: "#0F172A",
  },
  viewAll: {
    fontSize: 15,
    color: ACCENT_BLUE,
    fontFamily: TOKENS.font.semibold,
  },

  /* Settings */
  settingsContainer: { marginTop: 8 },
  settingsList: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: TOKENS.font.medium,
    color: "#0F172A",
  },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
});
