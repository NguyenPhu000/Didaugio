import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { loginApi } from "../api/authApi";
import { useAuthStore } from "../../../stores/authStore";
import { normalizeAuthSessionResponse } from "../utils/normalizeAuthSession";

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(
    async (identifier, password) => {
      setError(null);

      const normalizedIdentifier = String(identifier || "").trim();
      const identifierLooksLikeEmail = /\S+@\S+\.\S+/.test(
        normalizedIdentifier,
      );
      const normalizedLoginIdentifier = identifierLooksLikeEmail
        ? normalizedIdentifier.toLowerCase()
        : normalizedIdentifier;

      if (!normalizedLoginIdentifier) {
        setError("Vui lòng nhập email hoặc username.");
        return false;
      }

      if (identifierLooksLikeEmail) {
        if (!/\S+@\S+\.\S+/.test(normalizedLoginIdentifier)) {
          setError("Email không hợp lệ.");
          return false;
        }
      } else if (
        normalizedLoginIdentifier.length < 3 ||
        !/^[a-zA-Z0-9_]+$/.test(normalizedLoginIdentifier)
      ) {
        setError("Username phải từ 3 ký tự và chỉ gồm chữ, số, dấu gạch dưới.");
        return false;
      }

      if (!password) {
        setError("Vui lòng nhập mật khẩu.");
        return false;
      }

      setIsLoading(true);
      try {
        const res = await loginApi(normalizedLoginIdentifier, password);
        const { accessToken, refreshToken, user, errorMessage } =
          normalizeAuthSessionResponse(res);

        if (!accessToken || !user) {
          throw new Error(
            errorMessage || "Không nhận được dữ liệu phiên đăng nhập hợp lệ.",
          );
        }

        await setSession({
          user,
          accessToken,
          refreshToken: refreshToken || null,
        });
        router.replace("/(tabs)/map");
        return true;
      } catch (err) {
        if (err?.code === "EMAIL_NOT_VERIFIED") {
          setError(
            "Email chưa xác thực. Vui lòng đăng nhập bằng email để nhận lại liên kết xác thực.",
          );
          return false;
        }

        setError(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, router],
  );

  return { login, isLoading, error };
}
