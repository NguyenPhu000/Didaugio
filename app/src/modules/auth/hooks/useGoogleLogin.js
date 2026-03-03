import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "../../../stores/authStore";
import { API_BASE_URL } from "../../../constants/api";

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = "didaugio";

const decodeUserPayload = (userBase64) => {
  if (!userBase64) return null;
  try {
    return JSON.parse(atob(userBase64));
  } catch {
    return null;
  }
};

export function useGoogleLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const oauthUrl = `${API_BASE_URL}/auth/google/web`;

      const result = await WebBrowser.openAuthSessionAsync(
        oauthUrl,
        `${APP_SCHEME}://`,
      );

      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }

      if (result.type !== "success" || !result.url) {
        setError("Đăng nhập không thành công. Vui lòng thử lại.");
        return;
      }

      const url = result.url;
      const params = new URLSearchParams(url.split("?")[1] || "");

      if (url.includes("auth-error")) {
        setError(params.get("message") || "Đăng nhập thất bại");
        return;
      }

      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userBase64 = params.get("user");

      if (!accessToken) {
        setError("Không nhận được token. Vui lòng thử lại.");
        return;
      }

      const user = decodeUserPayload(userBase64);
      await setSession({ user, accessToken, refreshToken });
      router.replace("/(tabs)/map");
    } catch (e) {
      setError(e?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
