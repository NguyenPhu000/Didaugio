import { Mail, ArrowLeft, Send, CheckCircle2, KeyRound, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "@/components/ui";
import { authService } from "@/apis";
import { forgotPasswordSchema } from "@/schemas/auth";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
  primaryButton,
} from "@/components/auth/authStyles";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch("email");

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setEmailSent(true);
      toast.success(t("auth.forgotPassword.success"));
    } catch (error) {
      toast.error(error.message || t("auth.forgotPassword.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
  };

  return (
    <AuthShell
      eyebrow="Khôi phục truy cập"
      title="Quên mật khẩu? Chúng tôi giúp bạn lấy lại nhanh chóng"
      subtitle="Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu an toàn."
    >
      <Link
        to="/auth/login"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("auth.forgotPassword.backToLogin")}
      </Link>

      {!emailSent ? (
        <>
          <div className="mb-7">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
              <KeyRound className="h-7 w-7" strokeWidth={2} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {t("auth.forgotPassword.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className={fieldLabel}>
                <Mail className="h-4 w-4 text-slate-400" />
                {t("auth.forgotPassword.emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.forgotPassword.emailPlaceholder")}
                autoComplete="email"
                autoFocus
                className={fieldInput}
                {...register("email")}
              />
              {errors.email && (
                <p className={fieldError}>{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className={primaryButton}
            >
              {isLoading ? (
                t("auth.forgotPassword.submitting")
              ) : (
                <>
                  <Send className="mr-1 h-4 w-4" />
                  {t("auth.forgotPassword.submit")}
                </>
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="space-y-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("auth.forgotPassword.emailSent")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth.forgotPassword.checkInbox")}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-[#F3E600]/40 bg-[#F3E600]/10 p-4 text-left">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
            <p className="text-sm leading-relaxed text-slate-700">
              {t("auth.forgotPassword.emailSentNote", { email })}
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left text-sm text-slate-600">
            <p>• {t("auth.forgotPassword.checkSpam")}</p>
            <p>• {t("auth.forgotPassword.linkExpiry")}</p>
            <p>• {t("auth.forgotPassword.contactSupport")}</p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={handleResend}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              {t("auth.forgotPassword.tryDifferentEmail")}
            </button>
            <Link
              to="/auth/login"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        {t("auth.forgotPassword.needHelp")}{" "}
        <a
          href="mailto:support@didaugio.com"
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          support@didaugio.com
        </a>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
