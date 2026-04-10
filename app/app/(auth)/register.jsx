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
import { useRegister } from "../../src/modules/auth/hooks/useRegister";

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

function BenefitPill({ icon, text }) {
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
      <MaterialIcons name={icon} size={14} color="#a5f3fc" />
      <Text style={{ fontSize: 12, fontWeight: "500", color: "#cffafe" }}>
        {text}
      </Text>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, successMessage } = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleRegister = () => {
    register({ fullName, email, password, confirmPassword });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#020617" }}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#020617", "#083344", "#0e7490"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top }}
      >
        {/* Decorative blobs */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -70,
            left: -70,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: "rgba(34,211,238,0.1)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 160,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(6,182,212,0.08)",
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
            <View
              style={{
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 28,
              }}
            >
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
                <MaterialIcons name="person-add-alt-1" size={28} color="#ffffff" />
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
                Tạo tài khoản mới
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  lineHeight: 21,
                  color: "rgba(207,250,254,0.88)",
                  maxWidth: 300,
                }}
              >
                Đăng ký để lưu thông tin, đồng bộ lịch sử và mở khóa trải
                nghiệm đầy đủ trên ứng dụng.
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <BenefitPill icon="mail-outline" text="Xác thực email" />
                <BenefitPill icon="shield" text="Bảo mật cao" />
                <BenefitPill icon="favorite-border" text="Lưu địa điểm" />
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
                    Đăng ký
                  </Text>
                  <Text
                    style={{ marginTop: 3, fontSize: 13, color: "#64748b" }}
                  >
                    Một tài khoản cho cả web và mobile
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#ecfeff",
                    borderRadius: 100,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#0e7490",
                    }}
                  >
                    Mới toanh
                  </Text>
                </View>
              </View>

              {/* Form */}
              <View style={{ gap: 14 }}>
                <AuthInput
                  label="Họ và tên"
                  icon="badge"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />

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
                  inputRef={emailRef}
                />

                <AuthInput
                  label="Mật khẩu"
                  icon="lock-outline"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  showToggle
                  isVisible={showPassword}
                  onToggleVisibility={() => setShowPassword((v) => !v)}
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  inputRef={passwordRef}
                />

                <AuthInput
                  label="Xác nhận mật khẩu"
                  icon="verified-user"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  showToggle
                  isVisible={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  inputRef={confirmPasswordRef}
                />

                {/* Password hint */}
                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#a5f3fc",
                    backgroundColor: "#ecfeff",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <MaterialIcons
                    name="tips-and-updates"
                    size={17}
                    color="#0e7490"
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      lineHeight: 18,
                      color: "#164e63",
                    }}
                  >
                    Mật khẩu nên có chữ hoa, chữ thường và ít nhất 1 số để bảo
                    vệ tài khoản tốt hơn.
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

                {/* Success message */}
                {successMessage ? (
                  <View
                    style={{
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#6ee7b7",
                      backgroundColor: "#f0fdf4",
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <MaterialIcons
                        name="mark-email-read"
                        size={18}
                        color="#059669"
                      />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 13,
                          lineHeight: 19,
                          color: "#065f46",
                        }}
                      >
                        {successMessage}
                      </Text>
                    </View>
                    <Link href="/(auth)/login" asChild>
                      <Pressable
                        style={({ pressed }) => [
                          {
                            marginTop: 12,
                            height: 42,
                            alignSelf: "flex-start",
                            borderRadius: 12,
                            backgroundColor: "#059669",
                            paddingHorizontal: 16,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: "#ffffff",
                          }}
                        >
                          Quay lại đăng nhập
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                ) : null}

                {/* Register button */}
                <Pressable
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    {
                      height: 54,
                      marginTop: 2,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#0e7490",
                      shadowColor: "#0e7490",
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
                        Tạo tài khoản
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

              {/* Login link */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  marginTop: 20,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 13, color: "#64748b" }}>
                  Đã có tài khoản?
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable hitSlop={8}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#0e7490",
                      }}
                    >
                      Đăng nhập ngay
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
