import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { BUSINESS_ROUTES } from "@/constants/routes";
import {
  Button,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
} from "@/components/ui";
import { Clock, FileText, Rocket, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export default function BusinessWelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    navigate(BUSINESS_ROUTES.DASHBOARD);
  };

  const handleViewProfile = () => {
    navigate(BUSINESS_ROUTES.PROFILE);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Dynamic Background Glow Layer */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />

      <Card className="animate-fade-up max-w-xl w-full shadow-[0_20px_80px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-2xl relative z-10">
        {/* Header with glassmorphism gradient */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 p-8 sm:p-10 text-center text-white border-b border-white/10 relative">
          <div className="animate-fade-down w-20 h-20 mx-auto mb-5 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="animate-fade-up text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-white">
            Chào Mừng Doanh Nghiệp
          </h1>
          <p className="animate-fade-up [animation-delay:100ms] text-emerald-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
            Đăng ký hồ sơ thành công
          </p>
        </div>

        <CardContent className="p-6 sm:p-10 space-y-6">
          <div className="animate-fade-up [animation-delay:150ms] text-center space-y-2">
            <p className="text-slate-300 text-sm sm:text-base font-medium">
              Xin chào{" "}
              <span className="font-bold text-white">
                {user?.profile?.fullName || user?.username}
              </span>
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              Hồ sơ đối tác doanh nghiệp iPoint Genie của bạn đã được tiếp nhận. Đội ngũ quản trị sẽ phê duyệt trong vòng 1-3 ngày làm việc.
            </p>
          </div>

          {/* Status Alert */}
          <Alert className="animate-fade-up [animation-delay:200ms] bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <AlertTitle className="font-bold text-amber-300 text-sm tracking-wide">
                  Trạng thái: Chờ phê duyệt
                </AlertTitle>
                <AlertDescription className="text-amber-200/80 text-xs mt-1 leading-relaxed">
                  Hồ sơ đang được xem xét. Bạn vẫn có thể truy cập Dashboard để chuẩn bị dữ liệu dịch vụ trước.
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {/* Next Steps */}
          <div className="animate-fade-up [animation-delay:300ms] space-y-4 pt-2">
            <h3 className="font-bold text-xs tracking-widest text-slate-400 uppercase">
              Quy trình tiếp theo:
            </h3>
            <div className="space-y-3.5">
              {[
                {
                  step: 1,
                  title: "Phê duyệt thông tin",
                  desc: "Quản trị viên xác thực thông tin pháp lý và vị trí kinh doanh.",
                  icon: ShieldCheck,
                  iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                },
                {
                  step: 2,
                  title: "Ký hợp đồng điện tử",
                  desc: "Nhận thông báo xác nhận và ký hợp đồng dịch vụ trực tuyến.",
                  icon: FileText,
                  iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
                },
                {
                  step: 3,
                  title: "Vận hành & Kinh doanh",
                  desc: "Đăng tải dịch vụ, quản lý đơn đặt vé và theo dõi doanh thu thực tế.",
                  icon: Rocket,
                  iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.step}
                    className="flex gap-4 items-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl border shrink-0 ${item.iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-white text-sm">
                        {item.step}. {item.title}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="my-6 bg-white/10" />

          {/* Action Buttons */}
          <div className="animate-fade-up [animation-delay:400ms] flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl h-12 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Vào Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleViewProfile}
              variant="outline"
              size="lg"
              className="flex-1 border-white/15 bg-white/5 text-slate-200 font-semibold rounded-2xl h-12 hover:bg-white/10 hover:text-white transition-colors"
            >
              Hồ sơ doanh nghiệp
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 text-center pt-1">
            Cần hỗ trợ trực tiếp? Email:{" "}
            <a href="mailto:support@ipointgenie.vn" className="text-slate-400 underline hover:text-emerald-400 transition-colors">
              support@ipointgenie.vn
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

