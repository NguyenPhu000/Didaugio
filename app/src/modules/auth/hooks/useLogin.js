import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import i18n from "@/i18n";
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
        setError(i18n.t("authValidation.loginRequired"));
        return false;
      }

      if (identifierLooksLikeEmail) {
        if (!/\S+@\S+\.\S+/.test(normalizedLoginIdentifier)) {
          setError(i18n.t("authValidation.loginEmailInvalid"));
          return false;
        }
      } else if (
        normalizedLoginIdentifier.length < 3 ||
        !/^[a-zA-Z0-9_]+$/.test(normalizedLoginIdentifier)
      ) {
        setError(i18n.t("authValidation.loginUsernameFormat"));
        return false;
      }

      if (!password) {
        setError(i18n.t("authValidation.passwordRequired"));
        return false;
      }

      setIsLoading(true);
      try {
        const res = await loginApi(normalizedLoginIdentifier, password);
        const { accessToken, refreshToken, user, errorMessage } =
          normalizeAuthSessionResponse(res);

        if (!accessToken || !user) {
          throw new Error(
            errorMessage || i18n.t("authValidation.noSessionData"),
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
            i18n.t("authValidation.emailNotVerified"),
          );
          return false;
        }

        // Show helpful message for inactive accounts
        if (err?.code === "ACCOUNT_INACTIVE") {
          setError(
            err?.message || "Tài khoản chưa được kích hoạt. Vui lòng đăng nhập bằng Google để kích hoạt.",
          );
          return false;
        }

        setError(err?.message || i18n.t("authValidation.loginFailed"));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setSession, router],
  );

  return { login, isLoading, error };
}
