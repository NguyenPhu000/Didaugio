// MAP: LoginScreen
// ├── UI: @/components/ui/GridBackground, @/components/primitives/GoogleLogo
// └── API: @/modules/auth/hooks/useLogin, @/modules/auth/hooks/useGoogleLogin, @/modules/auth/hooks/useAuth

import { useRef, useState, useCallback, forwardRef } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { GoogleLogo } from "../../src/components/primitives/GoogleLogo";
import { useGoogleLogin } from "../../src/modules/auth/hooks/useGoogleLogin";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useLogin } from "../../src/modules/auth/hooks/useLogin";
import { useTranslation } from "react-i18next";
import { GridBackground } from "../../src/components/ui/GridBackground";

/* ──────────────────────────────────────────────────────────────────
   Sub-components — khai báo trước để dùng được forwardRef
   ────────────────────────────────────────────────────────────────── */

const Field = forwardRef(function Field(
  {
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    autoComplete,
    textContentType,
    returnKeyType,
    onSubmitEditing,
    rightAdornment,
    keyboardType,
    autoCapitalize,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const iconColor = focused ? "#7DD3FC" : "#6B7280";
  return (
    <View
      className="flex-row items-center h-[56px] px-1.5"
      style={{
        backgroundColor: focused ? "rgba(212, 255, 79, 0.04)" : "transparent",
        borderRadius: 14,
      }}
    >
      <View className="w-11 items-center">
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "none"}
        className="flex-1 text-[15px] text-white h-full font-medium"
        selectionColor="#7DD3FC"
      />
      {rightAdornment}
    </View>
  );
});

