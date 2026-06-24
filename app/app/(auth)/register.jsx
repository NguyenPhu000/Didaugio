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
import { Feather } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRegister } from "../../src/modules/auth/hooks/useRegister";
import { cn } from "../../src/lib/cn";
import { useTranslation } from "react-i18next";

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

  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleRegister = () => {
    register({ fullName, username, email, password, confirmPassword });
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

      {/* Deep Blur for background depth */}
      <BlurView 
        intensity={45} 
        tint="dark" 
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} 
      />

      {/* Dark gradient overlay */}
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
          <View className="items-center mb-6">
            <View 
              className="w-16 h-16 rounded-[18px] bg-white items-center justify-center mb-3 shadow-md elevation-2"
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
            <Text className="text-sm text-white/60 mt-1 font-medium">{t("auth.register.subtitle")}</Text>
          </View>

          {/* Glassmorphic Register Card */}
          <View 
            className="bg-white/95 rounded-[24px] p-6 w-full shadow-xl elevation-4"
            style={Platform.OS === "ios" ? {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            } : null}
          >
            <Text className="text-[30px] font-extrabold text-[#000000] mb-1.5">{t("auth.register.title")}</Text>
         

            {/* Section 1: Personal Info Grouped Cell */}
            <Text className="text-[11px] font-bold text-[#8E8E93] mb-2 ml-1 tracking-[0.5px]">{t("auth.register.personalInfo")}</Text>
            <View className="rounded-[14px] bg-[#F2F2F7] overflow-hidden border border-[#E5E5EA] mb-5">
              {/* Họ tên */}
              <View className={cn("flex-row items-center h-[52px] px-4 bg-transparent", fullNameFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="user"
                    size={19}
                    color={fullNameFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFullNameFocused(true)}
                  onBlur={() => setFullNameFocused(false)}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder={t("auth.register.fullName")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="name"
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                />
              </View>

              <View className="h-[1px] bg-[#E5E5EA] ml-12" />

              {/* Username */}
              <View className={cn("flex-row items-center h-[52px] px-4 bg-transparent", usernameFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="at-sign"
                    size={19}
                    color={usernameFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  ref={usernameRef}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder={t("auth.register.username")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="username"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>

              <View className="h-[1px] bg-[#E5E5EA] ml-12" />

              {/* Email */}
              <View className={cn("flex-row items-center h-[52px] px-4 bg-transparent", emailFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="mail"
                    size={19}
                    color={emailFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  ref={emailRef}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder={t("auth.register.email")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Section 2: Security Grouped Cell */}
            <Text className="text-[11px] font-bold text-[#8E8E93] mb-2 ml-1 tracking-[0.5px]">{t("auth.register.securityPassword")}</Text>
            <View className="rounded-[14px] bg-[#F2F2F7] overflow-hidden border border-[#E5E5EA] mb-5">
              {/* Mật khẩu */}
              <View className={cn("flex-row items-center h-[52px] px-4 bg-transparent", passwordFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="lock"
                    size={19}
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
                  autoComplete="new-password"
                  autoCapitalize="none"
                  placeholder={t("auth.register.password")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

              <View className="h-[1px] bg-[#E5E5EA] ml-12" />

              {/* Xác nhận mật khẩu */}
              <View className={cn("flex-row items-center h-[52px] px-4 bg-transparent", confirmPasswordFocused && "bg-[#E5E5EA]")}>
                <View className="w-8 items-start">
                  <Feather
                    name="check-circle"
                    size={19}
                    color={confirmPasswordFocused ? "#007AFF" : "#8E8E93"}
                  />
                </View>
                <TextInput
                  ref={confirmPasswordRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  placeholder={t("auth.register.confirmPassword")}
                  placeholderTextColor="#AEAEB2"
                  className="flex-1 text-[15px] text-[#1C1C1E] h-full font-medium"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={12}
                  className="p-1"
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#8E8E93"
                  />
                </Pressable>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="flex-row items-center bg-[#FFFAFA] border border-[#FFD6D6] rounded-xl px-3 py-2.5 gap-2 mb-5">
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text className="flex-1 text-[#FF3B30] text-[12.5px] font-semibold">{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View className="flex-row items-center bg-[#F5FDF7] border border-[#D3F4DB] rounded-xl px-3 py-2.5 gap-2 mb-5">
                <Feather name="check-circle" size={16} color="#34C759" />
                <Text className="flex-1 text-[#34C759] text-[12.5px] font-semibold">{successMessage}</Text>
              </View>
            ) : null}

            {/* Main Action Button */}
            <View 
              className="rounded-[14px] overflow-hidden mt-2"
              style={Platform.OS === "ios" ? {
                shadowColor: "#007AFF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              } : {
                elevation: 3,
              }}
            >
              <Pressable
                onPress={handleRegister}
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
                    <Text className="text-white text-base font-bold">{t("auth.register.submit")}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Footer switcher */}
            <View className="flex-row justify-center items-center mt-5 gap-1.5">
              <Text className="text-[#8E8E93] text-sm font-medium">{t("auth.register.hasAccount")}</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={8} className="active:opacity-70">
                  <Text className="text-[#007AFF] text-sm font-semibold">{t("auth.register.loginNow")}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
