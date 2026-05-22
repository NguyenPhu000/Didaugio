import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
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
import { authService } from "@/apis";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
      ),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const ResetPasswordPage = () => {
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
      setTokenError("Token không hợp lệ hoặc đã hết hạn");
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Token không hợp lệ");
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
      toast.success("Đặt lại mật khẩu thành công!");

      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (error) {
      toast.error(error.message || "Đặt lại mật khẩu thất bại");
      if (error.message.includes("token")) {
        setTokenError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 1, label: "Yếu", color: "bg-red-500" },
      { strength: 2, label: "Trung bình", color: "bg-yellow-500" },
      { strength: 3, label: "Tốt", color: "bg-blue-500" },
      { strength: 4, label: "Mạnh", color: "bg-green-500" },
      { strength: 5, label: "Rất mạnh", color: "bg-green-600" },
    ];

    return levels.find((l) => l.strength === strength) || levels[0];
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (tokenError && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Token không hợp lệ</h2>
              <p className="text-gray-600">
                {tokenError ||
                  "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."}
              </p>
              <Button asChild className="w-full">
                <Link to="/auth/forgot-password">Gửi lại yêu cầu</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Thành công!</h2>
              <p className="text-gray-600">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển
                hướng đến trang đăng nhập...
              </p>
              <Button asChild className="w-full">
                <Link to="/auth/login">Đăng nhập ngay</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
            <CardDescription>
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    autoFocus
                    autoComplete="new-password"
                    {...register("newPassword")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}

                {/* Password Strength */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      Độ mạnh:{" "}
                      <span className="font-medium">
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                <Lock className="mr-2 h-4 w-4" />
                Đặt lại mật khẩu
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="text-sm text-primary hover:underline"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
