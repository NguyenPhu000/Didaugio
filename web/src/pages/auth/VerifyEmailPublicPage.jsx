import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { authService } from "@/apis";
import toast from "react-hot-toast";

const VerifyEmailPublicPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Token không hợp lệ. Vui lòng kiểm tra lại link trong email.");
      return;
    }

    try {
      setStatus("verifying");
      const response = await authService.verifyEmail({ token });
      setStatus("success");
      setMessage(response.message || "Xác thực email thành công!");
      toast.success("✅ Xác thực email thành công!");

      // Auto redirect sau 3 giây
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Email đã được xác thực. Vui lòng đăng nhập." },
        });
      }, 3000);
    } catch (error) {
      setStatus("error");
      const errorMsg =
        error.response?.data?.message || error.message || "Xác thực thất bại";
      setMessage(errorMsg);
      toast.error(`❌ ${errorMsg}`);
    }
  }, [navigate, token]);

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
            {status === "verifying" && "Đang xác thực email..."}
            {status === "success" && "Xác thực thành công!"}
            {status === "error" && "Xác thực thất bại"}
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
                  Đi đến Đăng nhập
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Tự động chuyển hướng sau 3 giây...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <Button
                  onClick={verifyEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={() => navigate("/resend-verification")}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Gửi lại email xác thực
                </Button>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    Các lỗi thường gặp:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-2">
                    <li>
                      • <strong>Token đã hết hạn:</strong> Token có hiệu lực 24
                      giờ. Vui lòng gửi lại email xác thực.
                    </li>
                    <li>
                      • <strong>Token không hợp lệ:</strong> Link có thể bị sai.
                      Kiểm tra lại email hoặc gửi lại.
                    </li>
                    <li>
                      • <strong>Email đã xác thực:</strong> Tài khoản của bạn đã
                      được xác thực. Vui lòng đăng nhập.
                    </li>
                  </ul>
                </div>
              </>
            )}

            {status === "verifying" && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Vui lòng đợi trong giây lát...
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link to="/login" className="text-blue-600 hover:underline">
                Quay lại Đăng nhập
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPublicPage;
