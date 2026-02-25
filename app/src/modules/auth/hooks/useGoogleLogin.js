/**
 * useGoogleLogin — Google OAuth 2.0 server-side Authorization Code Flow
 *
 * Flow:
 * 1. App mở in-app browser → SERVER/api/auth/google/web
 * 2. Server redirect → Google sign-in page
 * 3. User đăng nhập → Google redirect về server callback
 * 4. Server exchange code → id_token → tạo JWT session
 * 5. Server redirect về deep link: didaugio://auth-success?accessToken=...
 * 6. openAuthSessionAsync bắt deep link → đóng browser → trả về app
 * 7. App parse params → setSession
 *
 * ✅ Hoạt động trong Expo Go — không cần build native
 *
 * Cần trong Google Cloud Console (Web OAuth client → Authorized redirect URIs):
 *   http://localhost:8081/api/auth/google/web/callback   (Android emulator + adb reverse)
 *   https://YOUR.ngrok.io/api/auth/google/web/callback   (Real device)
 *
 * Dev Android emulator: chạy `adb reverse tcp:8081 tcp:8081` trước
 */
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "../../../stores/authStore";

WebBrowser.maybeCompleteAuthSession();

const SERVER_GOOGLE_OAUTH_URL = `${process.env.EXPO_PUBLIC_API_URL}/auth/google/web`;
const APP_SCHEME = "didaugio";

/**
 * Safely decode base64 user payload from deep link
 * Server gửi: encodeURIComponent(Buffer.from(JSON.stringify(user)).toString('base64'))
 * URLSearchParams.get() auto-decodes %XX → cần decode base64 → parse JSON
 */
const decodeUserPayload = (userBase64) => {
  if (!userBase64) return null;
  try {
    // URLSearchParams đã tự decode %XX, nên userBase64 là chuỗi base64 thuần
    const jsonStr = atob(userBase64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

export function useGoogleLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Mở browser → đợi deep link didaugio:// trả về
      const result = await WebBrowser.openAuthSessionAsync(
        SERVER_GOOGLE_OAUTH_URL,
        `${APP_SCHEME}://`,
      );

      if (result.type !== "success") {
        // User đóng browser hoặc cancel — không phải lỗi
        return;
      }

      // result.url = "didaugio://auth-success?accessToken=...&refreshToken=...&user=BASE64"
      // hoặc       = "didaugio://auth-error?message=..."
      const url = result.url || "";
      const queryPart = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryPart);

      if (url.includes("auth-error")) {
        const message = decodeURIComponent(
          params.get("message") || "Đăng nhập thất bại",
        );
        setError(message);
        return;
      }

      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userBase64 = params.get("user");

      if (!accessToken) {
        setError("Không nhận được token. Vui lòng thử lại.");
        return;
      }

      // Thử decode user từ deep link payload trước
      let user = decodeUserPayload(userBase64);
      // Nếu decode fail → user = null.
      // AppProvider.Bootstrap sẽ tự gọi /auth/me trong background và cập nhật user.

      await setSession({ user, accessToken, refreshToken });
    } catch (e) {
      setError(e?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
