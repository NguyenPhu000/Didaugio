import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Mail from "lucide-react/dist/esm/icons/mail";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Send from "lucide-react/dist/esm/icons/send";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Shield from "lucide-react/dist/esm/icons/shield";
import KeyRound from "lucide-react/dist/esm/icons/key-round";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
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
import { authService } from "@/apis";
import { forgotPasswordSchema } from "@/schemas/auth";

// const forgotPasswordSchema = z.object({...}); // Removed

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
      toast.success("Vui lòng kiểm tra email để đặt lại mật khẩu");

      // Hiển thị token nếu ở dev mode (để test)
      if (response.data?.resetToken) {
        console.log("Reset Token (DEV only):", response.data.resetToken);
        toast.success(`Token: ${response.data.resetToken}`, {
          duration: 10000,
        });
      }
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-10 pointer-events-none"></div>

      {/* Left Side - Tactical Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
        {/* Accent Bars */}
        <div className="absolute top-0 left-0 w-2 h-full bg-[#F3E600]"></div>
        <div className="absolute top-0 right-0 w-2 h-full bg-[#F3E600]"></div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-dots opacity-20"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 border-2 border-[#F3E600] flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#F3E600]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  DIDAUGIO
                </h2>
                <p className="text-[#F3E600] text-xs font-mono uppercase tracking-wider">
                  PASSWORD RECOVERY
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-black text-white uppercase leading-tight mb-4">
                ACCOUNT
                <br />
                RECOVERY
                <br />
                SYSTEM
              </h1>
              <div className="w-24 h-1 bg-[#F3E600]"></div>
            </div>

            <p className="text-gray-400 font-mono text-sm uppercase leading-relaxed max-w-md">
              KHÔI PHỤC MẬT KHẨU AN TOÀN
              <br />
              VỚI HỆ THỐNG XÁC THỰC EMAIL
            </p>

            {/* Security Features */}
            <div className="space-y-3 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <KeyRound className="h-3 w-3 text-[#F3E600]" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  SECURE TOKEN GENERATION
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <Mail className="h-3 w-3 text-[#F3E600]" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  EMAIL VERIFICATION
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 border border-[#F3E600] flex items-center justify-center shrink-0 mt-1">
                  <Shield className="h-3 w-3 text-[#F3E600]" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-mono">
                  1 HOUR EXPIRATION TIME
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600 uppercase font-mono">
            © 2026 CAN THO SMART TOURISM
          </div>
        </div>
      </div>

      {/* Right Side - Recovery Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-md relative z-10">
          {/* Back Button */}
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors uppercase font-mono text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO LOGIN
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">DIDAUGIO</h2>
              <p className="text-[#F3E600] text-xs font-mono uppercase">
                SYSTEM
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {!emailSent ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 border-2 border-black bg-[#F3E600] flex items-center justify-center">
                      <KeyRound className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2 justify-center">
                    <div className="w-1 h-8 bg-[#F3E600]"></div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                      FORGOT PASSWORD
                    </h1>
                  </div>
                  <p className="text-xs text-gray-500 uppercase font-mono text-center">
                    NHẬP EMAIL ĐỂ KHÔI PHỤC TÀI KHOẢN
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="tim-meta flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      EMAIL ADDRESS
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="YOUR@EMAIL.COM"
                      autoComplete="email"
                      autoFocus
                      className="rounded-none border-2 border-black h-12 uppercase font-mono text-sm focus-visible:border-[#F3E600] focus-visible:ring-0"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 font-mono uppercase">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={isLoading}
                    className="w-full rounded-none border-2 border-black bg-[#F3E600] text-black hover:bg-black hover:text-[#F3E600] h-12 uppercase font-black text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                  >
                    {isLoading ? (
                      "SENDING..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        SEND RECOVERY EMAIL
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="space-y-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 border-2 border-black bg-[#F3E600] flex items-center justify-center">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black uppercase mb-2">
                      EMAIL SENT
                    </h2>
                    <p className="text-xs text-gray-500 uppercase font-mono">
                      KIỂM TRA HỘP THƯ CỦA BẠN
                    </p>
                  </div>

                  <div className="bg-[#F3E600] border-2 border-black p-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                    <p className="text-xs font-mono uppercase leading-relaxed">
                      NẾU EMAIL <strong>{email}</strong> TỒN TẠI TRONG HỆ THỐNG,
                      <br />
                      BẠN SẼ NHẬN ĐƯỢC HƯỚNG DẪN ĐẶT LẠI MẬT KHẨU.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600 uppercase font-mono bg-gray-50 border border-gray-200 p-4">
                    <p>• CHECK INBOX & SPAM FOLDER</p>
                    <p>• LINK EXPIRES IN 1 HOUR</p>
                    <p>• CONTACT SUPPORT IF NEEDED</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleResend}
                      className="w-full rounded-none border-2 border-black h-11 hover:bg-gray-100 uppercase font-black text-xs"
                    >
                      TRY DIFFERENT EMAIL
                    </Button>
                    <Link
                      to="/auth/login"
                      className="inline-block w-full rounded-none border-2 border-black bg-white text-black hover:bg-gray-100 h-11 px-6 uppercase font-black text-xs transition-all flex items-center justify-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      BACK TO LOGIN
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 uppercase font-mono">
              NEED HELP? CONTACT{" "}
              <a
                href="mailto:support@didaugio.com"
                className="text-black underline hover:text-[#F3E600]"
              >
                SUPPORT@DIDAUGIO.COM
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
