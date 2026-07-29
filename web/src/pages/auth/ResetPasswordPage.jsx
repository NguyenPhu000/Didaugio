import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";
import { authService } from "@/apis";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
  primaryButton,
  eyeButton,
  authCard,
} from "@/components/auth/authStyles";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, i18n.t("validation.passwordMin", { min: 8 }))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
        i18n.t("validation.passwordPattern")
      ),
    confirmPassword: z.string().min(1, i18n.t("validation.confirmPasswordRequired")),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: i18n.t("validation.passwordMismatch"),
    path: ["confirmPassword"],
  });

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch("newPassword");

  useEffect(() => {
    if (!token) {
      setTokenError(t("auth.resetPassword.tokenExpired"));
    }
  }, [token, t]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error(t("auth.resetPassword.invalidToken"));
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(
        token,
        data.newPassword,
        data.confirmPassword
      );
      setResetSuccess(true);
      toast.success(t("auth.resetPassword.success"));

      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error) {
      toast.error(error.message || t("auth.resetPassword.failed"));
      if (error.message.includes("token")) {
        setTokenError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Thanh đo độ mạnh mật khẩu
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 1, label: t("auth.resetPassword.strengthWeak"), color: "bg-rose-500" },
      { strength: 2, label: t("auth.resetPassword.strengthFair"), color: "bg-amber-500" },
      { strength: 3, label: t("auth.resetPassword.strengthGood"), color: "bg-sky-500" },
      { strength: 4, label: t("auth.resetPassword.strengthStrong"), color: "bg-emerald-500" },
      { strength: 5, label: t("auth.resetPassword.strengthVeryStrong"), color: "bg-emerald-600" },
    ];

    return levels.find((l) => l.strength === strength) || levels[0];
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (tokenError && !token) {
    return (
      <AuthShell
        eyebrow="Đặt lại mật khẩu"
        title="Bảo mật tài khoản của bạn luôn được ưu tiên"
        subtitle="Liên kết đặt lại mật khẩu chỉ có hiệu lực trong thời gian giới hạn để đảm bảo an toàn."
      >
        <div className={`${authCard} space-y-4 text-center`}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <XCircle className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            {t("auth.resetPassword.invalidToken")}
          </h2>
          <p className="text-sm text-slate-500">
            {tokenError || t("auth.resetPassword.invalidTokenMessage")}
          </p>
          <Link
            to="/auth/forgot-password"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {t("auth.resetPassword.resendRequest")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (resetSuccess) {
    return (
      <AuthShell
        eyebrow="Đặt lại mật khẩu"
        title="Xong rồi! Tài khoản của bạn đã sẵn sàng"
        subtitle="Mật khẩu mới đã được lưu. Bạn có thể đăng nhập ngay bây giờ."
      >
        <div className={`${authCard} space-y-4 text-center`}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            {t("auth.resetPassword.success")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("auth.resetPassword.successMessage")}
          </p>
          <Link
            to="/auth/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#F3E600] text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#e3d600]"
          >
            {t("auth.resetPassword.loginNow")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Đặt lại mật khẩu"
      title="Tạo mật khẩu mới cho tài khoản của bạn"
      subtitle="Chọn một mật khẩu mạnh để giữ cho không gian làm việc du lịch của bạn an toàn."
    >
      <div className="mb-7">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
          <Lock className="h-7 w-7" strokeWidth={2} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("auth.resetPassword.newPasswordPlaceholder")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Mật khẩu mới */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className={fieldLabel}>
            <Lock className="h-4 w-4 text-slate-400" />
            {t("auth.resetPassword.newPassword")}
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
              autoFocus
              autoComplete="new-password"
              {...register("newPassword")}
              className={`${fieldInput} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeButton}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className={fieldError}>{errors.newPassword.message}</p>
          )}

          {/* Độ mạnh mật khẩu */}
          {newPassword && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength.strength
                        ? passwordStrength.color
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {t("auth.resetPassword.strengthLabel")}{" "}
                <span className="font-semibold text-slate-700">
                  {passwordStrength.label}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={fieldLabel}>
            <Lock className="h-4 w-4 text-slate-400" />
            {t("auth.resetPassword.confirmPassword")}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`${fieldInput} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={eyeButton}
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className={fieldError}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className={primaryButton}
          loading={isLoading}
          disabled={isLoading}
        >
          <Lock className="mr-1 h-4 w-4" />
          {t("auth.resetPassword.submit")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          {t("auth.resetPassword.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
