import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Label,
} from "@/components/ui";
import { authService } from "@/services";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email khong hop le").toLowerCase(),
});

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

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
      const response = await authService.forgotPassword(data.email);
      setEmailSent(true);
      toast.success("Vui long kiem tra email de dat lai mat khau");

      // Hiển thị token nếu ở dev mode (để test)
      if (response.data?.resetToken) {
        console.log("Reset Token (DEV only):", response.data.resetToken);
        toast.success(`Token: ${response.data.resetToken}`, {
          duration: 10000,
        });
      }
    } catch (error) {
      toast.error(error.message || "Co loi xay ra. Vui long thu lai");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/auth/login")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lai dang nhap
        </button>

        <Card className="shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Quen mat khau?</CardTitle>
            <CardDescription>
              {emailSent
                ? "Chung toi da gui huong dan dat lai mat khau"
                : "Nhap email cua ban de nhan huong dan dat lai mat khau"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Dia chi email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    autoFocus
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Gui huong dan
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-sm text-green-800">
                    Neu email <strong>{email}</strong> ton tai trong he thong,
                    ban se nhan duoc email voi huong dan dat lai mat khau.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>Vui long kiem tra hop thu den va thu muc spam.</p>
                  <p>Link dat lai mat khau se het han sau 1 gio.</p>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleResend}
                    className="w-full"
                  >
                    Thu email khac
                  </Button>
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/auth/login">Quay lai dang nhap</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Ban can ho tro?{" "}
            <a
              href="mailto:support@didaugio.com"
              className="text-primary hover:underline"
            >
              Lien he ho tro
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
