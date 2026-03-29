import { useCallback, useState } from "react";
import { registerApi } from "../api/authApi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const register = useCallback(
    async ({ fullName, email, password, confirmPassword }) => {
      setError(null);
      setSuccessMessage(null);

      const normalizedEmail = email.trim().toLowerCase();
      const trimmedFullName = fullName.trim();

      if (trimmedFullName.length < 2) {
        setError("Họ tên phải có ít nhất 2 ký tự.");
        return false;
      }

      if (!normalizedEmail) {
        setError("Vui lòng nhập email.");
        return false;
      }

      if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
        setError("Email không hợp lệ.");
        return false;
      }

      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return false;
      }

      if (!PASSWORD_REGEX.test(password)) {
        setError("Mật khẩu cần có chữ hoa, chữ thường và số.");
        return false;
      }

      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return false;
      }

      setIsLoading(true);
      try {
        const res = await registerApi({
          email: normalizedEmail,
          password,
          confirmPassword,
          fullName: trimmedFullName,
        });

        setSuccessMessage(
          res?.message || "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
        );
        return true;
      } catch (err) {
        const msg =
          err?.message || "Đăng ký thất bại. Vui lòng thử lại.";
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
