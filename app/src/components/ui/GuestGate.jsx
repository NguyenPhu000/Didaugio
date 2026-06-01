import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";

const TAB_BAR_HEIGHT = 80;
const ACCENT = "#3478F6";
const BLACK = "#0F172A";

export const GuestGate = ({
  icon = "lock",
  title = "Đăng nhập để tiếp tục",
  description = "Tính năng này yêu cầu tài khoản đăng nhập.",
  children,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);

  const isLoggedIn = !!accessToken && !isGuest;
  if (isLoggedIn) return children ?? null;

  const handleLogin = () => {
    exitGuestMode();
    router.navigate("/(auth)/login");
  };

  const handleRegister = () => {
    exitGuestMode();
    router.navigate("/(auth)/register");
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: 28,
        justifyContent: "center",
        paddingTop: insets.top + 24,
        paddingBottom: TAB_BAR_HEIGHT + 32,
      }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Icon block */}
      <View className="items-center justify-center mb-7">
        <View className="absolute w-[120px] h-[120px] rounded-full bg-blue-500/8" />
        <View className="w-[88px] h-[88px] rounded-[26px] items-center justify-center bg-blue-100">
          <MaterialIconsRounded name={icon} size={40} color={ACCENT} />
        </View>
      </View>

      {/* Text */}
      <Text className="text-2xl font-heading text-ink text-center mb-2.5">{title}</Text>
      <Text className="text-[15px] font-body text-slate-500 text-center leading-[23px] max-w-[320px]">{description}</Text>

      {/* Divider */}
      <View className="w-12 h-[3px] rounded-full bg-slate-200 my-7" />

      {/* Nút đăng nhập — nền xanh */}
      <Pressable
        onPress={handleLogin}
        className="flex-row items-center justify-center gap-2 w-full py-4 rounded-full mb-3"
        style={({ pressed }) => [
          { backgroundColor: ACCENT },
          pressed && { opacity: 0.88, transform: [{ scale: 0.975 }] },
          {
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          },
        ]}
      >
        <MaterialIconsRounded name="login" size={18} color="#fff" />
        <Text className="text-[15px] font-semibold text-white tracking-[0.2px]">Đăng nhập</Text>
      </Pressable>

      {/* Nút đăng ký — nền đen */}
      <Pressable
        onPress={handleRegister}
        className="flex-row items-center justify-center gap-2 w-full py-4 rounded-full"
        style={({ pressed }) => [
          { backgroundColor: BLACK },
          pressed && { opacity: 0.88, transform: [{ scale: 0.975 }] },
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 6,
          },
        ]}
      >
        <MaterialIconsRounded name="person-add-alt-1" size={18} color="#fff" />
        <Text className="text-[15px] font-semibold text-white tracking-[0.2px]">Đăng ký tài khoản mới</Text>
      </Pressable>

      {/* Hint */}
      <Text className="mt-[18px] text-xs font-body text-slate-400 text-center">Miễn phí · Không cần thẻ tín dụng</Text>
    </ScrollView>
  );
};
