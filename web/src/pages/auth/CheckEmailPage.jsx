import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, Loader2, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis";
import { BUSINESS_ROUTES } from "@/constants/routes";
import OtpInput from "@/components/auth/OtpInput";
import AuthShell from "@/components/auth/AuthShell";
import { primaryButton, secondaryButton } from "@/components/auth/authStyles";

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
      setOtpError("Vui lòng nhập email để xác thực.");
      return;
    }
    if (otp.length !== 6) {
      setOtpError("Vui lòng nhập đủ 6 số OTP trong email.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await authService.verifyEmailOtp({ email, otp, context: "business" });
      const payload = res.data || res;
      if (payload?.accessToken && payload?.user) {
        toast.success("Xác thực email thành công! Đang chuyển sang thủ tục đăng ký...");
        useAuthStore.getState().setSession({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });
        navigate(BUSINESS_ROUTES.REGISTER, { replace: true });
        return;
      }
      toast.success("Xác thực email thành công. Vui lòng đăng nhập.");
      logout();
      navigate("/login", { replace: true, state: { identifier: email } });
    } catch (error) {
      setOtpError(error.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell
      eyebrow="Xác thực tài khoản"
      title="Chỉ còn một bước để hoàn tất đăng ký"
      subtitle="Kiểm tra hộp thư của bạn và nhập mã OTP để kích hoạt tài khoản doanh nghiệp."
    >
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
          <Mail className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Kiểm tra email của bạn
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Chúng tôi đã gửi email xác thực đến
        </p>
        <p className="mt-2 inline-block rounded-xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900">
          {email || t("auth.resendVerification.enterValidEmail")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Xác thực nhanh bằng mã OTP
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
            <p className="mt-3 text-xs font-medium text-rose-600">{otpError}</p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Mã OTP gồm 6 số, có hiệu lực trong 10 phút.
            </p>
          )}
          <Button
            onClick={handleVerifyOtp}
            disabled={isVerifying || !email}
            className={`mt-4 ${primaryButton}`}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1 h-4 w-4" />
                Xác thực OTP
              </>
            )}
          </Button>
        </div>

        {resent ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Đã gửi lại email!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className={secondaryButton}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Gửi lại email xác thực
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Đăng nhập với tài khoản khác
        </button>

        {!email && (
          <Link
            to="/resend-verification"
            className="block text-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Nhập email để gửi lại xác thực
          </Link>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Sau khi xác thực email, bạn có thể đăng ký doanh nghiệp.
      </p>
    </AuthShell>
  );
};

export default CheckEmailPage;
