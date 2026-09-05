import { ArrowLeft, CheckCircle2, FileText, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Input, Label } from "@/components/ui";
import AuthShell from "@/components/auth/AuthShell";
import api from "@/constants/api";
import { buildAccountDeletionRequest } from "@/utils/accountDeletionRequest";
import { useTranslation } from "react-i18next";

const supportEmail = "hotro@didaugio.vn";

function LegalLayout({ icon: Icon, title, intro, children }) {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t("legal.shellTitle")}
      subtitle={t("legal.shellSubtitle")}
    >
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> {t("legal.backToLogin")}
      </Link>
      <div className="mb-7">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{intro}</p>
      </div>
      {children}
      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
        <Link to="/privacy" className="hover:text-slate-900">{t("legal.links.privacy")}</Link>
        <Link to="/terms" className="hover:text-slate-900">{t("legal.links.terms")}</Link>
        <Link to="/account-deletion" className="hover:text-slate-900">{t("legal.links.deleteAccount")}</Link>
      </nav>
    </AuthShell>
  );
}

function LegalDocument({ title, intro, sections, icon }) {
  const { t } = useTranslation();
  return (
    <LegalLayout icon={icon} title={title} intro={intro}>
      <div className="space-y-5 text-sm leading-relaxed text-slate-600">
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-950">{t("legal.lastUpdated")}</p>
        {sections.map(([heading, content]) => (
          <section key={heading}>
            <h2 className="font-semibold text-slate-900">{heading}</h2>
            <p className="mt-1">{content}</p>
          </section>
        ))}
      </div>
    </LegalLayout>
  );
}

function AccountDeletionPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/feedback", buildAccountDeletionRequest(email));
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error?.message || t("legal.deletion.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LegalLayout
      icon={Trash2}
      title={t("legal.deletion.title")}
      intro={t("legal.deletion.intro")}
    >
      {isSubmitted ? (
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-relaxed text-emerald-950">
          <CheckCircle2 className="h-7 w-7 text-emerald-700" />
          <p className="font-semibold">{t("legal.deletion.successTitle")}</p>
          <p>{t("legal.deletion.successDescription")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              <Mail className="mr-2 inline h-4 w-4 text-slate-400" /> {t("legal.deletion.email")}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            {t("legal.deletion.notice")}
          </div>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
            {t("legal.deletion.submit")}
          </Button>
        </form>
      )}
    </LegalLayout>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();
  return <LegalDocument icon={ShieldCheck} title={t("legal.privacy.title")} intro={t("legal.privacy.intro")} sections={t("legal.privacy.sections", { returnObjects: true, supportEmail })} />;
}

export function TermsPage() {
  const { t } = useTranslation();
  return <LegalDocument icon={FileText} title={t("legal.terms.title")} intro={t("legal.terms.intro")} sections={t("legal.terms.sections", { returnObjects: true, supportEmail })} />;
}

export { AccountDeletionPage };
