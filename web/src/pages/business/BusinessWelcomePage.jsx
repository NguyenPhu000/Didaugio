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
import { Clock, FileText, Rocket, CheckCircle2, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="max-w-lg w-full shadow-2xl border-none overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center text-white relative">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight mb-2">
            Chào mừng bạn
          </h1>
          <p className="text-emerald-50 text-sm font-medium tracking-wide">
            Đăng ký doanh nghiệp thành công
          </p>
        </div>

        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Xin chào{" "}
              <span className="font-bold text-slate-800 dark:text-white">
                {user?.profile?.fullName || user?.username}
              </span>
              !
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
              Hồ sơ doanh nghiệp của bạn đã được gửi và đang chờ phê duyệt từ quản trị viên. Chúng tôi sẽ thông báo cho bạn khi hồ sơ được duyệt.
            </p>
          </div>

          {/* Status Alert */}
          <Alert className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <AlertTitle className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
                  Trạng thái: Chờ phê duyệt
                </AlertTitle>
                <AlertDescription className="text-amber-600 dark:text-amber-500 text-xs mt-1">
                  Hồ sơ đang được xem xét. Thời gian xử lý thường từ 1-3 ngày làm việc.
                </AlertDescription>
              </div>
            </div>
          </Alert>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-wide uppercase">
              Các bước tiếp theo:
            </h3>
            <div className="space-y-4">
              {[
                {
                  step: 1,
                  title: "Chờ phê duyệt",
                  desc: "Quản trị viên sẽ xem xét thông tin và hồ sơ pháp lý của bạn.",
                  icon: Clock,
                  iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
                },
                {
                  step: 2,
                  title: "Ký hợp đồng điện tử",
                  desc: "Sau khi được duyệt, bạn sẽ nhận được thông báo để ký hợp đồng dịch vụ điện tử.",
                  icon: FileText,
                  iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
                },
                {
                  step: 3,
                  title: "Bắt đầu kinh doanh",
                  desc: "Bạn có thể đăng dịch vụ, quản lý đặt chỗ và theo dõi doanh thu trên Dashboard.",
                  icon: Rocket,
                  iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className={`p-2.5 rounded-xl shrink-0 ${item.iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                        {item.step}. {item.title}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="my-6 bg-slate-100 dark:bg-slate-800" />

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 shadow-md hover:shadow-lg transition-all"
            >
              Vào Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleViewProfile}
              variant="outline"
              size="lg"
              className="w-full border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl h-12 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Xem hồ sơ doanh nghiệp
            </Button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Nếu có thắc mắc, vui lòng liên hệ hỗ trợ qua email{" "}
            <a href="mailto:support@didaugio.vn" className="underline hover:text-slate-600 dark:hover:text-slate-300">
              support@didaugio.vn
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
