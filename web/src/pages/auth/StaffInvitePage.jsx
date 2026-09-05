import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { Button, Input, Label } from "@/components/ui";
import { AUTH_ROUTES } from "@/constants/routes";
import {
  Check,
  AlertCircle,
  Loader2,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import {
  fieldLabel,
  fieldInput,
  fieldError,
  primaryButton,
  secondaryButton,
  eyeButton,
} from "@/components/auth/authStyles";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function StaffInvitePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!token) {
      setError(t("auth.staffInvite.invalidLink"));
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await staffInvitationApi.validateToken(token);
        setInvitation(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          t("auth.staffInvite.expiredLink");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token, t]);

  const validateForm = () => {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = t("auth.staffInvite.nameRequired");
    }

    if (!form.password) {
      errors.password = t("auth.staffInvite.passwordRequired");
    } else if (!PASSWORD_REGEX.test(form.password)) {
      errors.password =
        "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = t("auth.staffInvite.passwordMismatch");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setError(null);
    try {
      setSubmitting(true);
      await staffInvitationApi.accept({
        token,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Đăng ký thất bại";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate(AUTH_ROUTES.LOGIN);
  };

  // Loading state
  if (loading) {
    return (
      <AuthShell
        eyebrow="Lời mời cộng tác"
        title="Tham gia đội ngũ quản lý du lịch"
        subtitle="Đang xác minh lời mời của bạn, vui lòng chờ trong giây lát."
      >
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Đang kiểm tra lời mời...</p>
        </div>
      </AuthShell>
    );
  }

  // Error state (token validation failure — no invitation to show form with)
  if (error && !invitation) {
    return (
      <AuthShell
        eyebrow="Lời mời cộng tác"
        title="Tham gia đội ngũ quản lý du lịch"
        subtitle="Có vẻ như liên kết lời mời này không còn hiệu lực."
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Lời mời không hợp lệ
          </h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className={secondaryButton}
          >
            Về trang chủ
          </button>
        </div>
      </AuthShell>
    );
  }

  // Success state
  if (success) {
    return (
      <AuthShell
        eyebrow="Lời mời cộng tác"
        title="Chào mừng bạn đến với đội ngũ"
        subtitle="Tài khoản của bạn đã sẵn sàng. Đăng nhập để bắt đầu làm việc."
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-8 w-8" />
          </span>
          <h2 className="text-xl font-bold text-slate-900">
            Đăng ký thành công!
          </h2>
          <p className="text-sm text-slate-500">
            Bạn đã tham gia <strong className="text-slate-900">{invitation?.businessName}</strong> với
            vai trò <strong className="text-slate-900">{invitation?.roleName || "Nhân viên"}</strong>.
          </p>
          <p className="text-sm text-slate-400">
            Bây giờ bạn có thể đăng nhập bằng email và mật khẩu vừa tạo.
          </p>
          <Button onClick={handleGoToLogin} className={primaryButton}>
            Đăng nhập ngay
          </Button>
        </div>
      </AuthShell>
    );
  }

  // Registration form
  return (
    <AuthShell
      eyebrow="Lời mời cộng tác"
      title="Tham gia đội ngũ quản lý du lịch"
      subtitle="Hoàn tất thông tin bên dưới để kích hoạt tài khoản nhân viên của bạn."
    >
      <div className="mb-7 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3E600]/20 text-slate-900">
          <Building2 className="h-8 w-8" strokeWidth={2} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tham gia doanh nghiệp
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Bạn được mời tham gia{" "}
          <strong className="text-slate-900">{invitation?.businessName}</strong>
        </p>
        {invitation?.roleName && (
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Vai trò: {invitation.roleName}
          </div>
        )}
        {invitation?.roleDescription && (
          <p className="mt-2 text-xs text-slate-400">
            {invitation.roleDescription}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email (read-only) */}
        {invitation?.email && (
          <div className="space-y-2">
            <Label htmlFor="email" className={fieldLabel}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={invitation.email}
              disabled
              className={`${fieldInput} bg-slate-50 text-slate-500`}
            />
          </div>
        )}

        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className={fieldLabel}>
            Họ và tên <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Nguyễn Văn A"
            value={form.fullName}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullName: e.target.value }))
            }
            className={`${fieldInput} ${formErrors.fullName ? "border-rose-400" : ""}`}
          />
          {formErrors.fullName && (
            <p className={fieldError}>{formErrors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className={fieldLabel}>
            Số điện thoại
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0901234567"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={fieldInput}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className={fieldLabel}>
            Mật khẩu <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ít nhất 8 ký tự, có ký tự đặc biệt"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className={`${fieldInput} pr-12 ${formErrors.password ? "border-rose-400" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={eyeButton}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {formErrors.password && (
            <p className={fieldError}>{formErrors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={fieldLabel}>
            Xác nhận mật khẩu <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              className={`${fieldInput} pr-12 ${formErrors.confirmPassword ? "border-rose-400" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={eyeButton}
              aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p className={fieldError}>{formErrors.confirmPassword}</p>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <Button type="submit" className={primaryButton} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : (
            "Đăng ký"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
