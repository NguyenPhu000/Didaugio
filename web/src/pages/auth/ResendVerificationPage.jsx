import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { authService } from "@/apis";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

const ResendVerificationPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    try {
      setLoading(true);

      if (isAuthenticated) {
        // User đã đăng nhập → Gọi API resend (cần auth)
        await authService.resendVerification();
      } else {
        // User chưa đăng nhập → Hiện tại API chưa có endpoint public
        // TODO: Cần tạo endpoint POST /api/auth/resend-verification-public { email }
        setError("Bạn cần đăng nhập để gửi lại email xác thực.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      setSuccess(true);
      toast.success("✅ Đã gửi lại email xác thực!");

      // Auto redirect sau 5 giây
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Gửi email thất bại";
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
            Gửi lại email xác thực
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Nhập email để nhận link xác thực mới
          </p>
        </CardHeader>

        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">Email đã được gửi!</p>
                <p className="text-sm">
                  Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục Spam).
                  Link xác thực có hiệu lực trong 24 giờ.
                </p>
                <p className="text-sm mt-3 text-gray-600">
                  Tự động chuyển hướng sau 5 giây...
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
                  disabled={isAuthenticated || loading}
                  required
                />
                {isAuthenticated && (
                  <p className="text-xs text-gray-500">
                    Email được lấy từ tài khoản đã đăng nhập
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
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Gửi lại email
                  </>
                )}
              </Button>

              {/* Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">📧 Lưu ý:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Kiểm tra cả thư mục Spam/Junk</li>
                    <li>• Link có hiệu lực trong 24 giờ</li>
                    <li>• Mỗi email chỉ gửi được 1 lần/phút</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </form>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline">
                Quay lại Đăng nhập
              </Link>
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng ký ngay
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
