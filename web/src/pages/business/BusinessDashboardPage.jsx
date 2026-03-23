import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Ticket,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import * as businessApi from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { BOOKING_STATUS } from "@/constants/constants";
import { useAuthStore } from "@/stores/authStore";
import {
  WelcomeBanner,
  StatCard,
  SectionCard,
  StatCardSkeleton,
  SectionCardSkeleton,
  StatusProgressRow,
  formatVND,
} from "@/components/business/DashboardWidgets";

const STATUS_ROWS = [
  {
    key: BOOKING_STATUS.PENDING,
    label: "Chờ xác nhận",
    colorClass: "bg-amber-400",
  },
  {
    key: BOOKING_STATUS.CONFIRMED,
    label: "Đã xác nhận",
    colorClass: "bg-blue-500",
  },
  {
    key: BOOKING_STATUS.COMPLETED,
    label: "Hoàn thành",
    colorClass: "bg-emerald-500",
  },
  { key: BOOKING_STATUS.CANCELLED, label: "Đã hủy", colorClass: "bg-rose-500" },
  {
    key: BOOKING_STATUS.NO_SHOW,
    label: "Không đến",
    colorClass: "bg-gray-400",
  },
];

const BusinessDashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const statMiniCharts = useMemo(() => {
    const places = Number(stats?.placesCount || 0);
    const services = Number(stats?.servicesCount || 0);
    const bookings = Number(stats?.bookingsCount || 0);
    const netRevenue = Number(stats?.netRevenue || 0);

    return {
      places: [
        Math.max(1, Math.floor(places * 0.35)),
        Math.max(1, Math.floor(places * 0.55)),
        Math.max(1, Math.floor(places * 0.8)),
        Math.max(1, places),
      ],
      services: [
        Math.max(1, Math.floor(services * 0.45)),
        Math.max(1, Math.floor(services * 0.65)),
        Math.max(1, Math.floor(services * 0.85)),
        Math.max(1, services),
      ],
      bookings: [
        Math.max(1, Math.floor(bookings * 0.4)),
        Math.max(1, Math.floor(bookings * 0.7)),
        Math.max(1, Math.floor(bookings * 0.9)),
        Math.max(1, bookings),
      ],
      revenue: [
        Math.max(1, Math.floor(netRevenue * 0.3)),
        Math.max(1, Math.floor(netRevenue * 0.5)),
        Math.max(1, Math.floor(netRevenue * 0.75)),
        Math.max(1, netRevenue),
      ],
    };
  }, [stats]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await businessApi.getDashboard();
        setStats(response.data);
      } catch {
        toast.error("Không thể tải thống kê");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 p-6 lg:p-8 min-h-screen">
      {/* Welcome Banner */}
      <WelcomeBanner
        name={user?.fullName || user?.username}
        role={user?.businessProfile?.businessType || "Chủ doanh nghiệp"}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Địa điểm"
              value={stats?.placesCount ?? 0}
              icon={MapPin}
              iconColor="emerald"
              trend="+8%"
              miniChart={statMiniCharts.places}
              description="Địa điểm đang hoạt động"
            />
            <StatCard
              title="Dịch vụ"
              value={stats?.servicesCount ?? 0}
              icon={Ticket}
              iconColor="teal"
              trend="+5%"
              miniChart={statMiniCharts.services}
              description="Tổng dịch vụ đang cung cấp"
              href={BUSINESS_ROUTES.SERVICES}
            />
            <StatCard
              title="Tổng đặt chỗ"
              value={stats?.bookingsCount ?? 0}
              icon={CalendarCheck}
              iconColor="blue"
              trend="+12%"
              miniChart={statMiniCharts.bookings}
              description="Tất cả trạng thái booking"
              href={BUSINESS_ROUTES.BOOKINGS}
            />
            <StatCard
              title="Doanh thu ròng"
              value={formatVND(stats?.netRevenue)}
              icon={DollarSign}
              iconColor="amber"
              trend="+9%"
              miniChart={statMiniCharts.revenue}
              description="Sau khi trừ hoa hồng nền tảng"
              href={BUSINESS_ROUTES.REVENUE}
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Booking by status */}
        {loading ? (
          <SectionCardSkeleton rows={5} />
        ) : (
          <SectionCard
            title="Đặt chỗ theo trạng thái"
            titleIcon={CalendarCheck}
          >
            <div className="space-y-4">
              {STATUS_ROWS.map(({ key, label, colorClass }) => (
                <StatusProgressRow
                  key={key}
                  label={label}
                  count={stats?.bookingsByStatus?.[key] || 0}
                  total={stats?.bookingsCount || 0}
                  colorClass={colorClass}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Revenue Summary */}
        {loading ? (
          <SectionCardSkeleton rows={3} />
        ) : (
          <SectionCard title="Tóm tắt doanh thu" titleIcon={BarChart3}>
            <div className="space-y-4">
              {/* Total Revenue */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-950/50">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tổng doanh thu
                    </p>
                    <p className="text-lg font-bold text-foreground leading-tight">
                      {formatVND(stats?.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-rose-100 dark:bg-rose-950/50">
                    <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Hoa hồng hệ thống
                    </p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 leading-tight">
                      -{formatVND(stats?.totalCommission)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net */}
              <div className="flex items-start justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-emerald-100 dark:bg-emerald-900/50">
                    <DollarSign className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Doanh thu ròng
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 leading-tight">
                      {formatVND(stats?.netRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboardPage;
