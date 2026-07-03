import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { staffInvitationApi } from "@/apis/staffInvitationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AUTH_ROUTES } from "@/constants/routes";
import {
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconBuilding,
  IconShield,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";

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
  }, [token]);

  const validateForm = () => {
    const errors = {};

    if (!form.fullName.trim()) {
      errors.fullName = t("auth.staffInvite.nameRequired");
    }

    if (!form.password) {
      errors.password = t("auth.staffInvite.passwordRequired");
    } else if (form.password.length < 6) {
      errors.password = t("auth.staffInvite.passwordMin");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang kiểm tra lời mời...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (token validation failure — no invitation to show form with)
  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <IconAlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-red-600">
              Lời mời không hợp lệ
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <IconCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-600">
              Đăng ký thành công!
            </h2>
            <p className="text-muted-foreground">
              Bạn đã tham gia <strong>{invitation?.businessName}</strong> với
              vai trò <strong>{invitation?.roleName || "Nhân viên"}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Bây giờ bạn có thể đăng nhập bằng email và mật khẩu vừa tạo.
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              Đăng nhập ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <IconBuilding className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Tham gia doanh nghiệp</CardTitle>
          <p className="text-muted-foreground">
            Bạn được mời tham gia{" "}
            <strong className="text-foreground">
              {invitation?.businessName}
            </strong>
          </p>
          {invitation?.roleName && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mx-auto">
              <IconShield className="h-4 w-4" />
              Vai trò: {invitation.roleName}
            </div>
          )}
          {invitation?.roleDescription && (
            <p className="mt-1 text-xs text-muted-foreground">
              {invitation.roleDescription}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            {invitation?.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className={formErrors.fullName ? "border-red-500" : ""}
              />
              {formErrors.fullName && (
                <p className="text-xs text-red-500">{formErrors.fullName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={formErrors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-red-500">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
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
                  className={
                    formErrors.confirmPassword ? "border-red-500" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <IconEyeOff className="h-4 w-4" />
                  ) : (
                    <IconEye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
