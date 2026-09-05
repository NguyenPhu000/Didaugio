import { useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button, Input, Label } from "@/components/ui";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { authService } from "@/apis";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
  primaryButton,
} from "@/components/auth/authStyles";

const ResendVerificationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const queryEmail = searchParams.get("email") || "";
  const fromRegister = searchParams.get("from") === "register";

  const initialEmail = useMemo(
    () => user?.email || queryEmail,
    [user?.email, queryEmail],
  );

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !email.includes("@")) {
      setError(t("auth.resendVerification.enterValidEmail"));
      return;
    }

    try {
      setLoading(true);

      if (isAuthenticated) {
        await authService.resendVerification();
      } else {
        await authService.resendVerificationPublic(email.trim());
      }

      setSuccess(true);
      toast.success(t("auth.resendVerification.success"));

      // Auto redirect sau 5 giây
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || t("auth.resendVerification.sendFailed");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Gửi lại xác thực"
      title="Chưa nhận được email? Chúng tôi sẽ gửi lại ngay"
      subtitle="Nhập email của bạn và chúng tôi sẽ gửi lại liên kết xác thực tài khoản."
    >
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
          <Mail className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("auth.resendVerification.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t("auth.resendVerification.subtitle")}
        </p>
      </div>

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm text-emerald-800">
            <p className="mb-1 font-semibold">
              {t("auth.resendVerification.emailSent")}
            </p>
            <p>{t("auth.resendVerification.checkInbox")}</p>
            <p className="mt-3 text-emerald-700/80">
              {t("auth.resendVerification.autoRedirect")}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className={fieldLabel}>
              <Mail className="h-4 w-4 text-slate-400" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              required
              className={fieldInput}
            />
            {isAuthenticated && (
              <p className="text-xs text-slate-400">
                {t("auth.resendVerification.emailFromAccount")}
              </p>
            )}
          </div>

          <Button type="submit" className={primaryButton} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.resendVerification.submitting")}
              </>
            ) : (
              <>
                <Mail className="mr-1 h-4 w-4" />
                {t("auth.resendVerification.submit")}
              </>
            )}
          </Button>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
            {fromRegister && (
              <p className="font-semibold text-slate-900">
                {t("auth.resendVerification.accountCreated")}
              </p>
            )}
            <p className="font-semibold text-slate-900">
              {t("auth.resendVerification.note")}
            </p>
            <p>• {t("auth.resendVerification.noteCheckSpam")}</p>
            <p>• {t("auth.resendVerification.noteExpiry")}</p>
            <p>• {t("auth.resendVerification.noteRateLimit")}</p>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-2 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.resendVerification.backToLogin")}
        </Link>
        {!isAuthenticated && (
          <p className="text-sm text-slate-500">
            {t("auth.resendVerification.noAccount")}{" "}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {t("auth.resendVerification.registerNow")}
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
};

export default ResendVerificationPage;
