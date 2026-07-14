import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { authService } from "@/apis";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/constants";

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
      toast.error(`❌ ${errorMsg}`);
    }
  }, [navigate, token, user, setUser, t]);

  useEffect(() => {
    const id = setTimeout(() => {
      verifyEmail();
    }, 0);
    return () => clearTimeout(id);
  }, [verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "verifying" && (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            )}
            {status === "error" && (
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "verifying" && t("auth.verifyEmail.verifying")}
            {status === "success" && t("auth.verifyEmail.success")}
            {status === "error" && t("auth.verifyEmail.failed")}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message */}
          <div className="text-center">
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {status === "success" && (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {t("auth.verifyEmail.goToLogin")}
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  {t("auth.verifyEmail.autoRedirect")}
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <Button
                  onClick={verifyEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {t("auth.verifyEmail.retry")}
                </Button>
                <Button
                  onClick={() => navigate("/resend-verification")}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("auth.verifyEmail.resendEmail")}
                </Button>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    {t("auth.verifyEmail.commonErrors")}
                  </p>
                  <ul className="text-xs text-gray-500 space-y-2">
                    <li>
                      • {t("auth.verifyEmail.tokenExpired")}
                    </li>
                    <li>
                      • {t("auth.verifyEmail.tokenInvalid")}
                    </li>
                    <li>
                      • {t("auth.verifyEmail.emailAlreadyVerified")}
                    </li>
                  </ul>
                </div>
              </>
            )}

            {status === "verifying" && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {t("auth.verifyEmail.pleaseWait")}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600">
              {t("auth.verifyEmail.noAccount")}{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                {t("auth.verifyEmail.registerNow")}
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link to="/login" className="text-blue-600 hover:underline">
                {t("auth.verifyEmail.backToLogin")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPublicPage;
