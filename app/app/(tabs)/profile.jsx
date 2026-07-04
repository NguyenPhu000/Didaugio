import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "../../src/modules/profile/hooks/useProfile";
import { useAuthStore } from "../../src/stores/authStore";
import { useTrips } from "../../src/modules/trips/hooks/useTrips";
import { TOKENS } from "../../src/constants/design-tokens";
import { TAB_BAR_HEIGHT } from "./_layout";
import { UpcomingTripCard } from "../../src/modules/profile/components/UpcomingTripCard";
import { MemoriesSection } from "../../src/modules/profile/components/MemoriesSection";
import { resolveMediaUrl } from "../../src/lib/media-url";
import { NotificationBell } from "../../src/components/composed/NotificationBell";
import { locationService } from "../../src/apis/locationService";
import { useTranslation } from "react-i18next";
import * as Settings from "../../src/components/reacticx/settings-v1/components";

const ACCENT_BLUE = "#3478F6";

/* ====================== HELPERS ====================== */
function getDisplayName(profile, storedUser, t) {
  return (
    profile?.fullName ||
    profile?.profile?.fullName ||
    storedUser?.profile?.fullName ||
    storedUser?.fullName ||
    storedUser?.email?.split("@")[0] ||
    t("profile.guestDefault")
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

function buildStats(profile, storedUser, tripsCount = 0, t) {
  const reviewsCount = profile?.stats?.reviews || 0;
  const savedCount = profile?.stats?.favorites || 0;
  const finalTripsCount = profile?.stats?.trips ?? tripsCount;

  return [
    {
      key: "trips",
      value: formatCompactNumber(finalTripsCount),
      label: t("profile.stats.trips"),
    },
    {
      key: "reviews",
      value: formatCompactNumber(reviewsCount),
      label: t("profile.stats.reviews"),
    },
    {
      key: "saved",
      value: formatCompactNumber(savedCount),
      label: t("profile.stats.saved"),
    },
  ];
}

function CustomToast({ message, visible, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 120,
        left: 24,
        right: 24,
        opacity,
        zIndex: 9999,
        transform: [
          {
            translateY: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [15, 0],
            }),
          },
        ],
      }}
    >
      <View
        className="flex-row items-center gap-3 rounded-2xl border px-4 py-3 bg-slate-900 border-slate-800"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <MaterialIconsRounded name="info-outline" size={20} color="#F59E0B" style={{ marginRight: 6 }} />
        <Text
          style={{ fontFamily: TOKENS.font.medium }}
          className="text-white text-[13.5px] flex-1 leading-5"
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ====================== SUB COMPONENTS ====================== */
function ProfileHeader({ onSettingsPress }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 py-[14px]">
      <Pressable onPress={() => router.back()} className="p-1">
        <MaterialIconsRounded name="arrow-back" size={26} color="#0F172A" />
      </Pressable>
      <Text
        style={{ fontFamily: TOKENS.font.semibold }}
        className="text-lg text-[#0F172A]"
      >
        {t("profile.title")}
      </Text>
      <View className="flex-row items-center gap-[10px]">
        <NotificationBell size={42} />
        <Pressable onPress={onSettingsPress} className="p-1">
          <MaterialIconsRounded name="settings" size={26} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}

