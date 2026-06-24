import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import User from "lucide-react/dist/esm/icons/user";
import Lock from "lucide-react/dist/esm/icons/lock";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Shield from "lucide-react/dist/esm/icons/shield";
import Activity from "lucide-react/dist/esm/icons/activity";
import BriefcaseBusiness from "lucide-react/dist/esm/icons/briefcase-business";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis/authService";
import { loginSchema } from "@/schemas/auth";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { resolvePostLoginRoute } from "@/utils/authRouting";
import { AUTH_ROUTES } from "@/constants/routes";

const HAS_GOOGLE_OAUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REMEMBER_KEY = "ddg_remember_login";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
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
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      // GoogleLogin default flow returns { credential: "<id_token>" }
      const idToken = credentialResponse.credential;
      if (!idToken) {
        toast.error(t("auth.login.googleNoToken"));
        return;
      }
      const response = await authService.googleLogin(idToken);
      if (response.success) {
        const dashboardUrl = resolvePostLoginRoute(response.data.user);
        if (dashboardUrl === AUTH_ROUTES.LOGIN) {
          logout();
          toast.error(t("auth.login.noPermission"));
          return;
        }

        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        toast.success(t("auth.login.googleSuccess"));
        navigate(dashboardUrl, { replace: true });
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
        if (dashboardUrl === AUTH_ROUTES.LOGIN) {
          logout();
          toast.error(t("auth.login.noPermission"));
          return;
        }

        // Save identifier to localStorage for "Remember me"
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
        navigate(dashboardUrl, { replace: true });
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

      toast.error(error.message || t("auth.login.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden page-enter">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-10 pointer-events-none"></div>

      {/* Left Side - Tactical Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        {/* Accent Bars */}
        <div className="absolute top-0 left-0 w-2 h-full bg-[#F3E600]"></div>
        <div className="absolute top-0 right-0 w-2 h-full bg-[#F3E600]"></div>

        {/* Grid overlay on black background */}
        <div className="absolute inset-0 bg-grid-dots opacity-20"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo/Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 border-2 border-[#F3E600] flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#F3E600]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  DIDAUGIO
                </h2>
                <p className="text-[#F3E600] text-xs font-mono uppercase tracking-wider">
                  {t("auth.login.adminSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black text-white uppercase leading-tight mb-4">
                {t("auth.login.heroTitle1")}
                <br />
                {t("auth.login.heroTitle2")}
                <br />
                {t("auth.login.heroTitle3")}
              </h1>
              <div className="w-24 h-1 bg-[#F3E600]"></div>
            </div>

            <p className="text-gray-400 font-mono text-sm uppercase leading-relaxed max-w-md">
              {t("auth.login.heroDesc1")}
              <br />
              {t("auth.login.heroDesc2")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">24/7</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  {t("auth.login.statActive")}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">256</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  {t("auth.login.statEncryption")}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">100%</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  {t("auth.login.statSecure")}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600 uppercase font-mono">
            © 2026 CAN THO SMART TOURISM
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">DIDAUGIO</h2>
              <p className="text-[#F3E600] text-xs font-mono uppercase">
                {t("auth.login.mobileSubtitle")}
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-[#F3E600]"></div>
                <h1 className="text-3xl font-black uppercase tracking-tight">
                  {t("auth.login.title")}
                </h1>
              </div>
              <p className="text-xs text-gray-500 uppercase font-mono ml-4">
                {t("auth.login.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email/Username Input */}
              <div className="space-y-2">
                <label htmlFor="login-identifier" className="tim-meta flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("auth.login.emailOrUsername")}
                </label>
                <div className="relative">
                  <Input
                    id="login-identifier"
                    type="text"
                    name="identifier"
                    placeholder={t("auth.login.emailOrUsernamePlaceholder")}
                    autoComplete="username"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="rounded-none border-2 border-black h-12 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0 pl-4"
                    {...register("identifier")}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="login-password" className="tim-meta flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("auth.login.password")}
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type="password"
                    name="password"
                    placeholder={t("auth.login.passwordPlaceholder")}
                    autoComplete="current-password"
                    className="rounded-none border-2 border-black h-12 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0 pl-4"
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-none border-2 border-black accent-[#F3E600] cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 uppercase font-mono">
                    {t("auth.login.rememberMe")}
                  </span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-gray-600 hover:text-black uppercase font-mono underline"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                loading={isLoading}
                className="w-full rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-12 uppercase font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
              >
                {isLoading ? (
                  t("auth.login.submitting")
                ) : (
                  <>
                    {t("auth.login.submit")} <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {HAS_GOOGLE_OAUTH && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-black border-dashed"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-500 font-mono">
                      {t("common.or")}
                    </span>
                  </div>
                </div>

                <GoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error(t("auth.login.googleFailed"))}
                  disabled={isLoading}
                />

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                </div>
              </>
            )}

            {/* Business Register Link */}
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-mono mb-2">
                {t("auth.login.noAccount")}
              </p>
              <Link
                to="/auth/register"
                className="w-full rounded-none border-2 border-black bg-white text-black hover:bg-gray-100 h-12 px-6 uppercase font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                {t("auth.login.registerBusiness")}
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 uppercase font-mono">
              {t("auth.login.secureNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
