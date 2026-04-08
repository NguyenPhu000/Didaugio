import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";
import { TOKENS } from "../../constants/design-tokens";

export const GuestGate = ({
  icon = "lock",
  iconColor = TOKENS.color.primary[600],
  title = "Dang nhap de tiep tuc",
  description = "Tinh nang nay yeu cau tai khoan dang nhap.",
  children,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);

  const isLoggedIn = !!accessToken && !isGuest;
  if (isLoggedIn) return children;

  return (
    <View
      className="flex-1 items-center justify-center px-6"
      style={{
        paddingTop: insets.top,
        backgroundColor: TOKENS.color.background.light,
      }}
    >
      <View
        className="w-full rounded-[32px] border border-primary-100 px-6 py-8"
        style={[
          TOKENS.shadow.md,
          { backgroundColor: "rgba(255,255,255,0.96)" },
        ]}
      >
        <View className="items-center">
          <View
            className="w-24 h-24 rounded-[28px] items-center justify-center mb-5"
            style={{ backgroundColor: TOKENS.color.primary[100] }}
          >
            <MaterialIcons name={icon} size={42} color={iconColor} />
          </View>

          <Text className="text-[24px] font-bold text-ink text-center">{title}</Text>
          <Text className="text-[14px] text-ink-secondary text-center leading-6 mt-3">
            {description}
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
            className="mt-7 rounded-[22px] px-7 py-4"
            style={{
              backgroundColor: TOKENS.color.primary[600],
              ...TOKENS.shadow.glow,
            }}
          >
            <Text className="text-[14px] font-bold uppercase tracking-[1.1px] text-white">
              Dang nhap ngay
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