function AvatarBlock({ avatarUri, displayName }) {
  return (
    <View className="items-center mt-3">
      <View
        className="w-[118px] h-[118px] rounded-full bg-white p-1"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 110, height: 110, borderRadius: 55 }}
            className="w-[110px] h-[110px] rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="w-[110px] h-[110px] rounded-full bg-[#E0F0FF] items-center justify-center">
            <Text
              style={{ fontFamily: TOKENS.font.heading }}
              className="text-[46px] text-[#3478F6]"
            >
              {displayName[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SettingsSection({ onSoonFeature }) {
  const { t } = useTranslation();
  const router = useRouter();

  const settingsItems = [
    {
      icon: "confirmation-number",
      iconColor: "#8E8E93",
      label: t("profile.settingsItems.myBookings"),
      route: "/profile/bookings",
    },
    {
      icon: "bookmark",
      iconColor: "#8E8E93",
      label: t("profile.settingsItems.savedPlaces"),
      route: "/(tabs)/saved",
    },
    {
      icon: "credit-card",
      iconColor: "#8E8E93",
      label: t("profile.settingsItems.paymentMethods"),
      onPress: () => onSoonFeature(t("profile.settingsItems.paymentMethods")),
    },
    {
      icon: "notifications",
      iconColor: "#8E8E93",
      label: t("profile.settingsItems.notifications"),
      route: "/profile/notifications",
    },
  ];

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontFamily: TOKENS.font.semibold, fontSize: 20, color: "#0F172A" }}>
        {t("profile.settings")}
      </Text>
      <View style={{ marginTop: 12 }}>
        <Settings.Group style={{ backgroundColor: "#FFFFFF", borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
          {settingsItems.map((item) => (
            <Settings.Item
              key={item.label}
              onPress={item.onPress || (() => router.push(item.route))}
              style={{ minHeight: 52, paddingVertical: 4 }}
            >
              <Settings.Icon
                icon={<MaterialIconsRounded name={item.icon} size={18} color="#FFFFFF" />}
                color={item.iconColor}
                size={30}
                borderRadius={8}
              />
              <Settings.Content>
                <Settings.Title style={{ color: "#0F172A", fontSize: 16, fontFamily: TOKENS.font.medium }}>
                  {item.label}
                </Settings.Title>
              </Settings.Content>
              <Settings.Chevron color="#C7C7CC" size={14} />
            </Settings.Item>
          ))}
        </Settings.Group>
      </View>
    </View>
  );
}

/* ====================== MAIN ====================== */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const storedUser = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);
  const isLoggedIn = Boolean(accessToken) && !isGuest;

  if (!isLoggedIn) {
    return (
      <View
        className="flex-1 bg-[#F8FAFC]"
        style={{ paddingTop: insets.top }}
      >
        <ProfileHeader
          onSettingsPress={() => router.push("/profile/settings")}
        />
        <ScrollView
          className="flex-1 bg-[#F8FAFC]"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingHorizontal: 28,
            justifyContent: "center",
            paddingBottom: TAB_BAR_HEIGHT + 32,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Icon block */}
          <View className="items-center justify-center mb-7">
            <View className="absolute w-[120px] h-[120px] rounded-full bg-[#3478F6]/[0.08]" />
            <View className="w-[88px] h-[88px] rounded-[26px] items-center justify-center bg-[#EAF2FF]">
              <MaterialIconsRounded
                name="person-outline"
                size={40}
                color={ACCENT_BLUE}
              />
            </View>
          </View>

          {/* Text */}
          <Text
            style={{ fontFamily: TOKENS.font.heading }}
            className="text-2xl text-[#0F172A] text-center mb-[10px]"
          >
            {t("profile.guest.title")}
          </Text>
          <Text
            style={{ fontFamily: TOKENS.font.regular }}
            className="text-[15px] text-[#64748B] text-center leading-[23px] max-w-[320px]"
          >
            {t("profile.guest.description")}
          </Text>

          {/* Divider */}
          <View className="w-12 h-[3px] rounded-full bg-[#E2E8F0] my-7" />

          {/* Nút đăng nhập */}
          <Pressable
            onPress={() => {
              exitGuestMode();
              router.navigate("/(auth)/login");
            }}
            style={({ pressed }) => [
              {
                shadowColor: ACCENT_BLUE,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              },
              pressed && { opacity: 0.88, transform: [{ scale: 0.975 }] },
            ]}
            className="flex-row items-center justify-center gap-2 w-full py-4 rounded-full bg-[#3478F6] mb-3"
          >
            <MaterialIconsRounded name="login" size={18} color="#fff" />
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[15px] text-white tracking-[0.2px]"
            >
              {t("profile.guest.login")}
            </Text>
          </Pressable>

          {/* Nút đăng ký */}
          <Pressable
            onPress={() => {
              exitGuestMode();
              router.navigate("/(auth)/register");
            }}
            style={({ pressed }) => [
              {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 10,
                elevation: 6,
              },
              pressed && { opacity: 0.88, transform: [{ scale: 0.975 }] },
            ]}
            className="flex-row items-center justify-center gap-2 w-full py-4 rounded-full bg-[#0F172A] mb-3"
          >
            <MaterialIconsRounded name="person-add-alt-1" size={18} color="#fff" />
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[15px] text-white tracking-[0.2px]"
            >
              {t("profile.guest.register")}
            </Text>
          </Pressable>

          {/* Nút khám phá */}
          <Pressable
            onPress={() => router.push("/(tabs)/map")}
            style={({ pressed }) => pressed && { opacity: 0.88, transform: [{ scale: 0.975 }] }}
            className="flex-row items-center justify-center gap-2 w-full py-4 rounded-full border-[1.5px] border-[#CBD5E1] bg-white"
          >
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[#334155] text-[15px] tracking-[0.2px]"
            >
              {t("profile.guest.explore")}
            </Text>
          </Pressable>

          {/* Hint */}
          <Text
            style={{ fontFamily: TOKENS.font.regular }}
            className="mt-[18px] text-xs text-[#94A3B8] text-center"
          >
            {t("profile.guest.freeNote")}
          </Text>
        </ScrollView>
      </View>
    );
  }

  return <LoggedInProfileScreen insets={insets} storedUser={storedUser} />;
}

