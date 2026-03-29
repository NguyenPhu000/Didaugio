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
import { TOKENS } from "../../src/constants/design-tokens";

const SettingsRow = ({ icon, label, value, onPress, danger, iconBg }) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center px-4 py-4 gap-3"
  >
    <View
      className="w-11 h-11 rounded-[16px] items-center justify-center"
      style={{
        backgroundColor: danger
          ? "#FEE2E2"
          : iconBg || TOKENS.color.primary[100],
      }}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? "#EF4444" : TOKENS.color.primary[600]}
      />
    </View>
    <View className="flex-1">
      <Text
        className="text-[14px] font-semibold"
        style={{ color: danger ? "#EF4444" : TOKENS.color.neutral[900] }}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-[12px] text-ink-secondary mt-0.5">{value}</Text>
      ) : null}
    </View>
    <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
  </Pressable>
);

const StatItem = ({ count, label }) => (
  <View className="flex-1 items-center">
    <Text className="text-[24px] font-bold text-ink">{count ?? 0}</Text>
    <Text className="text-[11px] text-ink-secondary mt-1 uppercase tracking-[0.8px]">
      {label}
    </Text>
  </View>
);

const GuestProfile = () => {
  const router = useRouter();
  return (
    <View className="flex-1 px-5 pt-4">
      <View
        className="rounded-[32px] border border-primary-100 px-6 py-8 items-center"
        style={[
          TOKENS.shadow.md,
          { backgroundColor: "rgba(255,255,255,0.96)" },
        ]}
      >
        <View className="w-24 h-24 rounded-[28px] items-center justify-center bg-primary-50 mb-5">
          <MaterialIcons name="person-outline" size={46} color={TOKENS.color.primary[500]} />
        </View>
        <Text className="text-[24px] font-bold text-ink text-center">Khách vãng lai</Text>
        <Text className="text-[14px] text-ink-secondary text-center leading-6 mt-3">
          Đăng nhập để lưu địa điểm yêu thích, quản lý hồ sơ và đồng bộ hành trình.
        </Text>
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="mt-6 rounded-[22px] px-6 py-4 bg-primary-600"
          style={TOKENS.shadow.glow}
        >
          <Text className="text-[14px] font-bold uppercase tracking-[1px] text-white">
            Đăng nhập hoặc đăng ký
          </Text>
        </Pressable>
      </View>
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
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="px-5 pt-4">
          <Text className="text-[30px] font-bold text-ink" style={{ letterSpacing: -0.8 }}>
            Hồ sơ
          </Text>
        </View>
        <GuestProfile />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 92 }}
      >
        <View className="px-5 pt-4">
          <Text className="text-[30px] font-bold text-ink" style={{ letterSpacing: -0.8 }}>
            Hồ sơ
          </Text>
        </View>

        <View className="px-4 mt-4">
          <View
            className="rounded-[32px] px-6 py-6"
            style={[
              TOKENS.shadow.md,
              { backgroundColor: "rgba(255,255,255,0.96)" },
            ]}
          >
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color={TOKENS.color.primary[500]} />
              </View>
            ) : (
              <>
                <View className="items-center">
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      className="w-24 h-24 rounded-full"
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="w-24 h-24 rounded-full items-center justify-center"
                      style={{ backgroundColor: TOKENS.color.primary[100] }}
                    >
                      <Text className="text-[30px] font-bold text-primary-700">
                        {fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text className="text-[24px] font-bold text-ink text-center mt-4">
                    {fullName}
                  </Text>
                  <Text className="text-[14px] text-ink-secondary text-center mt-1">
                    {email}
                  </Text>

                  <View
                    className="flex-row items-center gap-1 px-3 py-2 rounded-full mt-4"
                    style={{ backgroundColor: TOKENS.color.primary[50] }}
                  >
                    <MaterialIcons name="verified" size={14} color={TOKENS.color.primary[600]} />
                    <Text className="text-[11px] font-semibold text-primary-700 uppercase tracking-[0.8px]">
                      {displayUser?.emailVerified ? "Email đã xác thực" : "Tài khoản hoạt động"}
                    </Text>
                  </View>
                </View>

                {stats ? (
                  <View className="flex-row mt-6 pt-6 border-t border-slate-100">
                    <StatItem count={stats.favorites} label="Đã lưu" />
                    <View className="w-px bg-slate-100" />
                    <StatItem count={stats.trips} label="Chuyến đi" />
                    <View className="w-px bg-slate-100" />
                    <StatItem count={stats.bookings} label="Đặt chỗ" />
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-[12px] font-bold text-ink-secondary uppercase tracking-[1px] ml-2 mb-2">
            Tài khoản
          </Text>
          <View
            className="bg-white rounded-[28px] overflow-hidden"
            style={TOKENS.shadow.sm}
          >
            <SettingsRow icon="bookmark" label="Địa điểm đã lưu" onPress={() => {}} />
            <View className="h-px bg-slate-100 ml-16" />
            <SettingsRow icon="rate-review" label="Đánh giá của tôi" onPress={() => {}} />
            <View className="h-px bg-slate-100 ml-16" />
            <SettingsRow icon="map" label="Kế hoạch chuyến đi" onPress={() => {}} />
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-[12px] font-bold text-ink-secondary uppercase tracking-[1px] ml-2 mb-2">
            Cài đặt
          </Text>
          <View
            className="bg-white rounded-[28px] overflow-hidden"
            style={TOKENS.shadow.sm}
          >
            <SettingsRow icon="notifications" label="Thông báo" onPress={() => {}} />
            <View className="h-px bg-slate-100 ml-16" />
            <SettingsRow icon="language" label="Ngôn ngữ" value="Tiếng Việt" onPress={() => {}} />
            <View className="h-px bg-slate-100 ml-16" />
            <SettingsRow
              icon="feedback"
              label="Góp ý & Hỗ trợ"
              onPress={() => router.push("/feedback")}
              iconBg="#FEF3C7"
            />
          </View>
        </View>

        <View className="px-4 mt-4">
          <View
            className="bg-white rounded-[28px] overflow-hidden"
            style={TOKENS.shadow.sm}
          >
            <SettingsRow icon="logout" label="Đăng xuất" onPress={logout} danger />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
