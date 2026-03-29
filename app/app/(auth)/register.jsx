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
import { useRegister } from "../../src/modules/auth/hooks/useRegister";

const inputClassName =
  "h-14 rounded-2xl border border-gray-200 bg-white px-4 text-[15px] text-ink";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, successMessage } = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    register({ fullName, email, password, confirmPassword });
  };

  return (
    <View className="flex-1 bg-[#0f172a]" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />

      <View
        className="absolute overflow-hidden"
        style={{ top: -160, left: -100, width: 360, height: 360 }}
        pointerEvents="none"
      >
        <View
          className="w-full h-full rounded-full"
          style={{ backgroundColor: "rgba(56,189,248,0.12)" }}
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
                backgroundColor: "rgba(56,189,248,0.15)",
                borderWidth: 1,
                borderColor: "rgba(125,211,252,0.25)",
              }}
            >
              <MaterialIcons name="person-add-alt-1" size={28} color="#e0f2fe" />
            </View>

            <Text
              className="text-[33px] font-extrabold text-white"
              style={{ letterSpacing: -0.7 }}
            >
              Tạo tài khoản
            </Text>
            <Text
              className="text-[15px] leading-[22px] mt-2"
              style={{ color: "rgba(226,232,240,0.85)" }}
            >
              Đăng ký bằng email để sử dụng chung tài khoản với hệ thống web.
            </Text>
          </View>

          <View
            className="flex-1 rounded-t-[32px] bg-white px-6 pt-7"
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
                  Họ và tên
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor="#9ca3af"
                  className={inputClassName}
                />
              </View>

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
                    autoComplete="new-password"
                    placeholder="Tối thiểu 6 ký tự"
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
                <Text className="text-[12px] text-ink-muted mt-2">
                  Mật khẩu cần có chữ hoa, chữ thường và ít nhất 1 số.
                </Text>
              </View>

              <View>
                <Text className="text-[13px] font-semibold text-ink-secondary mb-2">
                  Xác nhận mật khẩu
                </Text>
                <View className="relative">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#9ca3af"
                    className={`${inputClassName} pr-12`}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-0 bottom-0 items-center justify-center"
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? "visibility-off" : "visibility"}
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

              {successMessage ? (
                <View className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <View className="flex-row items-start gap-2">
                    <MaterialIcons name="mark-email-read" size={18} color="#10b981" />
                    <Text className="flex-1 text-[13px] leading-[19px] text-emerald-700">
                      {successMessage}
                    </Text>
                  </View>
                  <Link href="/(auth)/login" asChild>
                    <Pressable className="mt-3 self-start rounded-xl bg-emerald-600 px-4 py-2">
                      <Text className="text-[13px] font-semibold text-white">
                        Quay lại đăng nhập
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              ) : null}

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                className="h-14 rounded-2xl items-center justify-center mt-1"
                style={({ pressed }) => [
                  {
                    backgroundColor: "#0f172a",
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.18,
                    shadowRadius: 14,
                    elevation: 5,
                  },
                  pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
                  isLoading && { opacity: 0.7 },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">
                    Đăng ký bằng email
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="flex-row items-center justify-center gap-1 mt-6 mb-4">
              <Text className="text-[13px] text-ink-secondary">
                Đã có tài khoản?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-[13px] font-bold text-primary">
                    Đăng nhập
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
