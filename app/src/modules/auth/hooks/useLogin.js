/**
 * useLogin — email/password authentication hook
 */
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../../../stores/authStore";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(
    async (email, password) => {
      setError(null);

      if (!email.trim()) {
        setError("Vui lòng nhập email.");
        return;
      }
      if (!password) {
        setError("Vui lòng nhập mật khẩu.");
        return;
      }

      setIsLoading(true);
      try {
        const res = await loginApi(email.trim().toLowerCase(), password);
        const { accessToken, refreshToken, user } = res.data?.data || res.data;
        await setSession({ user, accessToken, refreshToken });
        router.replace("/(tabs)/map");
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Đăng nhập thất bại. Vui lòng thử lại.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, router],
  );

  return { login, isLoading, error };
}
