import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GridBackground } from "../../src/components/ui/GridBackground";
import { MaterialIconsRounded } from "../../src/components/primitives/MaterialIconsRounded";
import { OtpInput } from "../../src/modules/auth/components/OtpInput";
import {
  resendVerificationPublicApi,
  verifyEmailOtpApi,
} from "../../src/modules/auth/api/authApi";

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = useMemo(() => String(params?.email || "").trim().toLowerCase(), [params?.email]);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Thieu email xac thuc. Vui long dang ky lai.");
      return;
    }

    if (otp.length !== 6) {
      setError("Nhap du 6 so OTP trong email.");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailOtpApi({ email, otp });
      router.replace({
        pathname: "/(auth)/login",
        params: { identifier: email },
      });
    } catch (err) {
      setError(err?.message || "Khong xac thuc duoc OTP. Vui long thu lai.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;
    setError(null);
    setMessage(null);
    setIsResending(true);
    try {
      await resendVerificationPublicApi(email);
      setOtp("");
      setMessage("Da gui lai ma OTP. Kiem tra hop thu cua ban.");
    } catch (err) {
      setError(err?.message || "Khong gui lai duoc OTP luc nay.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <GridBackground
      backgroundColor="#020617"
      cellSize={48}
      lineColor="rgba(255,255,255,0.04)"
      backgroundImage={require("../../assets/sky.jpg")}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingTop: insets.top + 40,
            paddingBottom: Math.max(insets.bottom + 20, 40),
          }}
          className="px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-[18px] bg-white items-center justify-center mb-3">
              <MaterialIconsRounded name="mark-email-read" size={32} color="#007AFF" />
            </View>
            <Text className="text-[28px] font-extrabold text-white">Xac thuc email</Text>
            <Text className="text-sm text-white/65 mt-1 text-center">
              Nhap ma 6 so vua duoc gui den email cua ban
            </Text>
          </View>

          <View className="bg-white/95 rounded-[24px] p-6 w-full shadow-xl elevation-4">
            <Text className="text-[13px] font-bold text-[#64748B] mb-2">EMAIL</Text>
            <View className="flex-row items-center rounded-2xl bg-[#F2F2F7] px-4 h-12 mb-5">
              <Feather name="mail" size={17} color="#64748B" />
              <Text className="ml-3 flex-1 text-[#0F172A] font-semibold" numberOfLines={1}>
                {email || "Chua co email"}
              </Text>
            </View>

            <OtpInput
              value={otp}
              onChange={(nextOtp) => {
                setOtp(nextOtp);
                if (error) setError(null);
              }}
              disabled={isVerifying}
              hasError={Boolean(error)}
            />

            {error ? (
              <View className="flex-row items-center bg-[#FFFAFA] border border-[#FFD6D6] rounded-xl px-3 py-2.5 gap-2 mt-5">
                <Feather name="alert-circle" size={16} color="#FF3B30" />
                <Text className="flex-1 text-[#FF3B30] text-[12.5px] font-semibold">{error}</Text>
              </View>
            ) : null}

            {message ? (
              <View className="flex-row items-center bg-[#F5FDF7] border border-[#D3F4DB] rounded-xl px-3 py-2.5 gap-2 mt-5">
                <Feather name="check-circle" size={16} color="#34C759" />
                <Text className="flex-1 text-[#34C759] text-[12.5px] font-semibold">{message}</Text>
              </View>
            ) : null}

            <View className="rounded-[14px] overflow-hidden mt-6">
              <Pressable
                onPress={handleVerify}
                disabled={isVerifying}
                style={({ pressed }) => [
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  isVerifying && { opacity: 0.65 },
                ]}
              >
                <LinearGradient
                  colors={["#007AFF", "#0056B3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[52px] items-center justify-center"
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-base font-bold">Xac thuc</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <Pressable
              onPress={handleResend}
              disabled={isResending}
              className="h-12 items-center justify-center mt-3"
            >
              <Text className="text-[#007AFF] font-semibold">
                {isResending ? "Dang gui lai..." : "Gui lai ma OTP"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GridBackground>
  );
}
