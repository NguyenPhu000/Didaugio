import { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
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
    <View className="flex-row items-center justify-between px-5 py-[14px]">
      <Pressable onPress={() => router.back()} className="p-1">
        <MaterialIcons name="arrow-back" size={26} color="#0F172A" />
      </Pressable>
      <Text
        style={{ fontFamily: TOKENS.font.semibold }}
        className="text-lg text-[#0F172A]"
      >
        HỒ SƠ
      </Text>
      <View className="flex-row items-center gap-[10px]">
        <NotificationBell size={42} />
        <Pressable onPress={onSettingsPress} className="p-1">
          <MaterialIcons name="settings" size={26} color="#64748B" />
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
    <View className="mt-2">
      <Text
        style={{ fontFamily: TOKENS.font.semibold }}
        className="text-xl text-[#0F172A]"
      >
        Cài đặt
      </Text>
      <View
        className="bg-white rounded-[20px] py-1 mt-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {settingsItems.map((item, index) => (
          <Pressable
            key={index}
            className="flex-row items-center py-4 px-5 gap-4"
            onPress={() => router.push(item.route)}
          >
            <MaterialIcons name={item.icon} size={24} color="#64748B" />
            <Text
              style={{ fontFamily: TOKENS.font.medium }}
              className="flex-grow text-base text-[#0F172A]"
            >
              {item.label}
            </Text>
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
              <MaterialIcons
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
            Đăng nhập để mở khóa hồ sơ
          </Text>
          <Text
            style={{ fontFamily: TOKENS.font.regular }}
            className="text-[15px] text-[#64748B] text-center leading-[23px] max-w-[320px]"
          >
            Theo dõi chuyến đi, lưu kỷ niệm và đồng bộ dữ liệu trên mọi thiết bị.
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
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[15px] text-white tracking-[0.2px]"
            >
              Đăng nhập
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
            <MaterialIcons name="person-add-alt-1" size={18} color="#fff" />
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-[15px] text-white tracking-[0.2px]"
            >
              Đăng ký tài khoản mới
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
              Khám phá bản đồ
            </Text>
          </Pressable>

          {/* Hint */}
          <Text
            style={{ fontFamily: TOKENS.font.regular }}
            className="mt-[18px] text-xs text-[#94A3B8] text-center"
          >
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
  const [displayLocation, setDisplayLocation] = useState("Đang tải địa chỉ...");

  const displayName = getDisplayName(profile, storedUser);
  const avatarUri = getAvatarUri(profile, storedUser);
  const bio = getBio(profile, storedUser);
  const tripsCount = trips?.length || 0;
  const stats = buildStats(profile, storedUser, tripsCount);

  useEffect(() => {
    let isMounted = true;

    async function loadFullAddress() {
      const addressDetail = profile?.address || profile?.profile?.address || "";
      const pCode = profile?.provinceCode || profile?.profile?.provinceCode || "";
      const dCode = profile?.districtCode || profile?.profile?.districtCode || "";

      if (!pCode) {
        if (isMounted) {
          setDisplayLocation(addressDetail || "Chưa cập nhật địa chỉ");
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
          setDisplayLocation(fullAddress || "Chưa cập nhật địa chỉ");
        }
      } catch (error) {
        console.error("Error loading address labels:", error);
        if (isMounted) {
          setDisplayLocation(addressDetail || "Chưa cập nhật địa chỉ");
        }
      }
    }

    loadFullAddress();

    return () => {
      isMounted = false;
    };
  }, [profile?.address, profile?.provinceCode, profile?.districtCode]);

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
            <MaterialIcons name="location-on" size={16} color={ACCENT_BLUE} />
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
                Chỉnh sửa hồ sơ
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
                Chia sẻ hồ sơ
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
                Chuyến đi sắp tới
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/trips")}>
                <Text
                  style={{ fontFamily: TOKENS.font.semibold }}
                  className="text-[15px] text-[#3478F6]"
                >
                  Xem tất cả
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
          <View className="mt-6 px-6">
            <Text
              style={{ fontFamily: TOKENS.font.semibold }}
              className="text-xl text-[#0F172A]"
            >
              Kỷ niệm
            </Text>
            <MemoriesSection completedTrips={completedTrips} />
          </View>

          {/* Settings - exactly like second image */}
          <View className="mt-6 px-6">
            <SettingsSection />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
