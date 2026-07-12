import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis";
import OtpInput from "@/components/auth/OtpInput";

const CheckEmailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null);

  const queryEmail = searchParams.get("email") || "";
  const email = user?.email || queryEmail;

  const handleResend = async () => {
    setIsResending(true);
    try {
      if (isAuthenticated) {
        await authService.resendVerification();
      } else {
        await authService.resendVerificationPublic(email);
      }
      setResent(true);
      toast.success("Đã gửi lại email xác thực!");
    } catch (error) {
      toast.error(error.message || "Không thể gửi lại email");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    if (!email) {
      setOtpError("Vui long nhap email de xac thuc.");
      return;
    }
    if (otp.length !== 6) {
      setOtpError("Nhap du 6 so OTP trong email.");
      return;
    }

    setIsVerifying(true);
    try {
      await authService.verifyEmailOtp({ email, otp });
      toast.success("Xac thuc email thanh cong. Vui long dang nhap.");
      logout();
      navigate("/login", { replace: true, state: { identifier: email } });
    } catch (error) {
      setOtpError(error.message || "Ma OTP khong hop le hoac da het han.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Kiểm tra email của bạn
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              Chúng tôi đã gửi email xác thực đến:
            </p>
            <p className="font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
              {email || t("auth.resendVerification.enterValidEmail")}
            </p>
            <p className="text-sm text-gray-500">
              Vui lòng kiểm tra hộp thư (và thư mục spam) để xác thực tài khoản.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Xac thuc nhanh bang OTP
              </div>
              <OtpInput
                value={otp}
                onChange={(nextOtp) => {
                  setOtp(nextOtp);
                  if (otpError) setOtpError(null);
                }}
                disabled={isVerifying}
                error={Boolean(otpError)}
              />
              {otpError ? (
                <p className="mt-2 text-xs font-medium text-red-600">{otpError}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Ma OTP gom 6 so, co hieu luc trong 10 phut.
                </p>
              )}
              <Button
                onClick={handleVerifyOtp}
                disabled={isVerifying || !email}
                className="mt-4 w-full bg-slate-950 hover:bg-slate-800"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dang xac thuc...
                  </>
                ) : (
                  "Xac thuc OTP"
                )}
              </Button>
            </div>

            {resent ? (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Đã gửi lại email!</span>
              </div>
            ) : (
              <Button
                onClick={handleResend}
                disabled={isResending || !email}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Gửi lại email xác thực
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Đăng nhập với tài khoản khác
            </Button>

            {!email && (
              <Link
                to="/resend-verification"
                className="block text-center text-sm font-medium text-blue-600 hover:underline"
              >
                Nhập email để gửi lại xác thực
              </Link>
            )}
          </div>

          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-500">
              Sau khi xác thực email, bạn có thể đăng ký doanh nghiệp.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckEmailPage;
