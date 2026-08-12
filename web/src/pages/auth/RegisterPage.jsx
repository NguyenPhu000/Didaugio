import { Eye, EyeOff, ArrowLeft, User, AtSign, Mail, Lock, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import i18n from "@/i18n";
import { Button, Input, Label } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis/authService";
import GoogleSignUpButton from "@/components/auth/GoogleSignUpButton";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
  eyeButton,
} from "@/components/auth/authStyles";
import { BUSINESS_ROUTES } from "@/constants/routes";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, i18n.t("validation.fullNameMin", { min: 2 }))
      .max(100, i18n.t("validation.fullNameMax")),
    email: z
      .string()
      .min(1, i18n.t("validation.emailRequired"))
      .email(i18n.t("validation.emailInvalid")),
    username: z
      .string()
      .min(3, i18n.t("validation.usernameMin", { min: 3 }))
      .max(30, i18n.t("validation.usernameMax", { max: 30 }))
      .regex(/^[a-zA-Z0-9_]+$/, i18n.t("validation.usernamePattern")),
    password: z
      .string()
      .min(8, i18n.t("validation.passwordMin", { min: 8 }))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-])/,
        i18n.t("validation.passwordPattern"),
      ),
    confirmPassword: z.string().min(1, i18n.t("validation.confirmPasswordRequired")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("validation.passwordMismatch"),
    path: ["confirmPassword"],
  });

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const HAS_GOOGLE_OAUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    document.title = t("auth.register.pageTitle");
  }, [t]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true);
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        toast.error(t("auth.register.googleNoToken"));
        return;
      }
      const response = await authService.googleRegister(idToken);
      if (response.success) {
        setAuth(response.data.user, response.data.accessToken);
        toast.success(t("auth.register.googleSuccess"));
        navigate(BUSINESS_ROUTES.REGISTER, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || t("auth.register.googleFailed"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.registerBusiness({
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
      });

      if (response.success) {
        const { emailVerificationRequired } = response.data;

        if ("credentials" in navigator && navigator.credentials.create) {
          try {
            const credential = await navigator.credentials.create({
              password: { id: data.email, password: data.password, name: data.username || data.email },
            });
            if (credential) await navigator.credentials.store(credential);
          } catch {
            // Browser doesn't support or user denied
          }
        }

        if (emailVerificationRequired) {
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
          navigate(`/check-email?email=${encodeURIComponent(data.email.toLowerCase())}`, { replace: true });
          return;
        }

        toast.success("Đăng ký thành công! Vui lòng đăng ký doanh nghiệp.");
        navigate(BUSINESS_ROUTES.REGISTER, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || t("auth.register.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đưa doanh nghiệp du lịch của bạn lên bản đồ"
      subtitle="Tạo tài khoản để quản lý địa điểm, tour và tiếp cận du khách trên toàn khu vực."
      maxWidth="max-w-[480px]"
    >
      {/* ── Main card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
        {/* Yellow top stripe */}
        <div className="h-[3px] w-full bg-[#F3E600]" />

        <div className="px-8 py-8 sm:px-10">
          {/* Header */}
          <div className="mb-7">
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
              {t("auth.register.title")}
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-500">
              {t("auth.register.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Họ tên + Username */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className={fieldLabel}>
                  Họ và tên
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder={t("auth.register.fullNamePlaceholder")}
                    className={`${fieldInput} pl-9 text-sm`}
                    autoComplete="name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className={fieldError}>{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className={fieldLabel}>
                  Tên đăng nhập
                </Label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    placeholder={t("auth.register.usernamePlaceholder")}
                    className={`${fieldInput} pl-9 text-sm`}
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className={fieldError}>{errors.username.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className={fieldLabel}>
                {t("auth.register.email")}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder={t("auth.register.emailPlaceholder")}
                  className={`${fieldInput} pl-10`}
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className={fieldError}>{errors.email.message}</p>
              )}
            </div>

            {/* Mật khẩu + Xác nhận — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className={fieldLabel}>
                  {t("auth.register.password")}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${fieldInput} pl-9 pr-10 text-sm`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className={eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className={fieldError}>{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className={fieldLabel}>
                  Xác nhận
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`${fieldInput} pl-9 pr-10 text-sm`}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className={eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className={fieldError}>{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Password hint */}
            <p className="text-[12px] leading-relaxed text-slate-400">
              {t("auth.register.passwordHint")}
            </p>

            {/* Submit */}
            <Button
              type="submit"
              loading={isLoading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#F3E600] text-[15px] font-bold text-slate-900 shadow-[0_4px_14px_rgba(243,230,0,0.45)] transition-all duration-300 hover:bg-[#e8d900] hover:shadow-[0_6px_22px_rgba(243,230,0,0.55)] active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                t("auth.register.submitting")
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {t("auth.register.submit")}
                </>
              )}
            </Button>
          </form>

          {HAS_GOOGLE_OAUTH && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-300">
                    {t("common.or")}
                  </span>
                </div>
              </div>
              <GoogleSignUpButton
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t("auth.register.googleFailed"))}
                disabled={isGoogleLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Back to login ── */}
      <motion.div
        className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/70 px-5 py-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-[14px] text-slate-600">{t("auth.register.hasAccount")}</p>
        <Link
          to="/auth/login"
          className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("auth.register.loginNow")}
        </Link>
      </motion.div>

      <p className="mt-4 text-center text-[11px] tracking-wide text-slate-400">
        {t("auth.register.termsNote")}
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