function LoggedInProfileScreen({ insets, storedUser }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: profile, isLoading, refetch, isRefetching } = useProfile(true);
  const { data: trips = [] } = useTrips(true);
  const [displayLocation, setDisplayLocation] = useState(t("profile.loadingAddress"));
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleSoonFeature = (title) => {
    setToastMessage(t("profile.comingSoon", { feature: title }));
    setToastVisible(true);
  };

  const displayName = getDisplayName(profile, storedUser, t);
  const avatarUri = getAvatarUri(profile, storedUser);
  const bio = getBio(profile, storedUser);
  const tripsCount = trips?.length || 0;
  const stats = buildStats(profile, storedUser, tripsCount, t);

  useEffect(() => {
    let isMounted = true;

    async function loadFullAddress() {
      const addressDetail = profile?.address || profile?.profile?.address || "";
      const pCode = profile?.provinceCode || profile?.profile?.provinceCode || "";
      const dCode = profile?.districtCode || profile?.profile?.districtCode || "";

      if (!pCode) {
        if (isMounted) {
          setDisplayLocation(addressDetail || t("profile.noAddress"));
        }
        return;
      }

      try {
        // Lấy tên tỉnh
        const provinces = await locationService.getAllProvinces();
        const province = provinces.find((p) => p.province_code === pCode);
        const provinceName = province ? province.name : "";

        let districtName = "";
        if (dCode) {
          // Lấy tên huyện
          const districts = await locationService.getWardsByProvince(pCode);
          const district = districts.find((d) => d.ward_code === dCode);
          districtName = district ? district.ward_name : "";
        }

        const parts = [];
        if (addressDetail) parts.push(addressDetail);
        if (districtName) parts.push(districtName);
        if (provinceName) parts.push(provinceName);

        const fullAddress = parts.join(", ");
        if (isMounted) {
          setDisplayLocation(fullAddress || t("profile.noAddress"));
        }
      } catch (error) {
        console.error("Error loading address labels:", error);
        if (isMounted) {
          setDisplayLocation(addressDetail || t("profile.noAddress"));
        }
      }
    }

    loadFullAddress();

    return () => {
      isMounted = false;
    };
  }, [
    profile?.address,
    profile?.profile?.address,
    profile?.provinceCode,
    profile?.profile?.provinceCode,
    profile?.districtCode,
    profile?.profile?.districtCode,
    t,
  ]);

  const upcomingTrip =
    trips.find((t) => t?.status !== "completed" && t?.status !== "cancelled") ||
    null;
  const completedTrips = trips
    .filter((t) => t?.status === "completed")
    .slice(0, 4);

  const handleShare = async () => {
    try {
      await Share.share({
        message: t("profile.shareMessage", { name: displayName }),
      });
    } catch {}
  };

  return (
    <View
      className="flex-1 bg-[#F8FAFC]"
      style={{ paddingTop: insets.top }}
    >
      <ProfileHeader onSettingsPress={() => router.push("/profile/settings")} />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={ACCENT_BLUE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 84 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {/* Avatar */}
          <AvatarBlock avatarUri={avatarUri} displayName={displayName} />

          {/* Name + Location */}
          <Text
            style={{ fontFamily: TOKENS.font.heading }}
            className="text-center text-2xl text-[#0F172A] mt-4"
          >
            {displayName}
          </Text>
          {bio ? (
            <Text
              style={{ fontFamily: TOKENS.font.regular }}
              className="text-center mt-1.5 px-8 text-sm leading-5 text-[#475569]"
              numberOfLines={2}
            >
              {bio}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-1.5 self-center mt-1.5">
            <MaterialIconsRounded name="location-on" size={16} color={ACCENT_BLUE} />
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[13px] text-[#3478F6] text-center px-6"
            >
              {displayLocation}
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 px-6 mt-6">
            <Pressable
              onPress={() => router.push("/profile/edit")}
              className="flex-1 bg-[#3478F6] py-[15px] rounded-full items-center"
            >
              <Text
                style={{ fontFamily: TOKENS.font.semibold }}
                className="text-white text-[15px]"
              >
                {t("profile.actions.editProfile")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              className="flex-1 border-[1.5px] border-[#CBD5E1] py-[15px] rounded-full items-center"
            >
              <Text
                style={{ fontFamily: TOKENS.font.semibold }}
                className="text-[#334155] text-[15px]"
              >
                {t("profile.actions.shareProfile")}
              </Text>
            </Pressable>
          </View>

          {/* Stats - exactly like mockup */}
          <View className="flex-row gap-3 px-6 mt-7">
            {stats.map((stat) => (
              <View
                key={stat.key}
                className="flex-1 bg-white rounded-2xl py-[18px] items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  elevation: 3,
                }}
              >
                <Text
                  style={{ fontFamily: TOKENS.font.heading }}
                  className="text-[26px] text-[#0F172A]"
                >
                  {stat.value}
                </Text>
                <Text
                  style={{ fontFamily: TOKENS.font.medium }}
                  className="text-[10.5px] text-[#64748B] mt-1.5 uppercase"
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Upcoming Trip - exactly like first image */}
          <View className="mt-6 px-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text
                style={{ fontFamily: TOKENS.font.semibold }}
                className="text-xl text-[#0F172A]"
              >
                {t("profile.upcomingTrips")}
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/trips")}>
                <Text
                  style={{ fontFamily: TOKENS.font.semibold }}
                  className="text-[15px] text-[#3478F6]"
                >
                  {t("common.viewAll")}
                </Text>
              </Pressable>
            </View>
            {upcomingTrip ? (
              <UpcomingTripCard
                trip={upcomingTrip}
                onPress={() => router.push(`/trip/${upcomingTrip.id}`)}
              />
            ) : (
              <View
                className="items-center justify-center bg-white border border-[#E2E8F0] rounded-2xl"
                style={{ height: 120 }}
              >
                <MaterialIconsRounded
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
                  {t("profile.noUpcomingTrips")}
                </Text>
              </View>
            )}
          </View>

          {/* Memories - exactly like second image */}
          <View className="mt-6 px-6">
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-xl text-[#0F172A]"
            >
              {t("profile.memories")}
            </Text>
            <MemoriesSection completedTrips={completedTrips} />
          </View>

          {/* Settings - exactly like second image */}
          <View className="mt-6 px-6">
            <SettingsSection onSoonFeature={handleSoonFeature} />
          </View>
        </ScrollView>
      )}
      <CustomToast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}
