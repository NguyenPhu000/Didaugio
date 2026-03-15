import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart3,
  MapPin,
  Ticket,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import * as businessApi from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price || 0,
  );

const StatCard = ({ title, value, icon: Icon, href, description }) => (
  <div className="bg-white border-l-4 border-l-black border border-black p-5 relative group hover:shadow-hard transition-all duration-300">
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

    <div className="flex items-start justify-between">
      <div>
        <p className="tim-meta text-muted-foreground">{title}</p>
        <p className="tim-stats text-foreground mt-1">{value}</p>
        {description && (
          <p className="text-[10px] font-mono mt-2 text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-3 bg-gray-50 border border-gray-200 group-hover:bg-primary group-hover:text-black transition-colors">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {href && (
      <Link
        to={href}
        className="flex items-center gap-1 mt-4 text-[10px] font-mono font-bold uppercase hover:text-primary transition-colors"
      >
        CHI TIẾT <ArrowRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

const BusinessDashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessApi.getDashboard();
        setStats(response.data);
      } catch (error) {
        toast.error("Không thể tải thống kê");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16" />
            <div>
              <h1 className="tim-title">TỔNG QUAN</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 uppercase">
                  XIN CHÀO! {user?.fullName || user?.username || "DOANH NGHIỆP"}
                </span>
                <p className="tim-meta hidden sm:block">
                  DỮ LIỆU HOẠT ĐỘNG KINH DOANH
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin" />
            <div className="tim-meta">ĐANG TẢI DỮ LIỆU...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="ĐỊA ĐIỂM"
                value={stats?.placesCount || 0}
                icon={MapPin}
              />
              <StatCard
                title="DỊCH VỤ"
                value={stats?.servicesCount || 0}
                icon={Ticket}
                href={BUSINESS_ROUTES.SERVICES}
              />
              <StatCard
                title="TỔNG BOOKING"
                value={stats?.bookingsCount || 0}
                icon={CalendarCheck}
                href={BUSINESS_ROUTES.BOOKINGS}
              />
              <StatCard
                title="DOANH THU RÒNG"
                value={formatPrice(stats?.netRevenue)}
                icon={DollarSign}
                href={BUSINESS_ROUTES.REVENUE}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white border border-black flex flex-col group hover:shadow-hard transition-all duration-300">
                <div className="px-5 py-4 border-b border-black bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    BOOKING THEO TRẠNG THÁI
                  </h3>
                </div>
                <div className="p-5 flex-1 space-y-4 flex flex-col justify-center">
                  {[
                    {
                      key: "pending",
                      label: "CHỜ XÁC NHẬN",
                      color: "bg-yellow-400",
                    },
                    {
                      key: "confirmed",
                      label: "ĐÃ XÁC NHẬN",
                      color: "bg-blue-400",
                    },
                    {
                      key: "completed",
                      label: "HOÀN THÀNH",
                      color: "bg-emerald-500",
                    },
                    { key: "cancelled", label: "ĐÃ HỦY", color: "bg-red-500" },
                    {
                      key: "no_show",
                      label: "KHÔNG ĐẾN",
                      color: "bg-gray-400",
                    },
                  ].map(({ key, label, color }) => {
                    const count = stats?.bookingsByStatus?.[key] || 0;
                    const pct = stats?.bookingsCount
                      ? (count / stats.bookingsCount) * 100
                      : 0;
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-28 text-[11px] font-mono font-bold">
                          {label}
                        </div>
                        <div className="flex-1 bg-gray-100 h-2.5 border border-gray-200 overflow-hidden">
                          <div
                            className={`h-full ${color}`}
                            style={{ width: `${Math.max(pct, 0)}%` }}
                          />
                        </div>
                        <div className="w-12 text-right font-mono font-bold text-sm">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-black flex flex-col group hover:shadow-hard transition-all duration-300">
                <div className="px-5 py-4 border-b border-black bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    TÓM TẮT DOANH THU
                  </h3>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      TỔNG DOANH THU
                    </span>
                    <span className="font-mono font-bold text-lg">
                      {formatPrice(stats?.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      HOA HỒNG HỆ THỐNG
                    </span>
                    <span className="font-mono font-bold text-red-600 text-lg">
                      -{formatPrice(stats?.totalCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 mt-4">
                    <span className="font-mono text-xs font-bold uppercase">
                      DOANH THU RÒNG
                    </span>
                    <span className="font-mono font-black text-emerald-600 text-2xl">
                      {formatPrice(stats?.netRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboardPage;
