import { ArrowLeft, CheckCircle2, FileText, Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Input, Label } from "@/components/ui";
import AuthShell from "@/components/auth/AuthShell";
import api from "@/constants/api";
import { buildAccountDeletionRequest } from "@/utils/accountDeletionRequest";

const supportEmail = "hotro@didaugio.vn";

const policySections = [
  ["Du lieu thu thap", "Thong tin tai khoan, ho so, noi dung ban dang, du lieu dat cho va thanh toan, du lieu su dung dich vu, va vi tri khi ban cap quyen de hien thi dia diem gan ban."],
  ["Muc dich su dung", "Van hanh dich vu, xu ly dat cho, cai thien trai nghiem, bao dam an toan, ho tro khach hang va dap ung nghia vu phap ly."],
  ["Chia se du lieu", "Du lieu chi duoc chia se voi nha cung cap can thiet de van hanh dich vu, xu ly thanh toan, ban do/dinh vi, luu tru va khi phap luat yeu cau."],
  ["Luu giu va xoa", "Ban co the xoa tai khoan trong ung dung hoac gui yeu cau tai trang nay. Ho so ca nhan, phien dang nhap, du lieu da luu va chuyen di se duoc xoa. Ban ghi booking va thanh toan bat buoc luu giu se duoc an danh."],
  ["Lien he", `Neu can ho tro ve du lieu ca nhan, gui email den ${supportEmail}.`],
];

const termsSections = [
  ["Su dung dich vu", "Ban chiu trach nhiem ve thong tin cung cap, bao mat tai khoan va tuan thu phap luat khi su dung iPoint Genie."],
  ["Dat cho va thanh toan", "Cac booking, voucher va thanh toan phai tuan theo dieu kien cua doanh nghiep cung cap dich vu. iPoint Genie co the luu ban ghi giao dich de xu ly ho tro, tranh chap va nghia vu phap ly."],
  ["Noi dung nguoi dung", "Ban khong duoc dang tai noi dung vi pham phap luat, xam pham quyen cua nguoi khac hoac lam gian doan he thong."],
  ["Thay doi dich vu", "Chung toi co the cap nhat dich vu va dieu khoan khi can thiet. Phien ban moi se duoc cong bo tai trang nay."],
  ["Lien he", `Cau hoi ve dieu khoan su dung co the gui den ${supportEmail}.`],
];

function LegalLayout({ icon: Icon, title, intro, children }) {
  return (
    <AuthShell
      title="iPoint Genie - travel made practical."
      subtitle="Public information and account controls for iPoint Genie users."
    >
      <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
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
        <Link to="/privacy" className="hover:text-slate-900">Privacy</Link>
        <Link to="/terms" className="hover:text-slate-900">Terms</Link>
        <Link to="/account-deletion" className="hover:text-slate-900">Delete account</Link>
      </nav>
    </AuthShell>
  );
}

function LegalDocument({ title, intro, sections, icon }) {
  return (
    <LegalLayout icon={icon} title={title} intro={intro}>
      <div className="space-y-5 text-sm leading-relaxed text-slate-600">
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-emerald-950">Last updated: August 10, 2026.</p>
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
      toast.error(error?.message || "Unable to send the request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LegalLayout
      icon={Trash2}
      title="Request account deletion"
      intro="Use this form when you cannot access the mobile app. We verify ownership before processing a deletion request."
    >
      {isSubmitted ? (
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-relaxed text-emerald-950">
          <CheckCircle2 className="h-7 w-7 text-emerald-700" />
          <p className="font-semibold">Your request has been received.</p>
          <p>Our support team will verify ownership through the email address provided before deleting personal data.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              <Mail className="mr-2 inline h-4 w-4 text-slate-400" /> Account email
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
            Deletion removes your personal profile, sessions, saved data and trips. Booking and payment records that must be retained by law are anonymized.
          </div>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
            Send deletion request
          </Button>
        </form>
      )}
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return <LegalDocument icon={ShieldCheck} title="Privacy policy" intro="How iPoint Genie handles personal data and privacy choices." sections={policySections} />;
}

export function TermsPage() {
  return <LegalDocument icon={FileText} title="Terms of service" intro="The rules for using iPoint Genie services." sections={termsSections} />;
}

export { AccountDeletionPage };
