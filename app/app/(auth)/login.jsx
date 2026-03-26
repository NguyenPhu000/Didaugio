import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useGoogleLogin } from "../../src/modules/auth/hooks/useGoogleLogin";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading, error } = useGoogleLogin();
  const { continueAsGuest } = useAuth();

  return (
    <View className="flex-1 bg-primary" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      {/* ── Circle decoration ── */}
      <View
        className="absolute overflow-hidden"
        style={{ top: -120, right: -120, width: 400, height: 400 }}
        pointerEvents="none"
      >
        <View
          className="w-full h-full rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        />
      </View>

      {/* ── Hero ── */}
      <View className="flex-1 items-center justify-center px-8 pb-6">
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-5"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.35)",
          }}
        >
          <MaterialIcons name="explore" size={52} color="#fff" />
        </View>

        <Text
          className="text-[34px] font-extrabold text-white mb-2"
          style={{ letterSpacing: -0.5 }}
        >
          Đi Đâu Giờ?
        </Text>
        <Text
          className="text-[15px] text-center leading-[22px] mb-6"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          Khám phá địa điểm tuyệt vời tại Cần Thơ
        </Text>

        {/* Feature pills */}
        <View className="flex-row flex-wrap gap-2 justify-center">
          {["Bản đồ thực tế", "Ăn uống", "Tham quan"].map((label) => (
            <View
              key={label}
              className="rounded-[20px] px-3 py-1.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text className="text-[12px] font-medium text-white">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Auth card ── */}
      <View
        className="bg-white rounded-t-[32px] px-6 pt-8"
        style={{
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <Text className="text-[22px] font-extrabold text-ink mb-1.5">
          Bắt đầu khám phá
        </Text>
        <Text className="text-[14px] text-ink-secondary leading-[20px] mb-6">
          Đăng nhập để lưu địa điểm yêu thích và lên kế hoạch chuyến đi
        </Text>

        {/* Google Login button */}
        <Pressable
          onPress={login}
          disabled={isLoading}
          className="h-14 rounded-2xl bg-white items-center justify-center border border-gray-200"
          style={({ pressed }) => [
            {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            },
            pressed && { backgroundColor: "#f9fafb" },
            isLoading && { opacity: 0.7 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#0077b8" size="small" />
          ) : (
            <View className="flex-row items-center gap-3">
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: "#4285F4" }}
              >
                <Text className="text-[16px] font-extrabold text-white">G</Text>
              </View>
              <Text className="text-[15px] font-bold text-ink">
                Đăng nhập với Google
              </Text>
            </View>
          )}
        </Pressable>

        {/* Error */}
        {error ? (
          <View className="flex-row items-center gap-1.5 bg-red-50 rounded-[10px] p-2.5 mt-3 border border-red-200">
            <MaterialIcons name="error-outline" size={16} color="#ef4444" />
            <Text className="text-[13px] text-red-500 flex-1">{error}</Text>
          </View>
        ) : null}

        {/* Divider */}
        <View className="flex-row items-center gap-3 mt-5 mb-5">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-[13px] text-ink-muted">hoặc</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Guest mode */}
        <Pressable
          onPress={continueAsGuest}
          className="h-[52px] rounded-2xl border-[1.5px] border-primary flex-row items-center justify-center gap-2 mb-5 active:bg-blue-50"
        >
          <MaterialIcons name="person-outline" size={18} color="#0077b8" />
          <Text className="text-[15px] font-semibold text-primary">
            Tiếp tục với tư cách khách
          </Text>
        </Pressable>

        <Text className="text-[11px] text-ink-muted text-center leading-[16px]">
          Bằng cách tiếp tục, bạn đồng ý với{" "}
          <Text className="text-primary font-semibold">Điều khoản dịch vụ</Text>{" "}
          và{" "}
          <Text className="text-primary font-semibold">
            Chính sách quyền riêng tư
          </Text>{" "}
          của chúng tôi.
        </Text>
      </View>
    </View>
  );
}
