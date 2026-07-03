import { useCallback, useState } from "react";
import i18n from "@/i18n";
import { registerApi } from "../api/authApi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const register = useCallback(
    async ({ fullName, username, email, password, confirmPassword }) => {
      setError(null);
      setSuccessMessage(null);

      const normalizedEmail = email.trim().toLowerCase();
      const trimmedFullName = fullName.trim();
      const trimmedUsername = String(username || "").trim();

      if (trimmedFullName.length < 2) {
        setError(i18n.t("authValidation.nameMin"));
        return false;
      }

      if (!normalizedEmail) {
        setError(i18n.t("authValidation.emailRequired"));
        return false;
      }

      if (!trimmedUsername) {
        setError(i18n.t("authValidation.usernameRequired"));
        return false;
      }

      if (!USERNAME_REGEX.test(trimmedUsername)) {
        setError(
          i18n.t("authValidation.usernameFormat"),
        );
        return false;
      }

      if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
        setError(i18n.t("authValidation.emailInvalid"));
        return false;
      }

      if (password.length < 6) {
        setError(i18n.t("authValidation.passwordMin"));
        return false;
      }

      if (!PASSWORD_REGEX.test(password)) {
        setError(i18n.t("authValidation.passwordComplexity"));
        return false;
      }

      if (password !== confirmPassword) {
        setError(i18n.t("authValidation.passwordMismatch"));
        return false;
      }

      setIsLoading(true);
      try {
        const res = await registerApi({
          username: trimmedUsername,
          email: normalizedEmail,
          password,
          confirmPassword,
          fullName: trimmedFullName,
        });

        setSuccessMessage(
          res?.message ||
            i18n.t("authValidation.registerSuccess"),
        );
        return true;
      } catch (err) {
        const msg = err?.message || i18n.t("authValidation.registerFailed");
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    register,
    isLoading,
    error,
    successMessage,
  };
}
