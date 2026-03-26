import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useProfile } from "../../src/modules/profile/hooks/useProfile";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useAuthStore } from "../../src/stores/authStore";

const SettingsRow = ({ icon, label, value, onPress, danger, iconBg }) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center px-4 py-3.5 gap-3 active:bg-gray-50"
  >
    <View
      className="w-9 h-9 rounded-[10px] items-center justify-center"
      style={{ backgroundColor: danger ? "#fee2e2" : (iconBg || "#e6f3fb") }}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? "#ef4444" : "#0077b8"}
      />
    </View>
    <View className="flex-1">
      <Text
        className="text-[14px] font-semibold"
        style={{ color: danger ? "#ef4444" : "#111618" }}
      >
        {label}
      </Text>
      {value ? <Text className="text-[12px] text-ink-secondary mt-0.5">{value}</Text> : null}
    </View>
    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
  </Pressable>
);

const StatItem = ({ count, label }) => (
  <View className="flex-1 items-center">
    <Text className="text-[20px] font-bold text-ink">{count ?? 0}</Text>
    <Text className="text-[11px] text-ink-secondary mt-0.5">{label}</Text>
  </View>
);

const GuestProfile = () => {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-10 gap-3">
      <View className="w-24 h-24 rounded-full items-center justify-center mb-2 border-2 border-gray-200 bg-surface">
        <MaterialIcons name="person-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-xl font-bold text-ink text-center">Khách vãng lai</Text>
      <Text className="text-sm text-ink-secondary text-center leading-5">
        Đăng nhập để xem hồ sơ, lưu địa điểm và lên kế hoạch chuyến đi
      </Text>
      <Pressable
        onPress={() => router.replace("/(auth)/login")}
        className="bg-primary rounded-2xl px-7 py-3.5 mt-2"
        style={{ shadowColor: "#0077b8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
      >
        <Text className="text-[15px] font-bold text-white">Đăng nhập với Google</Text>
      </Pressable>
    </View>
  );
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user: storeUser, isGuest, logout } = useAuth();
  const accessToken = useAuthStore((s) => s.accessToken);

  const isLoggedIn = !!accessToken && !isGuest;
  const { data: profile, isLoading } = useProfile();

  const displayUser = profile || storeUser;

  const fullName = displayUser?.profile?.fullName || displayUser?.email || "Người dùng";
  const email = displayUser?.email || "";
  const avatar = displayUser?.profile?.avatar;
  const stats = displayUser?.stats;

  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="px-5 pt-3 pb-3 bg-white border-b border-gray-100">
          <Text className="text-[22px] font-bold text-ink" style={{ letterSpacing: -0.3 }}>Hồ sơ</Text>
        </View>
        <GuestProfile />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* ── Header ── */}
      <View className="px-5 pt-3 pb-3 bg-white border-b border-gray-100">
        <Text className="text-[22px] font-bold text-ink" style={{ letterSpacing: -0.3 }}>Hồ sơ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
      >
        {/* ── Avatar + info card ── */}
        <View
          className="bg-white mx-4 mt-4 rounded-[20px] p-6 items-center gap-1"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        >
          {isLoading ? (
            <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-2">
              <ActivityIndicator color="#0077b8" />
            </View>
          ) : (
            <View className="mb-2">
              {avatar ? (
                <Image
                  source={{ uri: avatar }}
                  className="w-20 h-20 rounded-full"
                  contentFit="cover"
                />
              ) : (
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#e6f3fb" }}
                >
                  <Text className="text-[28px] font-bold text-primary">
                    {fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text className="text-[20px] font-bold text-ink text-center mt-1">{fullName}</Text>
          <Text className="text-[13px] text-ink-secondary text-center">{email}</Text>

          {/* Google badge */}
          <View
            className="flex-row items-center gap-1 px-2.5 py-1 rounded-xl mt-1"
            style={{ backgroundColor: "#e6f3fb" }}
          >
            <MaterialIcons name="verified" size={13} color="#0077b8" />
            <Text className="text-[11px] font-semibold text-primary">Tài khoản Google</Text>
          </View>

          {/* Stats row */}
          {stats && (
            <View className="flex-row w-full mt-4 pt-4 border-t border-gray-100">
              <StatItem count={stats.favorites} label="Đã lưu" />
              <View className="w-px bg-gray-100" />
              <StatItem count={stats.trips} label="Chuyến đi" />
              <View className="w-px bg-gray-100" />
              <StatItem count={stats.bookings} label="Đặt chỗ" />
            </View>
          )}
        </View>

        {/* ── Account section ── */}
        <View className="px-4 mt-4 mb-3">
          <Text className="text-[12px] font-bold text-ink-secondary uppercase mb-2 ml-1" style={{ letterSpacing: 0.8 }}>
            Tài khoản
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <SettingsRow icon="bookmark" label="Địa điểm đã lưu" onPress={() => {}} />
            <View className="h-px bg-gray-100 ml-14" />
            <SettingsRow icon="rate-review" label="Đánh giá của tôi" onPress={() => {}} />
            <View className="h-px bg-gray-100 ml-14" />
            <SettingsRow icon="map" label="Kế hoạch chuyến đi" onPress={() => {}} />
          </View>
        </View>

        {/* ── Settings section ── */}
        <View className="px-4 mb-3">
          <Text className="text-[12px] font-bold text-ink-secondary uppercase mb-2 ml-1" style={{ letterSpacing: 0.8 }}>
            Cài đặt
          </Text>
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <SettingsRow icon="notifications" label="Thông báo" onPress={() => {}} />
            <View className="h-px bg-gray-100 ml-14" />
            <SettingsRow icon="language" label="Ngôn ngữ" value="Tiếng Việt" onPress={() => {}} />
            <View className="h-px bg-gray-100 ml-14" />
            <SettingsRow
              icon="feedback"
              label="Góp ý & Hỗ trợ"
              onPress={() => router.push("/feedback")}
              iconBg="#fef3c7"
            />
          </View>
        </View>

        {/* ── Danger section ── */}
        <View className="px-4 mb-3">
          <View
            className="bg-white rounded-2xl overflow-hidden"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
          >
            <SettingsRow icon="logout" label="Đăng xuất" onPress={logout} danger />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
