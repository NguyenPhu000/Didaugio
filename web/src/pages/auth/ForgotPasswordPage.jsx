import { Mail, ArrowLeft, Send, CheckCircle2, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Button, Input, Label } from "@/components/ui";
import { authService } from "@/apis";
import { forgotPasswordSchema } from "@/schemas/auth";
import AuthShell from "@/components/auth/AuthShell";
import { fieldLabel, fieldInput, fieldError } from "@/components/auth/authStyles";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

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

  return (
    <AuthShell
      title="Quên mật khẩu? Chúng tôi giúp bạn lấy lại nhanh chóng."
      subtitle="Nhập email và chúng tôi sẽ gửi liên kết đặt lại mật khẩu an toàn."
      maxWidth="max-w-[420px]"
    >
      <AnimatePresence mode="wait">
        {!emailSent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Back link */}
            <Link
              to="/auth/login"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("auth.forgotPassword.backToLogin")}
            </Link>

            {/* Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
              <div className="h-[3px] w-full bg-[#F3E600]" />
              <div className="px-8 py-8 sm:px-10">
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-[26px] font-bold tracking-tight text-slate-900 leading-tight">
                    {t("auth.forgotPassword.title")}
                  </h1>
                  <p className="mt-1.5 text-[14px] text-slate-500 leading-relaxed">
                    {t("auth.forgotPassword.subtitle")}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className={fieldLabel}>
                      {t("auth.forgotPassword.emailLabel")}
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("auth.forgotPassword.emailPlaceholder")}
                        autoComplete="email"
                        autoFocus
                        className={`${fieldInput} pl-10`}
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className={fieldError}>{errors.email.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isLoading}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#F3E600] text-[15px] font-bold text-slate-900 shadow-[0_4px_14px_rgba(243,230,0,0.45)] transition-all duration-300 hover:bg-[#e8d900] hover:shadow-[0_6px_22px_rgba(243,230,0,0.55)] active:scale-[0.99] disabled:opacity-60"
                  >
                    {isLoading ? (
                      t("auth.forgotPassword.submitting")
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t("auth.forgotPassword.submit")}
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Success card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_16px_48px_-12px_rgba(15,23,42,0.16),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
              <div className="h-[3px] w-full bg-[#F3E600]" />
              <div className="px-8 py-10 text-center sm:px-10">
                {/* Animated check */}
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E600]/20"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
                >
                  <CheckCircle2 className="h-10 w-10 text-slate-800" strokeWidth={1.5} />
                </motion.div>

                <h2 className="text-[24px] font-bold tracking-tight text-slate-900">
                  {t("auth.forgotPassword.emailSent")}
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {t("auth.forgotPassword.checkInbox")}
                </p>

                {/* Email highlight */}
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">{email}</span>
                </div>

                {/* Tips */}
                <ul className="mt-6 space-y-2 text-left text-sm text-slate-500">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F3E600]" />
                    {t("auth.forgotPassword.checkSpam")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F3E600]" />
                    {t("auth.forgotPassword.linkExpiry")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F3E600]" />
                    {t("auth.forgotPassword.contactSupport")}
                  </li>
                </ul>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    to="/auth/login"
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("auth.forgotPassword.backToLogin")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEmailSent(false)}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    {t("auth.forgotPassword.tryDifferentEmail")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-center text-[11px] tracking-wide text-slate-400">
        {t("auth.forgotPassword.needHelp")}{" "}
        <a
          href="mailto:support@didaugio.com"
          className="font-medium text-slate-600 hover:underline underline-offset-4"
        >
          support@didaugio.com
        </a>
      </p>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
