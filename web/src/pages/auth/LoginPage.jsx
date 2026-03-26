import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Mail from "lucide-react/dist/esm/icons/mail";
import Lock from "lucide-react/dist/esm/icons/lock";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Shield from "lucide-react/dist/esm/icons/shield";
import Activity from "lucide-react/dist/esm/icons/activity";
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
import { ROLES } from "@/constants";
import { ADMIN_ROUTES, BUSINESS_ROUTES } from "@/constants/routes";
import { authService } from "@/apis/authService";
import { loginSchema } from "@/schemas/auth";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

const HAS_GOOGLE_OAUTH = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleSuccess = async (codeResponse) => {
    setIsLoading(true);
    try {
      const response = await authService.googleLogin(
        codeResponse.code,
        window.location.origin,
      );
      if (response.success) {
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        toast.success("Đăng nhập Google thành công!");
        const dashboardUrl =
          response.data.user?.roleId === ROLES.BUSINESS
            ? BUSINESS_ROUTES.DASHBOARD
            : ADMIN_ROUTES.DASHBOARD;
        navigate(dashboardUrl);
      }
    } catch (error) {
      toast.error(error.message || "Đăng nhập Google thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data.email, data.password);
      if (response.success) {
        // Lưu user, accessToken và refreshToken
        setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken,
        );
        toast.success("Đăng nhập thành công!");
        const dashboardUrl =
          response.data.user?.roleId === ROLES.BUSINESS
            ? BUSINESS_ROUTES.DASHBOARD
            : ADMIN_ROUTES.DASHBOARD;
        navigate(dashboardUrl);
      }
    } catch (error) {
      if (error?.errorCode === "EMAIL_NOT_VERIFIED") {
        toast.error(
          "Email chưa xác thực. Vui lòng kiểm tra email hoặc gửi lại link xác thực.",
        );
        navigate(
          `/resend-verification?email=${encodeURIComponent(data.email)}`,
        );
        return;
      }

      toast.error(error.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
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
                  SYSTEM ACCESS
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black text-white uppercase leading-tight mb-4">
                SECURE
                <br />
                ACCESS
                <br />
                CONTROL
              </h1>
              <div className="w-24 h-1 bg-[#F3E600]"></div>
            </div>

            <p className="text-gray-400 font-mono text-sm uppercase leading-relaxed max-w-md">
              Hệ THỐNG QUẢN LÝ THÔNG MINH
              <br />
              DU LỊCH CẦN THƠ // AUTHENTICATION MODULE
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md">
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">24/7</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  UPTIME
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">256</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  ENCRYPTED
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-2xl font-black text-[#F3E600]">100%</div>
                <div className="text-[10px] text-gray-500 uppercase font-mono">
                  SECURE
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
                SYSTEM
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
                  LOGIN
                </h1>
              </div>
              <p className="text-xs text-gray-500 uppercase font-mono ml-4">
                ĐĂNG NHẬP VÀO HỆ THỐNG
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="tim-meta flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    autoComplete="username"
                    className="rounded-none border-2 border-black h-12 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0 pl-4"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="tim-meta flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  PASSWORD
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
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

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-gray-600 hover:text-black uppercase font-mono underline"
                >
                  FORGOT PASSWORD?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                loading={isLoading}
                className="w-full rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-12 uppercase font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
              >
                {isLoading ? (
                  "AUTHENTICATING..."
                ) : (
                  <>
                    ACCESS SYSTEM <ArrowRight className="ml-2 h-4 w-4" />
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
                      OR
                    </span>
                  </div>
                </div>

                <GoogleLoginButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Đăng nhập Google thất bại")}
                  disabled={isLoading}
                />

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                </div>
              </>
            )}

            {/* Register Link */}
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-mono mb-2">
                DON'T HAVE AN ACCOUNT?
              </p>
              <Link
                to="/auth/register"
                className="inline-block w-full rounded-none border-2 border-black bg-white text-black hover:bg-gray-100 h-12 px-6 uppercase font-black text-sm transition-all flex items-center justify-center"
              >
                CREATE NEW ACCOUNT
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 uppercase font-mono">
              PROTECTED BY ADVANCED SECURITY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
