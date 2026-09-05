// MAP: RegisterScreen
// ├── UI: @/components/ui/GridBackground, @/components/primitives/PasswordValidationBar
// └── API: @/modules/auth/hooks/useRegister

import { useRef, useState, useCallback, useMemo, forwardRef } from "react";
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
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useRegister } from "../../src/modules/auth/hooks/useRegister";
import i18n from "../../src/i18n";
import { useTranslation } from "react-i18next";
import { GridBackground } from "../../src/components/ui/GridBackground";

/* ──────────────────────────────────────────────────────────────────
   Sub-components
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

function PasswordStrength({ password }) {
  const { score, color } = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    const palette = [
      "#FF6B6B",
      "#F59E0B",
      "#7DD3FC",
      "#7DD3FC",
      "#7DD3FC",
    ];
    return { score, color: palette[score] };
  }, [password]);

  if (!password) return null;
  const labels = [
    "auth.register.strengthWeak",
    "auth.register.strengthFair",
    "auth.register.strengthGood",
    "auth.register.strengthStrong",
  ];
  return (
    <View className="mt-3 mb-1">
      <View className="flex-row gap-1.5 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className="flex-1 h-[3px] rounded-full"
            style={{
              backgroundColor:
                i < score ? color : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </View>
      <Text
        className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color }}
      >
        {i18n.t(labels[Math.min(score, labels.length - 1)])}
      </Text>
    </View>
  );
}

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

function ErrorBanner({ message, type = "error" }) {
  const isError = type === "error";
  const accent = isError ? "#FF6B6B" : "#7DD3FC";
  const text = isError ? "#FF8B85" : "#7DD3FC";
  const icon = isError ? "alert-circle" : "check-circle";
  const bg = isError ? "rgba(255, 59, 48, 0.08)" : "rgba(212, 255, 79, 0.08)";
  const border = isError ? "rgba(255, 59, 48, 0.25)" : "rgba(212, 255, 79, 0.25)";
  return (
    <View
      className="flex-row items-center rounded-2xl px-4 py-3 mb-5"
      style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}
    >
      <Feather name={icon} size={16} color={accent} />
      <Text
        className="flex-1 text-[12.5px] font-semibold ml-2.5"
        style={{ color: text }}
      >
        {message}
      </Text>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────
   RegisterScreen
   ────────────────────────────────────────────────────────────────── */

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, isLoading, error, successMessage } = useRegister();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleRegister = useCallback(async () => {
    const result = await register({
      fullName,
      username,
      email,
      password,
      confirmPassword,
    });
    if (result?.email) {
      router.replace({
        pathname: "/(auth)/verify-otp",
        params: { email: result.email },
      });
    }
  }, [register, fullName, username, email, password, confirmPassword, router]);

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
            paddingTop: insets.top + 28,
            paddingBottom: Math.max(insets.bottom + 24, 36),
          }}
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Eyebrow micro-tag ─────────────────────────────── */}
          <View className="flex-row items-center self-center mb-6 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
            <View className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC] mr-2" />
            <Text className="text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
              {t("common.appName")}
            </Text>
          </View>

          {/* ── Brand header với cosmic icon ──────────────────── */}
          <View className="items-center mb-7">
            <View
              className="mb-5 rounded-full overflow-hidden"
              style={{
                width: 96,
                height: 96,
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.55,
                shadowRadius: 32,
              }}
            >
              <Image
                source={require("../../assets/icon.png")}
                style={{ width: 96, height: 96 }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-[38px] font-extrabold text-white tracking-[-1.2px] leading-[1.05] text-center">
              {t("auth.register.title")}
            </Text>
            <Text className="text-[14px] text-white/55 mt-1.5 font-medium max-w-[280px] text-center">
              {t("auth.register.subtitle")}
            </Text>
          </View>

          {/* ── Section: Personal Info (Double-Bezel Card) ──── */}
          <Text className="text-[10px] font-bold text-white/40 mb-2 ml-1 tracking-[0.2em] uppercase">
            {t("auth.register.personalInfo")}
          </Text>
          <View
            className="rounded-[24px] p-[1.5px] mb-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.35,
              shadowRadius: 36,
            }}
          >
            <View
              className="rounded-[22.5px] px-5 py-3"
              style={{ backgroundColor: "rgba(20, 20, 26, 0.72)" }}
            >
              <Field
                icon="user"
                placeholder={t("auth.register.fullName")}
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                autoCapitalize="words"
              />
              <View className="h-px bg-white/[0.06] my-1 ml-11" />
              <Field
                ref={usernameRef}
                icon="at-sign"
                placeholder={t("auth.register.username")}
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <View className="h-px bg-white/[0.06] my-1 ml-11" />
              <Field
                ref={emailRef}
                icon="mail"
                placeholder={t("auth.register.email")}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          {/* ── Section: Security (Double-Bezel Card) ────────── */}
          <Text className="text-[10px] font-bold text-white/40 mb-2 ml-1 tracking-[0.2em] uppercase">
            {t("auth.register.securityPassword")}
          </Text>
          <View
            className="rounded-[24px] p-[1.5px] mb-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.35,
              shadowRadius: 36,
            }}
          >
            <View
              className="rounded-[22.5px] px-5 py-3"
              style={{ backgroundColor: "rgba(20, 20, 26, 0.72)" }}
            >
              <Field
                ref={passwordRef}
                icon="lock"
                placeholder={t("auth.register.password")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
              <View className="ml-11">
                <PasswordStrength password={password} />
              </View>
              <View className="h-px bg-white/[0.06] my-1 ml-11" />
              <Field
                ref={confirmPasswordRef}
                icon="check-circle"
                placeholder={t("auth.register.confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                rightAdornment={
                  <Pressable
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    hitSlop={12}
                    className="w-9 h-9 rounded-full items-center justify-center bg-white/[0.04]"
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={16}
                      color="#9CA3AF"
                    />
                  </Pressable>
                }
              />
            </View>
          </View>

          {/* Error / Success */}
          {error ? <ErrorBanner message={error} type="error" /> : null}
          {successMessage ? (
            <ErrorBanner message={successMessage} type="success" />
          ) : null}

          {/* ── Primary CTA ────────────────────────────────────── */}
          <PrimaryButton
            onPress={handleRegister}
            loading={isLoading}
            label={t("auth.register.submit")}
          />

          {/* ── Footer switcher ────────────────────────────────── */}
          <View className="flex-row justify-center items-center mt-6 gap-1.5">
            <Text className="text-white/45 text-sm font-medium">
              {t("auth.register.hasAccount")}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8} className="active:opacity-60">
                <Text className="text-[#7DD3FC] text-sm font-bold">
                  {t("auth.register.loginNow")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GridBackground>
  );
}
