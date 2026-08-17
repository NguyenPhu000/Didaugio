import { useNavigate, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useBusinessProfile } from "@/hooks/queries/useBusinessQueries";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BUSINESS_STATUS } from "@/constants/constants";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@/components/ui";
import {
  Clock,
  FileText,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Store,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

export default function BusinessWelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: businessResponse, isLoading } = useBusinessProfile();
  const biz = businessResponse?.data || businessResponse;

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    );
  }

  // 2. Nếu chưa có hồ sơ doanh nghiệp -> Chuyển hướng sang trang đăng ký
  if (!biz) {
    return <Navigate to={BUSINESS_ROUTES.REGISTER} replace />;
  }

  // 3. Nếu doanh nghiệp ĐÃ ĐƯỢC PHÊ DUYỆT (APPROVED) -> Không thể vào lại trang welcome này nữa
  if (biz.status === BUSINESS_STATUS.APPROVED) {
    if (!biz.contractSigned) {
      return <Navigate to={BUSINESS_ROUTES.PROFILE_CONTRACT} replace />;
    }
    return <Navigate to={BUSINESS_ROUTES.DASHBOARD} replace />;
  }

  const handleGetStarted = () => {
    navigate(BUSINESS_ROUTES.DASHBOARD);
  };

  const handleViewProfile = () => {
    navigate(BUSINESS_ROUTES.PROFILE);
  };

  const handleCreateService = () => {
    navigate(BUSINESS_ROUTES.SERVICES);
  };

  const displayName = user?.profile?.fullName || user?.username || biz?.name || "Quý Đối Tác";
  const isRejected = biz.status === BUSINESS_STATUS.REJECTED;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      {/* Cinematic Ambient Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full relative z-10 space-y-6">
        {/* Main Hero Showcase Card */}
        <Card className="border border-border/80 bg-card/90 shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden">
          {/* Header Banner */}
          <div className="relative p-8 sm:p-10 border-b border-border/60 bg-gradient-to-b from-primary/5 via-transparent to-transparent text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Chào mừng đến với iPoint Genie
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
              {isRejected
                ? "Hồ Sơ Cần Bổ Sung Thông Tin"
                : "Hồ Sơ Doanh Nghiệp Đã Được Tiếp Nhận"}
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Xin chào <span className="font-bold text-foreground">{displayName}</span>. Bạn đang đồng hành cùng hệ thống du lịch thông minh và gợi ý lịch trình AI hàng đầu Cần Thơ.
            </p>
          </div>

          <CardContent className="p-6 sm:p-10 space-y-8">
            {/* Status Live Banner */}
            {isRejected ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-destructive/40 bg-destructive/10">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-destructive/20 text-destructive shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">
                        Trạng thái: Cần chỉnh sửa hồ sơ
                      </h3>
                      <Badge variant="destructive" className="text-[10px] font-bold uppercase">
                        Từ chối
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                      Lý do: {biz.rejectionReason || "Vui lòng kiểm tra lại giấy phép kinh doanh hoặc thông tin liên hệ."}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleViewProfile}
                  size="sm"
                  variant="destructive"
                  className="shrink-0 rounded-xl font-bold text-xs"
                >
                  Cập Nhật Hồ Sơ
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">
                        Trạng thái hiện tại: Đang chờ xét duyệt
                      </h3>
                      <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px] font-bold uppercase">
                        1 - 3 ngày làm việc
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                      Bạn có thể hoàn thiện thông tin dịch vụ, bảng giá và hình ảnh trước để sẵn sàng đón khách ngay khi được duyệt.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCreateService}
                  size="sm"
                  className="shrink-0 rounded-xl font-bold text-xs"
                >
                  <Store className="w-3.5 h-3.5 mr-1.5" /> Thêm Dịch Vụ Mẫu
                </Button>
              </div>
            )}

            {/* Launchpad Checklist Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Lộ trình chuẩn bị vận hành
              </h3>

              <div className="grid gap-3.5 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Xác thực vị trí",
                    desc: "Cập nhật tọa độ bản đồ số chính xác trên 9 quận/huyện Cần Thơ.",
                    icon: MapPin,
                  },
                  {
                    step: "02",
                    title: "Thiết lập bảng giá",
                    desc: "Đăng tải dịch vụ, menu hoặc phòng nghỉ kèm voucher ưu đãi.",
                    icon: FileText,
                  },
                  {
                    step: "03",
                    title: "Kích hoạt AI Tour",
                    desc: "Địa điểm tự động xuất hiện trong gợi ý lịch trình thông minh của du khách.",
                    icon: Rocket,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="p-5 rounded-2xl border border-border/80 bg-card/60 hover:border-primary/40 hover:bg-card/90 transition-all duration-300 space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono font-bold text-muted-foreground/60">
                          {item.step}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Step Steps Full Width */}
            <div className="p-5 rounded-2xl border border-border/60 bg-muted/30 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Quy trình xác thực & hỗ trợ đối tác
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Xác minh tư cách pháp nhân và an toàn vệ sinh thực phẩm / du lịch.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Được hỗ trợ gắn nhãn Địa điểm uy tín (Verified Badge) trên hệ thống.</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="flex-1 font-bold rounded-2xl h-12 shadow-lg transition-transform active:scale-[0.98]"
              >
                Vào Trung Tâm Quản Trị <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={handleViewProfile}
                variant="outline"
                size="lg"
                className="flex-1 font-semibold rounded-2xl h-12"
              >
                Xem Hồ Sơ Doanh Nghiệp
              </Button>
            </div>

            {/* Direct Support */}
            <div className="text-center pt-2">
              <a
                href="mailto:support@ipointgenie.vn"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Cần tư vấn hỗ trợ trực tiếp? Liên hệ support@ipointgenie.vn
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
