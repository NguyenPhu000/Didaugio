import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useGoogleLogin } from "../../src/modules/auth/hooks/useGoogleLogin";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useLogin } from "../../src/modules/auth/hooks/useLogin";

const inputClassName =
  "h-14 rounded-2xl border border-gray-200 bg-white px-4 text-[15px] text-ink";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login: loginWithGoogle, isLoading: isGoogleLoading, error: googleError } =
    useGoogleLogin();
  const { continueAsGuest } = useAuth();
  const { login, isLoading, error } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = () => {
    login(email, password);
  };

  return (
    <View className="flex-1 bg-primary" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <View
        className="absolute overflow-hidden"
        style={{ top: -140, right: -120, width: 420, height: 420 }}
        pointerEvents="none"
      >
        <View
          className="w-full h-full rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          <View className="px-8 pt-8 pb-7">
            <View
              className="w-16 h-16 rounded-[20px] items-center justify-center mb-5"
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.26)",
              }}
            >
              <MaterialIcons name="mail-outline" size={30} color="#ffffff" />
            </View>

            <Text
              className="text-[33px] font-extrabold text-white"
              style={{ letterSpacing: -0.7 }}
            >
              Đăng nhập
            </Text>
            <Text
              className="text-[15px] leading-[22px] mt-2"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              Dùng email để đồng bộ tài khoản với hệ thống web hoặc tiếp tục bằng Google.
            </Text>
          </View>

          <View
            className="flex-1 bg-white rounded-t-[32px] px-6 pt-7"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <View className="gap-4">
              <View>
                <Text className="text-[13px] font-semibold text-ink-secondary mb-2">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  className={inputClassName}
                />
              </View>

              <View>
                <Text className="text-[13px] font-semibold text-ink-secondary mb-2">
                  Mật khẩu
                </Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#9ca3af"
                    className={`${inputClassName} pr-12`}
                  />
                  <Pressable
                    onPress={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-0 bottom-0 items-center justify-center"
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={22}
                      color="#6b7280"
                    />
                  </Pressable>
                </View>
              </View>

              {error ? (
                <View className="flex-row items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                  <Text className="flex-1 text-[13px] leading-[19px] text-red-500">
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleEmailLogin}
                disabled={isLoading}
                className="h-14 rounded-2xl items-center justify-center"
                style={({ pressed }) => [
                  {
                    backgroundColor: "#0077b8",
                    shadowColor: "#0077b8",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.28,
                    shadowRadius: 14,
                    elevation: 5,
                  },
                  pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">
                    Đăng nhập bằng email
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="flex-row items-center gap-3 my-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-[13px] text-ink-muted">hoặc</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <Pressable
              onPress={loginWithGoogle}
              disabled={isGoogleLoading}
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
                isGoogleLoading && { opacity: 0.7 },
              ]}
            >
              {isGoogleLoading ? (
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

            {googleError ? (
              <View className="flex-row items-center gap-1.5 bg-red-50 rounded-[10px] p-2.5 mt-3 border border-red-200">
                <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                <Text className="text-[13px] text-red-500 flex-1">
                  {googleError}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={continueAsGuest}
              className="h-[52px] rounded-2xl border-[1.5px] border-primary flex-row items-center justify-center gap-2 mt-5 active:bg-blue-50"
            >
              <MaterialIcons name="person-outline" size={18} color="#0077b8" />
              <Text className="text-[15px] font-semibold text-primary">
                Tiếp tục với tư cách khách
              </Text>
            </Pressable>

            <View className="flex-row items-center justify-center gap-1 mt-6">
              <Text className="text-[13px] text-ink-secondary">
                Chưa có tài khoản?
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-[13px] font-bold text-primary">
                    Đăng ký ngay
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Text className="text-[11px] text-ink-muted text-center leading-[16px] mt-5 mb-4">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
