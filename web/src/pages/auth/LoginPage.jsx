import { Building2, User, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis/authService";
import { loginSchema } from "@/schemas/auth";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
} from "@/components/auth/authStyles";
import { resolvePostLoginRoute } from "@/utils/authRouting";
import { AUTH_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";

const HAS_GOOGLE_OAUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REMEMBER_KEY = "ddg_remember_login";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const savedLogin = (() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: savedLogin?.identifier || "",
    },
  });

  const [rememberMe, setRememberMe] = useState(!!savedLogin?.identifier);

  useEffect(() => {
    document.title = t("auth.login.pageTitle");
  }, [t]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        toast.error(t("auth.login.googleNoToken"));
        return;
      }
      const response = await authService.googleLogin(idToken);
      if (response.success) {
        const user = response.data.user;
        console.log("[Google Login] user.roleId:", user?.roleId, "| role:", user?.role?.name);
        setAuth(user, response.data.accessToken);
        toast.success(t("auth.login.googleSuccess"));
        const dashboardUrl = resolvePostLoginRoute(user);
        console.log("[Google Login] dashboardUrl:", dashboardUrl);
        navigate(
          dashboardUrl === AUTH_ROUTES.LOGIN ? BUSINESS_ROUTES.REGISTER : dashboardUrl,
          { replace: true },
        );
      }
    } catch (error) {
      toast.error(error.message || t("auth.login.googleFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data.identifier, data.password, { rememberMe });
      if (response.success) {
        const dashboardUrl = resolvePostLoginRoute(response.data.user);

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({ identifier: data.identifier }));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        // Trigger browser Save password dialog
        if ("credentials" in navigator && navigator.credentials.create) {
          try {
            const credential = await navigator.credentials.create({
              password: { id: data.identifier, password: data.password, name: data.identifier },
            });
            if (credential) await navigator.credentials.store(credential);
          } catch {
            // Browser doesn't support or user denied
          }
        }

        setAuth(response.data.user, response.data.accessToken);
        toast.success(t("auth.login.success"));
        navigate(
          dashboardUrl === AUTH_ROUTES.LOGIN ? BUSINESS_ROUTES.REGISTER : dashboardUrl,
          { replace: true },
        );
      }
    } catch (error) {
      if (error?.errorCode === "EMAIL_NOT_VERIFIED") {
        const normalizedIdentifier = String(data.identifier || "").trim();
        const isEmailIdentifier = /\S+@\S+\.\S+/.test(normalizedIdentifier);
        const query = isEmailIdentifier
          ? `?email=${encodeURIComponent(normalizedIdentifier.toLowerCase())}`
          : "";
        toast.error(t("auth.login.emailNotVerified"));
        navigate(`/resend-verification${query}`);
        return;
      }
      if (error?.errorCode === "ACCOUNT_INACTIVE") {
        toast.error(error.message || "Tài khoản chưa được kích hoạt. Vui lòng đăng nhập bằng Google để kích hoạt.");
        return;
      }
      toast.error(error.message || t("auth.login.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      {/* ── Main card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
        <div className="px-8 py-8 sm:px-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[30px] font-bold tracking-tight text-slate-900 leading-tight">
              {t("auth.login.title")}
            </h1>
            <p className="mt-1.5 text-[14px] text-slate-500 leading-relaxed">
              {t("auth.login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email / Username */}
            <div className="space-y-1.5">
              <label htmlFor="login-identifier" className={fieldLabel}>
                {t("auth.login.emailOrUsername")}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  placeholder={t("auth.login.emailOrUsernamePlaceholder")}
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={`${fieldInput} pl-10`}
                  {...register("identifier")}
                />
              </div>
              {errors.identifier && (
                <p className={fieldError}>{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className={fieldLabel}>
                  {t("auth.login.password")}
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[13px] font-medium text-slate-400 transition hover:text-slate-800 hover:underline underline-offset-4"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder={t("auth.login.passwordPlaceholder")}
                  autoComplete="current-password"
                  className={`${fieldInput} pl-10`}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className={fieldError}>{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer select-none items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-[#F3E600]"
              />
              <span className="text-sm text-slate-600">{t("auth.login.rememberMe")}</span>
            </label>

            {/* CTA */}
            <Button
              type="submit"
              loading={isLoading}
              className="mt-1 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#F3E600] text-[15px] font-bold text-slate-900 shadow-[0_4px_14px_rgba(243,230,0,0.45)] transition-all duration-300 hover:bg-[#e8d900] hover:shadow-[0_6px_22px_rgba(243,230,0,0.55)] active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                t("auth.login.submitting")
              ) : (
                <>
                  {t("auth.login.submit")}
                  <ArrowRight className="h-4 w-4" />
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

              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t("auth.login.googleFailed"))}
                disabled={isLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Register CTA card ── */}
      <motion.div
        className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-5 py-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {t("auth.login.noAccount")}
          </p>
          <p className="mt-0.5 text-[14px] font-semibold text-slate-900">
            {t("auth.login.registerBusiness")}
          </p>
        </div>
        <Link
          to="/auth/register"
          className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.97]"
        >
          <Building2 className="h-3.5 w-3.5" />
          {t("auth.register.submit")}
        </Link>
      </motion.div>
    </AuthShell>
  );
};

export default LoginPage;
