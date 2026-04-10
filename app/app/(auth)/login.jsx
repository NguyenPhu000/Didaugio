import { useRef, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useGoogleLogin } from "../../src/modules/auth/hooks/useGoogleLogin";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useLogin } from "../../src/modules/auth/hooks/useLogin";

const CARD_SHADOW = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: -12 },
  shadowOpacity: 0.1,
  shadowRadius: 28,
  elevation: 20,
};

function AuthInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoComplete,
  autoCapitalize = "none",
  secureTextEntry = false,
  showToggle = false,
  isVisible = false,
  onToggleVisibility,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#374151",
          marginLeft: 2,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          height: 54,
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: "#e2e8f0",
          backgroundColor: "#f8fafc",
          paddingHorizontal: 14,
        }}
      >
        <MaterialIcons name={icon} size={20} color="#94a3b8" />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          style={{
            flex: 1,
            paddingHorizontal: 12,
            fontSize: 15,
            color: "#0f172a",
          }}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {showToggle && (
          <Pressable
            onPress={onToggleVisibility}
            hitSlop={10}
            style={{
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name={isVisible ? "visibility-off" : "visibility"}
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function FeaturePill({ icon, text }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.13)",
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
      }}
    >
      <MaterialIcons name={icon} size={14} color="#bfdbfe" />
      <Text style={{ fontSize: 12, fontWeight: "500", color: "#dbeafe" }}>
        {text}
      </Text>
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    login: loginWithGoogle,
    isLoading: isGoogleLoading,
    error: googleError,
  } = useGoogleLogin();
  const { continueAsGuest } = useAuth();
  const { login, isLoading, error } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);

  const handleEmailLogin = () => {
    login(email, password);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#020617", "#0c2a4a", "#0369a1"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top }}
      >
        {/* Decorative blobs */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -60,
            right: -80,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: "rgba(56,189,248,0.12)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 180,
            left: -50,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: "rgba(14,165,233,0.1)",
          }}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: Math.max(insets.bottom + 16, 32),
            }}
          >
            {/* Header section */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.22)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <MaterialIcons name="travel-explore" size={28} color="#ffffff" />
              </View>

              <Text
                style={{
                  fontSize: 30,
                  fontWeight: "800",
                  color: "#ffffff",
                  letterSpacing: -0.8,
                  lineHeight: 36,
                  maxWidth: 260,
                }}
              >
                Chào mừng trở lại!
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  lineHeight: 21,
                  color: "rgba(186,230,253,0.9)",
                  maxWidth: 300,
                }}
              >
                Đăng nhập để đồng bộ hành trình, lưu địa điểm yêu thích và
                trải nghiệm trên mọi thiết bị.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <FeaturePill icon="verified-user" text="Bảo mật" />
                <FeaturePill icon="cloud-done" text="Đồng bộ dữ liệu" />
                <FeaturePill icon="bolt" text="Vào app nhanh" />
              </View>
            </View>

            {/* White card */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                borderTopLeftRadius: 36,
                borderTopRightRadius: 36,
                paddingHorizontal: 24,
                paddingTop: 28,
                paddingBottom: 12,
                ...CARD_SHADOW,
              }}
            >
              {/* Card header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: "#0f172a",
                      letterSpacing: -0.4,
                    }}
                  >
                    Đăng nhập
                  </Text>
                  <Text
                    style={{ marginTop: 3, fontSize: 13, color: "#64748b" }}
                  >
                    Dùng email hoặc tiếp tục bằng Google
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#eff6ff",
                    borderRadius: 100,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#1d4ed8",
                    }}
                  >
                    Mobile app
                  </Text>
                </View>
              </View>

              {/* Form */}
              <View style={{ gap: 14 }}>
                <AuthInput
                  label="Email"
                  icon="alternate-email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <AuthInput
                  label="Mật khẩu"
                  icon="lock-outline"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  placeholder="Nhập mật khẩu"
                  showToggle
                  isVisible={showPassword}
                  onToggleVisibility={() => setShowPassword((v) => !v)}
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleEmailLogin}
                  inputRef={passwordRef}
                />

                {/* Info hint */}
                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#bfdbfe",
                    backgroundColor: "#eff6ff",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 18,
                      color: "#1e40af",
                    }}
                  >
                    Đăng nhập bằng email để đồng bộ tài khoản với hệ thống
                    web. Nếu muốn vào nhanh, hãy dùng Google.
                  </Text>
                </View>

                {/* Error */}
                {error ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 8,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#fecaca",
                      backgroundColor: "#fff1f2",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <MaterialIcons
                      name="error-outline"
                      size={18}
                      color="#ef4444"
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        lineHeight: 19,
                        color: "#dc2626",
                      }}
                    >
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Login button */}
                <Pressable
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    {
                      height: 54,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#0369a1",
                      shadowColor: "#0369a1",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                      elevation: 8,
                    },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
                    isLoading && { opacity: 0.7 },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#ffffff",
                        }}
                      >
                        Đăng nhập bằng email
                      </Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={18}
                        color="#ffffff"
                      />
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Divider */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginVertical: 20,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                <Text style={{ fontSize: 13, color: "#94a3b8", fontWeight: "500" }}>
                  hoặc
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
              </View>

              {/* Google button */}
              <Pressable
                onPress={loginWithGoogle}
                disabled={isGoogleLoading}
                style={({ pressed }) => [
                  {
                    height: 54,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: "#e2e8f0",
                    backgroundColor: "#ffffff",
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.07,
                    shadowRadius: 12,
                    elevation: 3,
                  },
                  pressed && { backgroundColor: "#f8fafc" },
                  isGoogleLoading && { opacity: 0.7 },
                ]}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#0369a1" size="small" />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "#4285F4",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: "#ffffff",
                        }}
                      >
                        G
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#0f172a",
                      }}
                    >
                      Tiếp tục với Google
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Google error */}
              {googleError ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#fecaca",
                    backgroundColor: "#fff1f2",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    marginTop: 12,
                  }}
                >
                  <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      lineHeight: 19,
                      color: "#dc2626",
                    }}
                  >
                    {googleError}
                  </Text>
                </View>
              ) : null}

              {/* Guest button */}
              <Pressable
                onPress={continueAsGuest}
                style={({ pressed }) => [
                  {
                    marginTop: 14,
                    height: 52,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: "#bae6fd",
                    backgroundColor: "#f0f9ff",
                  },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <MaterialIcons name="person-outline" size={18} color="#0369a1" />
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#0369a1" }}
                >
                  Tiếp tục với tư cách khách
                </Text>
              </Pressable>

              {/* Sign up link */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  marginTop: 20,
                }}
              >
                <Text style={{ fontSize: 13, color: "#64748b" }}>
                  Chưa có tài khoản?
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable hitSlop={8}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#0369a1",
                      }}
                    >
                      Đăng ký ngay
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <Text
                style={{
                  marginTop: 16,
                  marginBottom: 8,
                  fontSize: 11,
                  lineHeight: 17,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và
                Chính sách quyền riêng tư của chúng tôi.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
