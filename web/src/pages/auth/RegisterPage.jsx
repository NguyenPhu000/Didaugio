import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import User from "lucide-react/dist/esm/icons/user";
import AtSign from "lucide-react/dist/esm/icons/at-sign";
import Mail from "lucide-react/dist/esm/icons/mail";
import Lock from "lucide-react/dist/esm/icons/lock";
import Shield from "lucide-react/dist/esm/icons/shield";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Label,
} from "@/components/ui";
import { authService } from "@/apis/authService";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Ho ten phai co it nhat 2 ky tu")
      .max(100, "Ho ten qua dai"),
    email: z
      .string()
      .min(1, "Email khong duoc de trong")
      .email("Email khong hop le"),
    username: z
      .string()
      .min(3, "Username phai co it nhat 3 ky tu")
      .max(30, "Username toi da 30 ky tu")
      .regex(/^[a-zA-Z0-9_]+$/, "Username chi gom chu, so va dau gach duoi"),
    password: z
      .string()
      .min(6, "Mat khau phai co it nhat 6 ky tu")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mat khau phai co it nhat 1 chu hoa, 1 chu thuong va 1 so",
      ),
    confirmPassword: z.string().min(1, "Xac nhan mat khau khong duoc de trong"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mat khau xac nhan khong khop",
    path: ["confirmPassword"],
  });

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await authService.register({
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
      });

      if (response.success) {
        toast.success(
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
        );
        navigate(
          `/resend-verification?email=${encodeURIComponent(data.email)}&from=register`,
        );
      }
    } catch (error) {
      toast.error(error.message || "Dang ky that bai");
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

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-dots opacity-20"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
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
                  REGISTRATION
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black text-white uppercase leading-tight mb-4">
                JOIN THE
                <br />
                SYSTEM
                <br />
                TODAY
              </h1>
              <div className="w-24 h-1 bg-[#F3E600]"></div>
            </div>

            <p className="text-gray-400 font-mono text-sm uppercase leading-relaxed max-w-md">
              TẠO TÀI KHOẢN MỚI ĐỂ TRẢI NGHIỆM
              <br />
              HỆ THỐNG QUẢN LÝ THÔNG MINH
            </p>

            {/* Benefits */}
            <div className="space-y-3 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 bg-[#F3E600]"></div>
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  FULL ACCESS TO MANAGEMENT TOOLS
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 bg-[#F3E600]"></div>
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  SECURE & ENCRYPTED DATA
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <div className="w-2 h-2 bg-[#F3E600]"></div>
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  24/7 SYSTEM SUPPORT
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600 uppercase font-mono">
            © 2026 CAN THO SMART TOURISM
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative overflow-y-auto">
        <div className="w-full max-w-md relative z-10 py-8">
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
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-8 bg-[#F3E600]"></div>
                <h1 className="text-3xl font-black uppercase tracking-tight">
                  SIGN UP
                </h1>
              </div>
              <p className="text-xs text-gray-500 uppercase font-mono ml-4">
                TẠO TÀI KHOẢN MỚI
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="tim-meta flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  FULL NAME
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="NGUYEN VAN A"
                  className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="tim-meta flex items-center gap-2"
                >
                  <AtSign className="h-4 w-4" />
                  USERNAME
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="USERNAME_01"
                  className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="tim-meta flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  EMAIL ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="YOUR@EMAIL.COM"
                  className="rounded-none border-2 border-black h-11 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="tim-meta flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0 pr-12"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 uppercase font-mono">
                  MIN 6 CHARS, UPPERCASE, LOWERCASE & NUMBER
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="tim-meta flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  CONFIRM PASSWORD
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="rounded-none border-2 border-black h-11 font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0 pr-12"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-mono uppercase">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isLoading}
                className="w-full rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-12 uppercase font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none mt-6"
              >
                {isLoading ? (
                  "CREATING ACCOUNT..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    CREATE ACCOUNT
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
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

            {/* Login Link */}
            <div className="text-center">
              <p className="text-xs text-gray-600 uppercase font-mono mb-2">
                ALREADY HAVE AN ACCOUNT?
              </p>
              <Link
                to="/auth/login"
                className="w-full rounded-none border-2 border-black bg-white text-black hover:bg-gray-100 h-11 px-6 uppercase font-black text-sm transition-all flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                BACK TO LOGIN
              </Link>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 uppercase font-mono">
              BY REGISTERING, YOU AGREE TO OUR TERMS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
