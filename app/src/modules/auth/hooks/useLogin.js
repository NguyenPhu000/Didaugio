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

      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        setError("Vui lòng nhập email.");
        return false;
      }

      if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
        setError("Email không hợp lệ.");
        return false;
      }

      if (!password) {
        setError("Vui lòng nhập mật khẩu.");
        return false;
      }

      setIsLoading(true);
      try {
        const res = await loginApi(normalizedEmail, password);
        const payload = res?.data || res;
        const { accessToken, refreshToken, user } = payload || {};

        if (!accessToken || !refreshToken || !user) {
          throw new Error("Không nhận được dữ liệu phiên đăng nhập hợp lệ.");
        }

        await setSession({ user, accessToken, refreshToken });
        router.replace("/(tabs)/map");
        return true;
      } catch (err) {
        if (err?.code === "EMAIL_NOT_VERIFIED") {
          setError(
            "Email chưa xác thực. Vui lòng kiểm tra hộp thư và xác thực trước khi đăng nhập.",
          );
          return false;
        }

        setError(
          err?.message || "Đăng nhập thất bại. Vui lòng thử lại.",
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, router],
  );

  return { login, isLoading, error };
}
