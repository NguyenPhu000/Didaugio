import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuthStore } from "../../../stores/authStore";
import { loginGoogleApi } from "../api/authApi";

const buildLoginError = (message, code) => ({ message, code });

export function useGoogleLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleModule, setGoogleModule] = useState(null);

  const isExpoGo =
    Constants.executionEnvironment === "storeClient" ||
    Constants.appOwnership === "expo";

  const googleConfig = useMemo(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    return {
      webClientId,
      iosClientId: iosClientId || undefined,
      scopes: ["openid", "profile", "email"],
      offlineAccess: false,
      forceCodeForRefreshToken: false,
      profileImageSize: 128,
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const setupGoogleSignin = async () => {
      if (isExpoGo) return;

      try {
        const module =
          await import("@react-native-google-signin/google-signin");
        if (isCancelled) return;

        module.GoogleSignin.configure(googleConfig);
        setGoogleModule(module);
      } catch {
        if (!isCancelled) {
          setGoogleModule(null);
        }
      }
    };

    setupGoogleSignin();
    return () => {
      isCancelled = true;
    };
  }, [googleConfig, isExpoGo]);

  const login = async () => {
    setError(null);
    if (isExpoGo) {
      setError(
        "Google Sign-In native không chạy trên Expo Go. Hãy dùng development build (npx expo run:android).",
      );
      return;
    }

    if (!googleConfig.webClientId) {
      setError("Thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong app/.env.");
      return;
    }

    setIsLoading(true);
    try {
      const module =
        googleModule ||
        (await import("@react-native-google-signin/google-signin"));

      const {
        GoogleSignin,
        isCancelledResponse,
        isErrorWithCode,
        isSuccessResponse,
        statusCodes,
      } = module;

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) {
        return;
      }

      if (!isSuccessResponse(response)) {
        setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
        return;
      }

      let idToken = response.data?.idToken || null;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken || null;
      }

      if (!idToken) {
        setError("Không nhận được id_token từ Google.");
        return;
      }

      const res = await loginGoogleApi(idToken);
      const payload = res?.data || res;
      const { accessToken, refreshToken, user } = payload || {};

      if (!accessToken || !refreshToken || !user) {
        setError("Phiên đăng nhập Google không hợp lệ.");
        return;
      }

      await setSession({ user, accessToken, refreshToken });
      router.replace("/(tabs)/map");
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.IN_PROGRESS) {
          setError("Đăng nhập đang xử lý, vui lòng đợi.");
        } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Thiết bị thiếu Google Play Services hoặc cần cập nhật.");
        } else {
          setError(e.message || "Đăng nhập Google thất bại.");
        }
        return;
      }

      const normalizedError = buildLoginError(
        e?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        e?.code || "GOOGLE_LOGIN_FAILED",
      );
      setError(normalizedError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
