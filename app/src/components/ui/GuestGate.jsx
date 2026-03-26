/**
 * GuestGate — Wraps content that requires login.
 * If the user is a guest (isGuest=true) or unauthenticated (no accessToken),
 * renders a full-screen login prompt instead of the protected content.
 *
 * Props:
 *   icon        - MaterialIcons name shown in the icon circle (default: "lock")
 *   iconColor   - Color for the icon and button (default: "#0077b8")
 *   title       - Heading text
 *   description - Body text explaining why login is needed
 *   children    - Protected content rendered when user is authenticated
 */
import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";

export const GuestGate = ({
  icon = "lock",
  iconColor = "#0077b8",
  title = "Đăng nhập để tiếp tục",
  description = "Tính năng này yêu cầu tài khoản đăng nhập.",
  children,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);

  // Chỉ cho phép user đã đăng nhập thực sự (có accessToken và không phải guest)
  const isLoggedIn = !!accessToken && !isGuest;

  if (isLoggedIn) return children;

  return (
    <View
      className="flex-1 items-center justify-center px-10 gap-3"
      style={{ paddingTop: insets.top }}
    >
      {/* Icon circle */}
      <View
        className="w-20 h-20 rounded-full items-center justify-center border-2 border-gray-200"
        style={{ backgroundColor: "#f8faff" }}
      >
        <MaterialIcons name={icon} size={40} color="#9ca3af" />
      </View>

      {/* Text */}
      <Text className="text-lg font-bold text-ink text-center">{title}</Text>
      <Text className="text-sm text-ink-secondary text-center leading-5">
        {description}
      </Text>

      {/* Login button */}
      <Pressable
        onPress={() => router.push("/(auth)/login")}
        className="rounded-2xl px-7 py-3.5 mt-2"
        style={{
          backgroundColor: iconColor,
          shadowColor: iconColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text className="text-[15px] font-bold text-white">Đăng nhập ngay</Text>
      </Pressable>
    </View>
  );
};