function PrimaryButton({ onPress, loading, label }) {
  const [pressed, setPressed] = useState(false);
  return (
    <View
      className="rounded-full p-[1.5px]"
      style={{
        backgroundColor: pressed ? "#7DD3FC" : "rgba(212, 255, 79, 0.5)",
        shadowColor: "#7DD3FC",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: pressed ? 0.6 : 0.25,
        shadowRadius: 24,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={loading}
        className="flex-row items-center justify-center h-[56px] rounded-full"
        style={{
          backgroundColor: "#7DD3FC",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }}
      >
        {loading ? (
          <ActivityIndicator color="#0B0B0F" size="small" />
        ) : (
          <>
            <Text className="text-[#0B0B0F] text-[15px] font-extrabold tracking-[0.1px]">
              {label}
            </Text>
            <View
              className="ml-3 w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(11, 11, 15, 0.18)" }}
            >
              <Feather name="arrow-right" size={15} color="#0B0B0F" />
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

function SecondaryButton({ onPress, loading, label, icon }) {
  const [pressed, setPressed] = useState(false);
  return (
    <View
      className="rounded-full p-[1px]"
      style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={loading}
        className="flex-row items-center justify-center h-[52px] rounded-full"
        style={{
          backgroundColor: pressed ? "rgba(255,255,255,0.06)" : "transparent",
          transform: [{ scale: pressed ? 0.99 : 1 }],
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon}
            <Text className="text-white text-[14px] font-semibold ml-2.5 tracking-[0.1px]">
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function ErrorBanner({ message }) {
  return (
    <View
      className="flex-row items-center rounded-2xl px-4 py-3 mb-5"
      style={{
        backgroundColor: "rgba(255, 59, 48, 0.08)",
        borderColor: "rgba(255, 59, 48, 0.25)",
        borderWidth: 1,
      }}
    >
      <Feather name="alert-circle" size={16} color="#FF6B6B" />
      <Text className="flex-1 text-[#FF8B85] text-[12.5px] font-semibold ml-2.5">
        {message}
      </Text>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────
   LoginScreen
   ────────────────────────────────────────────────────────────────── */

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    login: loginWithGoogle,
    isLoading: isGoogleLoading,
    error: googleError,
  } = useGoogleLogin();
  const { continueAsGuest } = useAuth();
  const { login, isLoading, error } = useLogin();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const [identifier, setIdentifier] = useState(String(params?.identifier || ""));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef(null);

  const handleLogin = useCallback(() => {
    login(identifier.trim(), password);
  }, [identifier, password, login]);

  return (
    <GridBackground
      backgroundColor="#0B0B0F"
      tintColor="#0B0B0F"
      tintOpacity={0.6}
      cellSize={56}
      lineColor="rgba(125, 211, 252, 0.05)"
      backgroundImage={require("../../assets/sky.jpg")}
    >
      <StatusBar style="light" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 36,
            paddingBottom: Math.max(insets.bottom + 24, 36),
          }}
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Eyebrow micro-tag ─────────────────────────────── */}
          <View className="flex-row items-center self-center mb-7 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <View className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC] mr-2" />
            <Text className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
              {t("common.appName")}
            </Text>
          </View>

          {/* ── Brand header với cosmic icon ──────────────────── */}
          <View className="items-center mb-8">
            <View
              className="mb-6 rounded-full overflow-hidden"
              style={{
                width: 104,
                height: 104,
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.55,
                shadowRadius: 36,
              }}
            >
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 104, height: 104 }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-[44px] font-extrabold text-white tracking-[-1.4px] leading-[1.05] text-center">
              {t("auth.login.title")}
            </Text>
            <Text className="text-[15px] text-white/55 mt-2 font-medium leading-[1.4] max-w-[280px] text-center">
              {t("auth.login.brandTagline")}
            </Text>
          </View>

          {/* ── Double-Bezel Login Card ───────────────────────── */}
          <View
            className="rounded-[28px] p-[1.5px] mb-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 24 },
              shadowOpacity: 0.45,
              shadowRadius: 48,
            }}
          >
            <View
              className="rounded-[26.5px] p-6"
              style={{
                backgroundColor: "rgba(20, 20, 26, 0.72)",
                shadowColor: "#FFFFFF",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 0,
              }}
            >
              {/* Email/Username */}
              <Field
                icon="user"
                placeholder={t("auth.login.emailOrUsername")}
                value={identifier}
                onChangeText={setIdentifier}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              {/* Hairline divider */}
              <View className="h-px bg-white/[0.06] my-1 ml-11" />

              {/* Password */}
              <Field
                ref={passwordRef}
                icon="lock"
                placeholder={t("auth.login.password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                rightAdornment={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={12}
                    className="w-9 h-9 rounded-full items-center justify-center bg-white/[0.04]"
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={16}
                      color="#9CA3AF"
                    />
                  </Pressable>
                }
              />
            </View>
          </View>

          {/* Forgot password — right-aligned */}
          <View className="flex-row justify-end mb-7">
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable hitSlop={8} className="active:opacity-60">
                <Text className="text-white/55 text-[13px] font-semibold">
                  {t("auth.login.forgotPassword")}
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Error Messages */}
          {error ? <ErrorBanner message={error} /> : null}
          {googleError ? <ErrorBanner message={googleError} /> : null}

          {/* ── Primary CTA: Button-in-Button pattern ────────── */}
          <PrimaryButton
            onPress={handleLogin}
            loading={isLoading}
            label={t("auth.login.submit")}
          />

          {/* ── Divider "hoặc" với uppercase tracking ────────── */}
          <View className="flex-row items-center my-7">
            <View className="flex-1 h-px bg-white/[0.06]" />
            <Text className="text-[10px] font-bold text-white/30 px-3 tracking-[0.2em] uppercase">
              {t("auth.login.orContinueWith")}
            </Text>
            <View className="flex-1 h-px bg-white/[0.06]" />
          </View>

          {/* ── Social Logins (stacked) ───────────────────────── */}
          <View className="gap-3 mb-6">
            <SecondaryButton
              onPress={loginWithGoogle}
              loading={isGoogleLoading}
              label={t("auth.login.googleLogin")}
              icon={<GoogleLogo size={18} />}
            />

            <Pressable
              onPress={continueAsGuest}
              className="flex-row items-center justify-center h-12 rounded-full active:opacity-70"
            >
              <Feather name="compass" size={15} color="#7DD3FC" />
              <Text className="text-[#7DD3FC] text-[13px] font-semibold ml-2">
                {t("auth.login.guestExperience")}
              </Text>
            </Pressable>
          </View>

          {/* ── Footer switcher ───────────────────────────────── */}
          <View className="flex-row justify-center items-center mt-2 gap-1.5">
            <Text className="text-white/45 text-sm font-medium">
              {t("auth.login.noAccount")}
            </Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={8} className="active:opacity-60">
                <Text className="text-[#7DD3FC] text-sm font-bold">
                  {t("auth.login.createAccount")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GridBackground>
  );
}
