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
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useGoogleLogin } from "../../src/modules/auth/hooks/useGoogleLogin";
import { useAuth } from "../../src/modules/auth/hooks/useAuth";
import { useLogin } from "../../src/modules/auth/hooks/useLogin";
import { cn } from "../../src/lib/cn";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    login: loginWithGoogle,
    isLoading: isGoogleLoading,
    error: googleError,
  } = useGoogleLogin();
  const { continueAsGuest } = useAuth();
  const { login, isLoading, error } = useLogin();
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [identifierFocused, setIdentifierFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef(null);

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) return;
    login(identifier.trim(), password);
  };

  return (
    <View className="flex-1 bg-[#020617]">
      <StatusBar style="light" />

      {/* Background Image */}
      <Image
        source={require("../../assets/sky.jpg")}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        contentFit="cover"
        transition={1000}
      />

      {/* Deep Blur for the entire background */}
      <BlurView 
        intensity={45} 
        tint="dark" 
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} 
      />

      {/* Dark gradient mask */}
      <LinearGradient
        colors={["rgba(2, 6, 23, 0.3)", "rgba(2, 6, 23, 0.75)"]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          bounces={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingTop: insets.top + 40,
            paddingBottom: Math.max(insets.bottom + 20, 40)
          }}
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View className="items-center mb-8">
            <View 
              className="w-16 h-16 rounded-[18px] bg-white items-center justify-center mb-4 shadow-md elevation-2"
              style={Platform.OS === "ios" ? {
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              } : null}
            >
              <MaterialIcons name="travel-explore" size={32} color="#007AFF" />
            </View>
            <Text className="text-[28px] font-extrabold text-white tracking-[-0.5px]">{t("common.appName")}</Text>
            <Text className="text-sm text-white/60 mt-1 font-medium">{t("auth.login.brandTagline")}</Text>
          </View>

          {/* Glassmorphic Login Card */}
          <View 
            className="bg-white/95 rounded-[24px] p-6 w-full shadow-xl elevation-4"
            style={Platform.OS === "ios" ? {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            } : null}
          >
            <Text className="text-[30px] font-extrabold  text-[#000000] mb-1.5">{t("auth.login.title")}</Text>
           

            {/* iOS Settings Style Grouped Fields */}
            <View className="rounded-[14px] bg-[#F2F2F7] overflow-hidden border border-[#E5E5EA] mb-4">
              {/* Field 1: Email/Username */}
              <View className={cn("flex-row items-center h-[54px] px-4 bg-transparent", identifierFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="user"
                    size={20}
                    color={identifierFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  onFocus={() => setIdentifierFocused(true)}
                  onBlur={() => setIdentifierFocused(false)}
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder={t("auth.login.emailOrUsername")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* Separator line */}
              <View className="h-[1px] bg-[#E5E5EA] ml-12" />

              {/* Field 2: Password */}
              <View className={cn("flex-row items-center h-[54px] px-4 bg-transparent", passwordFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="lock"
                    size={20}
                    color={passwordFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  autoCapitalize="none"
                  placeholder={t("auth.login.password")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={12}
                  className="p-1"
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#8E8E93"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Messages */}
            {error ? (
              <View className="flex-row items-center bg-[#FFFAFA] border border-[#FFD6D6] rounded-xl px-3 py-2.5 gap-2 mb-4">
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text className="flex-1 text-[#FF3B30] text-[12.5px] font-semibold">{error}</Text>
              </View>
            ) : null}

            {googleError ? (
              <View className="flex-row items-center bg-[#FFFAFA] border border-[#FFD6D6] rounded-xl px-3 py-2.5 gap-2 mb-4">
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text className="flex-1 text-[#FF3B30] text-[12.5px] font-semibold">{googleError}</Text>
              </View>
            ) : null}

            {/* Main Action Button (Apple Royal Blue Gradient) */}
            <View 
              className="rounded-[14px] overflow-hidden mt-2 shadow-sm elevation-2"
              style={Platform.OS === "ios" ? {
                shadowColor: "#007AFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              } : null}
            >
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }}
              >
                <LinearGradient
                  colors={["#007AFF", "#0056B3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[52px] items-center justify-center"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white text-base font-bold">{t("auth.login.submit")}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Divider "hoặc" */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-[#E5E5EA]" />
              <Text className="text-[11px] font-bold text-[#C7C7CC] px-3 tracking-[1px]">{t("auth.login.orContinueWith")}</Text>
              <View className="flex-1 h-[1px] bg-[#E5E5EA]" />
            </View>

            {/* Social Logins */}
            <View className="flex-row gap-2.5 mb-4 w-full">
              <Pressable
                onPress={loginWithGoogle}
                disabled={isGoogleLoading}
                className="flex-1 flex-row items-center justify-center h-12 rounded-[14px] bg-white border border-[#E5E5EA] gap-1.5 shadow-sm elevation-1 active:opacity-90 active:scale-[0.98]"
                style={Platform.OS === "ios" ? {
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                } : null}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#1C1C1E" size="small" />
                ) : (
                  <>
                    <FontAwesome5 name="google" size={15} color="#EA4335" />
                    <Text className="text-[#1C1C1E] text-[13px] font-semibold">{t("auth.login.googleLogin")}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={continueAsGuest}
                className="flex-1 flex-row items-center justify-center h-12 rounded-[14px] bg-[#007AFF]/10 gap-1.5 active:opacity-90 active:scale-[0.98]"
              >
                <Feather name="compass" size={16} color="#007AFF" />
                <Text className="text-[#007AFF] text-[13px] font-semibold">{t("auth.login.guestExperience")}</Text>
              </Pressable>
            </View>

            {/* Footer switcher */}
            <View className="flex-row justify-center items-center mt-4 gap-1.5">
              <Text className="text-[#8E8E93] text-sm font-medium">{t("auth.login.noAccount")}</Text>
              <Link href="/(auth)/register" asChild>
                <Pressable hitSlop={8} className="active:opacity-70">
                  <Text className="text-[#007AFF] text-sm font-semibold">{t("auth.login.createAccount")}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
