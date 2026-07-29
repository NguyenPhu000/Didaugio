import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { authService } from "@/apis";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";
import AuthShell from "@/components/auth/AuthShell";
import { primaryButton, secondaryButton } from "@/components/auth/authStyles";

const VerifyEmailPublicPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { user, setUser } = useAuthStore();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage(t("auth.verifyEmail.invalidToken"));
      return;
    }

    try {
      setStatus("verifying");
      const response = await authService.verifyEmail({ token });
      setStatus("success");
      setMessage(response.message || t("auth.verifyEmail.verifySuccess"));
      toast.success(t("auth.verifyEmail.verifySuccess"));

      // Cập nhật trạng thái emailVerified trong store
      if (user) {
        setUser({ ...user, emailVerified: true });
      }

      // Auto redirect sau 3 giây
      setTimeout(() => {
        if (user?.roleId === ROLES.BUSINESS) {
          // Đã login + là business → đi thẳng đăng ký doanh nghiệp
          navigate("/business/register", { replace: true });
        } else {
          navigate("/login", {
            state: { message: t("auth.verifyEmail.redirectMessage") },
          });
        }
      }, 3000);
    } catch (error) {
      setStatus("error");
      const errorMsg =
        error.response?.data?.message || error.message || t("auth.verifyEmail.verifyFailed");
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  }, [navigate, token, user, setUser, t]);

  useEffect(() => {
    const id = setTimeout(() => {
      verifyEmail();
    }, 0);
    return () => clearTimeout(id);
  }, [verifyEmail]);

  const statusBadge = {
    verifying: (
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
        <Loader2 className="h-8 w-8 animate-spin" />
      </span>
    ),
    success: (
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>
    ),
    error: (
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <XCircle className="h-8 w-8" />
      </span>
    ),
  };

  return (
    <AuthShell
      eyebrow="Xác thực email"
      title="Đang xác nhận địa chỉ email của bạn"
      subtitle="Chúng tôi đang kiểm tra liên kết xác thực để mở khóa tài khoản của bạn."
    >
      <div className="mb-6 text-center">
        {statusBadge[status]}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {status === "verifying" && t("auth.verifyEmail.verifying")}
          {status === "success" && t("auth.verifyEmail.success")}
          {status === "error" && t("auth.verifyEmail.failed")}
        </h1>
        {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
      </div>

      <div className="space-y-3">
        {status === "success" && (
          <>
            <Button onClick={() => navigate("/login")} className={primaryButton}>
              {t("auth.verifyEmail.goToLogin")}
            </Button>
            <p className="text-center text-sm text-slate-400">
              {t("auth.verifyEmail.autoRedirect")}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <Button onClick={verifyEmail} className={primaryButton}>
              {t("auth.verifyEmail.retry")}
            </Button>
            <button
              type="button"
              onClick={() => navigate("/resend-verification")}
              className={secondaryButton}
            >
              <Mail className="h-4 w-4" />
              {t("auth.verifyEmail.resendEmail")}
            </button>
            <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {t("auth.verifyEmail.commonErrors")}
              </p>
              <p>• {t("auth.verifyEmail.tokenExpired")}</p>
              <p>• {t("auth.verifyEmail.tokenInvalid")}</p>
              <p>• {t("auth.verifyEmail.emailAlreadyVerified")}</p>
            </div>
          </>
        )}

        {status === "verifying" && (
          <p className="text-center text-sm text-slate-400">
            {t("auth.verifyEmail.pleaseWait")}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-slate-500">
          {t("auth.verifyEmail.noAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {t("auth.verifyEmail.registerNow")}
          </Link>
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.verifyEmail.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
};

export default VerifyEmailPublicPage;
