import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, Loader2, ShieldCheck, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
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
        useAuthStore.getState().setSession({ user: payload.user, accessToken: payload.accessToken });
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
      title="Chỉ còn một bước để hoàn tất đăng ký."
      subtitle="Kiểm tra hộp thư và nhập mã OTP để kích hoạt tài khoản doanh nghiệp."
      maxWidth="max-w-[420px]"
    >
      {/* ── Main card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
        <div className="px-8 py-8 sm:px-10">
          {/* Header — centered */}
          <div className="mb-8 text-center">
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E600]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
            >
              <Mail className="h-8 w-8 text-slate-800" strokeWidth={1.75} />
            </motion.div>

            <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
              Kiểm tra email của bạn
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Chúng tôi đã gửi mã xác thực đến
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="text-sm font-semibold text-slate-800">
                {email || t("auth.resendVerification.enterValidEmail")}
              </span>
            </div>
          </div>

          {/* OTP section */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-700" strokeWidth={2} />
                <span className="text-sm font-semibold text-slate-900">
                  Nhập mã xác thực OTP
                </span>
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

              <AnimatePresence mode="wait">
                {otpError ? (
                  <motion.p
                    key="error"
                    className="mt-3 text-xs font-medium text-rose-600"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {otpError}
                  </motion.p>
                ) : (
                  <motion.p
                    key="hint"
                    className="mt-3 text-xs text-slate-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Mã OTP gồm 6 số, có hiệu lực trong 10 phút.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Verify CTA */}
            <Button
              onClick={handleVerifyOtp}
              disabled={isVerifying || !email}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#F3E600] text-[15px] font-bold text-slate-900 shadow-[0_4px_14px_rgba(243,230,0,0.45)] transition-all duration-300 hover:bg-[#e8d900] hover:shadow-[0_6px_22px_rgba(243,230,0,0.55)] active:scale-[0.99] disabled:opacity-60"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Xác thực tài khoản
                </>
              )}
            </Button>

            {/* Resend */}
            <AnimatePresence mode="wait">
              {resent ? (
                <motion.div
                  key="resent"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-medium text-emerald-800"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Đã gửi lại email xác thực!
                </motion.div>
              ) : (
                <motion.button
                  key="resend-btn"
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || !email}
                  className={secondaryButton}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Gửi lại email xác thực
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Switch account */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng nhập với tài khoản khác
            </button>

            {!email && (
              <Link
                to="/resend-verification"
                className="block text-center text-sm font-medium text-slate-600 underline underline-offset-4 decoration-emerald-600/70 decoration-2 hover:decoration-slate-400 transition-colors"
              >
                Nhập email để gửi lại xác thực
              </Link>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] tracking-wide text-slate-400">
        Sau khi xác thực email, bạn có thể hoàn tất đăng ký doanh nghiệp.
      </p>
    </AuthShell>
  );
};

export default CheckEmailPage;
