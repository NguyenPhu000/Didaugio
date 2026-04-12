import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";
import { TOKENS } from "../../constants/design-tokens";

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
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: TAB_BAR_HEIGHT + 32,
        },
      ]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Icon block */}
      <View style={styles.iconOuter}>
        <View style={styles.iconRing} />
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={40} color={ACCENT} />
        </View>
      </View>

      {/* Text */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Nút đăng nhập — nền xanh */}
      <Pressable
        onPress={handleLogin}
        style={({ pressed }) => [
          styles.loginBtn,
          pressed && styles.pressedScale,
        ]}
      >
        <MaterialIcons name="login" size={18} color="#fff" />
        <Text style={styles.loginText}>Đăng nhập</Text>
      </Pressable>

      {/* Nút đăng ký — nền đen */}
      <Pressable
        onPress={handleRegister}
        style={({ pressed }) => [
          styles.registerBtn,
          pressed && styles.pressedScale,
        ]}
      >
        <MaterialIcons name="person-add-alt-1" size={18} color="#fff" />
        <Text style={styles.registerText}>Đăng ký tài khoản mới</Text>
      </Pressable>

      {/* Hint */}
      <Text style={styles.hint}>Miễn phí · Không cần thẻ tín dụng</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    justifyContent: "center",
  },

  /* Icon */
  iconOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(52,120,246,0.08)",
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2FF",
  },

  /* Text */
  title: {
    fontSize: 24,
    fontFamily: TOKENS.font.heading,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    fontFamily: TOKENS.font.regular,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
  },

  divider: {
    width: 48,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginVertical: 28,
  },

  /* Nút đăng nhập */
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: ACCENT,
    marginBottom: 12,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loginText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* Nút đăng ký */
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: BLACK,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  registerText: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  pressedScale: {
    opacity: 0.88,
    transform: [{ scale: 0.975 }],
  },

  hint: {
    marginTop: 18,
    fontSize: 12,
    fontFamily: TOKENS.font.regular,
    color: "#94A3B8",
    textAlign: "center",
  },
});
