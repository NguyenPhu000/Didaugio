import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authService } from "@/apis";

export const ChangePasswordModal = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z
            .string()
            .min(1, t("user.changePassword.currentPasswordRequired")),
          newPassword: z
            .string()
            .min(8, t("user.changePassword.newPasswordMin"))
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              t("user.changePassword.newPasswordComplexity")
            ),
          confirmPassword: z
            .string()
            .min(1, t("user.changePassword.confirmPasswordRequired")),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("user.changePassword.passwordMismatch"),
          path: ["confirmPassword"],
        })
        .refine((data) => data.currentPassword !== data.newPassword, {
          message: t("user.changePassword.sameAsOld"),
          path: ["newPassword"],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword") || "";

  // Password strength meter
  const passwordChecks = useMemo(() => {
    return [
      {
        id: "len",
        label: t("auth.passwordRuleLength", "Tối thiểu 8 ký tự"),
        valid: newPasswordValue.length >= 8,
      },
      {
        id: "upper",
        label: t("auth.passwordRuleUpper", "Ít nhất 1 chữ hoa (A-Z)"),
        valid: /[A-Z]/.test(newPasswordValue),
      },
      {
        id: "lower",
        label: t("auth.passwordRuleLower", "Ít nhất 1 chữ thường (a-z)"),
        valid: /[a-z]/.test(newPasswordValue),
      },
      {
        id: "number",
        label: t("auth.passwordRuleNumber", "Ít nhất 1 chữ số (0-9)"),
        valid: /\d/.test(newPasswordValue),
      },
    ];
  }, [newPasswordValue, t]);

  const strengthScore = useMemo(() => {
    return passwordChecks.filter((c) => c.valid).length;
  }, [passwordChecks]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 1) return "bg-rose-500";
    if (strengthScore === 2) return "bg-amber-500";
    if (strengthScore === 3) return "bg-blue-500";
    return "bg-emerald-500";
  }, [strengthScore]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      );
      toast.success(t("user.changePassword.success"));
      reset();
      onOpenChange(false);

      // Chuyển hướng đăng nhập sau 1.5s
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (error) {
      toast.error(error.message || t("user.changePassword.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-[28px] border border-black/[0.08] bg-white shadow-2xl">
        {/* Subtle Editorial Header Banner */}
        <div className="bg-[#FAF9F5] border-b border-black/[0.05] p-6 pb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-sm shrink-0">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-950 tracking-tight">
                {t("user.changePassword.title")}
              </DialogTitle>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {t("auth.securityCenter", "Trung tâm bảo mật")}
              </p>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed font-medium">
            {t("user.changePassword.description")}
          </DialogDescription>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="currentPassword"
              className="text-xs font-bold text-slate-800 flex items-center justify-between"
            >
              <span>{t("user.changePassword.currentPasswordLabel")}</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder={t(
                  "user.changePassword.currentPasswordPlaceholder"
                )}
                {...register("currentPassword")}
                className="w-full h-11 pl-3.5 pr-10 text-xs rounded-xl bg-slate-50 border border-black/[0.08] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none font-medium transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Toggle current password visibility"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="text-xs font-bold text-slate-800 flex items-center justify-between"
            >
              <span>{t("user.changePassword.newPasswordLabel")}</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder={t("user.changePassword.newPasswordPlaceholder")}
                {...register("newPassword")}
                className="w-full h-11 pl-3.5 pr-10 text-xs rounded-xl bg-slate-50 border border-black/[0.08] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none font-medium transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Toggle new password visibility"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.newPassword.message}
              </p>
            )}

            {/* Password Strength Checklist Indicator */}
            {newPasswordValue.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-black/[0.04] space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {t("auth.passwordStrength", "Độ mạnh:")}
                  </span>
                  <span className="font-bold text-slate-900 font-mono">
                    {strengthScore === 4
                      ? t("auth.strengthStrong", "Rất mạnh")
                      : strengthScore === 3
                      ? t("auth.strengthGood", "Khá tốt")
                      : strengthScore === 2
                      ? t("auth.strengthMedium", "Trung bình")
                      : t("auth.strengthWeak", "Yếu")}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        step <= strengthScore ? strengthColor : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                {/* Rules mini-grid */}
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`flex items-center gap-1.5 text-[10px] font-medium ${
                        check.valid ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {check.valid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-bold text-slate-800 flex items-center justify-between"
            >
              <span>{t("user.changePassword.confirmPasswordLabel")}</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t(
                  "user.changePassword.confirmPasswordPlaceholder"
                )}
                {...register("confirmPassword")}
                className="w-full h-11 pl-3.5 pr-10 text-xs rounded-xl bg-slate-50 border border-black/[0.08] focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 outline-none font-medium transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="h-10 px-5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              {t("user.changePassword.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || strengthScore < 3}
              className="h-10 px-6 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("user.changePassword.submitting")}</span>
                </>
              ) : (
                <>
                  <span>{t("user.changePassword.submit")}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordModal;
