import { Building2, User, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  primaryButton,
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
        // DEBUG: xác nhận roleId nhận được từ Google login
        console.log("[Google Login] user.roleId:", user?.roleId, "| role:", user?.role?.name);
        setAuth(user, response.data.accessToken, response.data.refreshToken);
        toast.success(t("auth.login.googleSuccess"));

        const dashboardUrl = resolvePostLoginRoute(user);
        console.log("[Google Login] dashboardUrl:", dashboardUrl);
        navigate(
          dashboardUrl === AUTH_ROUTES.LOGIN
            ? BUSINESS_ROUTES.REGISTER
            : dashboardUrl,
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
      const response = await authService.login(data.identifier, data.password, {
        rememberMe,
      });
      if (response.success) {
        const dashboardUrl = resolvePostLoginRoute(response.data.user);

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({ identifier: data.identifier }));
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        // Trigger browser's "Save password?" dialog via Web Credentials API
        if ("credentials" in navigator && navigator.credentials.create) {
          try {
            const credential = await navigator.credentials.create({
              password: {
                id: data.identifier,
                password: data.password,
                name: data.identifier,
              },
            });
            if (credential) {
              await navigator.credentials.store(credential);
            }
          } catch {
            // Browser doesn't support or user denied
          }
        }

        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        toast.success(t("auth.login.success"));
        navigate(
          dashboardUrl === AUTH_ROUTES.LOGIN
            ? BUSINESS_ROUTES.REGISTER
            : dashboardUrl,
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
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
          {t("auth.login.title")}
        </h1>
        <p className="mt-2 text-[15px] text-slate-500">
          {t("auth.login.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email / Tên đăng nhập */}
        <div className="space-y-2">
          <label htmlFor="login-identifier" className={fieldLabel}>
            {t("auth.login.emailOrUsername")}
          </label>
          <Input
            id="login-identifier"
            type="text"
            name="identifier"
            placeholder={t("auth.login.emailOrUsernamePlaceholder")}
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className={fieldInput}
            {...register("identifier")}
          />
          {errors.identifier && (
            <p className={fieldError}>{errors.identifier.message}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="space-y-2">
          <label htmlFor="login-password" className={fieldLabel}>
            {t("auth.login.password")}
          </label>
          <Input
            id="login-password"
            type="password"
            name="password"
            placeholder={t("auth.login.passwordPlaceholder")}
            autoComplete="current-password"
            className={fieldInput}
            {...register("password")}
          />
          {errors.password && (
            <p className={fieldError}>{errors.password.message}</p>
          )}
        </div>

        {/* Ghi nhớ & Quên mật khẩu */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-[#F3E600]"
            />
            <span className="text-sm text-slate-600">
              {t("auth.login.rememberMe")}
            </span>
          </label>
          <Link
            to="/auth/forgot-password"
            className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        {/* Nút đăng nhập */}
        <Button type="submit" loading={isLoading} className={primaryButton}>
          {isLoading ? (
            t("auth.login.submitting")
          ) : (
            <>
              {t("auth.login.submit")}
              <ArrowRight className="ml-1 h-4 w-4" />
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

          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error(t("auth.login.googleFailed"))}
            disabled={isLoading}
          />
        </>
      )}

      {/* Đăng ký doanh nghiệp */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-center">
        <p className="mb-3 text-sm text-slate-600">
          {t("auth.login.noAccount")}
        </p>
        <Link
          to="/auth/register"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          <Building2 className="h-4 w-4" />
          {t("auth.login.registerBusiness")}
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        {t("auth.login.secureNote")}
      </p>
    </AuthShell>
  );
};

export default LoginPage;
