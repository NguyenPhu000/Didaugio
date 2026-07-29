import { Eye, EyeOff, ArrowLeft, User, AtSign, Mail, Lock, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  primaryButton,
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
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        toast.success(t("auth.register.googleSuccess"));
        // Google is already email-verified, then the business onboarding handles role/profile unlock.
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
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

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

        // Trigger browser's "Save password?" dialog
        if ("credentials" in navigator && navigator.credentials.create) {
          try {
            const credential = await navigator.credentials.create({
              password: {
                id: data.email,
                password: data.password,
                name: data.username || data.email,
              },
            });
            if (credential) {
              await navigator.credentials.store(credential);
            }
          } catch {
            // Browser doesn't support or user denied
          }
        }

        if (emailVerificationRequired) {
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
          navigate(`/check-email?email=${encodeURIComponent(data.email.toLowerCase())}`, {
            replace: true,
          });
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
      eyebrow="Dành cho đối tác doanh nghiệp"
      title="Đưa doanh nghiệp du lịch của bạn lên bản đồ"
      subtitle="Tạo tài khoản để quản lý địa điểm, tour và tiếp cận du khách trên toàn khu vực."
    >
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t("auth.register.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("auth.register.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Họ và tên */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className={fieldLabel}>
            <User className="h-4 w-4 text-slate-400" />
            {t("auth.register.fullName")}
          </Label>
          <Input
            id="fullName"
            type="text"
            name="fullName"
            placeholder={t("auth.register.fullNamePlaceholder")}
            className={fieldInput}
            autoComplete="name"
            autoCapitalize="off"
            autoCorrect="off"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className={fieldError}>{errors.fullName.message}</p>
          )}
        </div>

        {/* Tên đăng nhập */}
        <div className="space-y-2">
          <Label htmlFor="username" className={fieldLabel}>
            <AtSign className="h-4 w-4 text-slate-400" />
            {t("auth.register.username")}
          </Label>
          <Input
            id="username"
            type="text"
            name="username"
            placeholder={t("auth.register.usernamePlaceholder")}
            className={fieldInput}
            autoComplete="username"
            autoCapitalize="off"
            autoCorrect="off"
            {...register("username")}
          />
          {errors.username && (
            <p className={fieldError}>{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className={fieldLabel}>
            <Mail className="h-4 w-4 text-slate-400" />
            {t("auth.register.email")}
          </Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder={t("auth.register.emailPlaceholder")}
            className={fieldInput}
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            {...register("email")}
          />
          {errors.email && (
            <p className={fieldError}>{errors.email.message}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="space-y-2">
          <Label htmlFor="password" className={fieldLabel}>
            <Lock className="h-4 w-4 text-slate-400" />
            {t("auth.register.password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${fieldInput} pr-12`}
              {...register("password")}
            />
            <button
              type="button"
              className={eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className={fieldError}>{errors.password.message}</p>
          )}
          <p className="text-xs text-slate-400">
            {t("auth.register.passwordHint")}
          </p>
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={fieldLabel}>
            <Lock className="h-4 w-4 text-slate-400" />
            {t("auth.register.confirmPassword")}
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              className={`${fieldInput} pr-12`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className={eyeButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

        {/* Nút đăng ký */}
        <Button
          type="submit"
          loading={isLoading}
          className={`${primaryButton} mt-2`}
        >
          {isLoading ? (
            t("auth.register.submitting")
          ) : (
            <>
              <UserPlus className="mr-1 h-4 w-4" />
              {t("auth.register.submit")}
            </>
          )}
        </Button>
      </form>

      {HAS_GOOGLE_OAUTH && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs font-medium uppercase tracking-wide text-slate-400">
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

      {/* Đăng nhập */}
      <div className="mt-4 text-center">
        <p className="mb-3 text-sm text-slate-600">
          {t("auth.register.hasAccount")}
        </p>
        <Link
          to="/auth/login"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.register.loginNow")}
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        {t("auth.register.termsNote")}
      </p>
    </AuthShell>
  );
};

export default RegisterPage;
