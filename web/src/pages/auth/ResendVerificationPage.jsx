import { useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { authService } from "@/apis";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("auth.resendVerification.title")}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {t("auth.resendVerification.subtitle")}
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">{t("auth.resendVerification.emailSent")}</p>
                <p className="text-sm">
                  {t("auth.resendVerification.checkInbox")}
                </p>
                <p className="text-sm mt-3 text-gray-600">
                  {t("auth.resendVerification.autoRedirect")}
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleResend} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                {isAuthenticated && (
                  <p className="text-xs text-gray-500">
                    {t("auth.resendVerification.emailFromAccount")}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.resendVerification.submitting")}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t("auth.resendVerification.submit")}
                  </>
                )}
              </Button>

              {/* Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  {fromRegister && (
                    <p className="font-semibold mb-2">
                      {t("auth.resendVerification.accountCreated")}
                    </p>
                  )}
                  <p className="font-semibold mb-2">{t("auth.resendVerification.note")}</p>
                  <ul className="space-y-1 text-xs">
                    <li>• {t("auth.resendVerification.noteCheckSpam")}</li>
                    <li>• {t("auth.resendVerification.noteExpiry")}</li>
                    <li>• {t("auth.resendVerification.noteRateLimit")}</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </form>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline">
                {t("auth.resendVerification.backToLogin")}
              </Link>
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-gray-600">
                {t("auth.resendVerification.noAccount")}{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t("auth.resendVerification.registerNow")}
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResendVerificationPage;
