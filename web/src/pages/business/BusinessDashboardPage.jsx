import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Ticket,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileSignature,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import useBusinessStore from "@/stores/businessStore";
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
} from "@/components/business/DashboardWidgets";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/Button";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";

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

const CONTRACT_STATUS_UI = {
  signed: {
    title: "Đã ký hợp đồng",
    description: "Hồ sơ pháp lý đã hoàn tất và sẵn sàng vận hành đầy đủ.",
    icon: ShieldCheck,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  pending: {
    title: "Chưa ký hợp đồng",
    description: "Vui lòng hoàn tất ký hợp đồng để đảm bảo quy trình pháp lý.",
    icon: AlertTriangle,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  },
};

const BusinessDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const business = useBusinessStore((s) => s.business);
  const dashboardStats = useBusinessStore((s) => s.dashboardStats);
  const fetchDashboard = useBusinessStore((s) => s.fetchDashboard);
  const [loading, setLoading] = useState(true);

  /** Dữ liệu dashboard — profile/hợp đồng lấy từ `business` (đã fetch trong BusinessGuard) */
  const stats = dashboardStats;
  const overview = useMemo(() => stats?.overview || stats || {}, [stats]);
  const topServices = stats?.topServices || [];
  const period = stats?.period || null;

  const statMiniCharts = useMemo(() => {
    const places = Number(overview?.placesCount || 0);
    const services = Number(overview?.servicesCount || 0);
    const bookings = Number(
      overview?.bookingsTotal || stats?.bookingsCount || 0,
    );
    const netRevenue = Number(overview?.netRevenue || 0);

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
  }, [overview, stats?.bookingsCount]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchDashboard();
      } catch (error) {
        if (!cancelled) {
          toastApiErrorIfNeeded(error, "Không thể tải thống kê");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const contractStatusKey = useMemo(() => {
    const isSigned =
      Boolean(business?.contractSigned) ||
      Boolean(user?.businessProfile?.contractSigned);
    return isSigned ? "signed" : "pending";
  }, [business?.contractSigned, user?.businessProfile?.contractSigned]);

  const contractStatus = CONTRACT_STATUS_UI[contractStatusKey];
  const ContractStatusIcon = contractStatus.icon;

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
              value={overview?.placesCount ?? stats?.placesCount ?? 0}
              icon={MapPin}
              iconColor="emerald"
              trend="+8%"
              miniChart={statMiniCharts.places}
              description="Địa điểm đang hoạt động"
            />
            <StatCard
              title="Dịch vụ"
              value={overview?.servicesCount ?? stats?.servicesCount ?? 0}
              icon={Ticket}
              iconColor="teal"
              trend="+5%"
              miniChart={statMiniCharts.services}
              description="Tổng dịch vụ đang cung cấp"
              href={BUSINESS_ROUTES.SERVICES}
            />
            <StatCard
              title="Tổng đặt chỗ"
              value={overview?.bookingsTotal ?? stats?.bookingsCount ?? 0}
              icon={CalendarCheck}
              iconColor="blue"
              trend="+12%"
              miniChart={statMiniCharts.bookings}
              description="Tất cả trạng thái booking"
              href={BUSINESS_ROUTES.BOOKINGS}
            />
            <StatCard
              title="Doanh thu ròng"
              value={formatVND(overview?.netRevenue ?? stats?.netRevenue)}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  count={overview?.bookingsByStatus?.[key] || 0}
                  total={overview?.bookingsTotal || stats?.bookingsCount || 0}
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
                      {formatVND(overview?.totalRevenue ?? stats?.totalRevenue)}
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
                      -
                      {formatVND(
                        overview?.totalCommission ?? stats?.totalCommission,
                      )}
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
                      {formatVND(overview?.netRevenue ?? stats?.netRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-muted-foreground">Tỉ lệ chuyển đổi</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {overview?.conversionRate ?? 0}%
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-2.5">
                  <p className="text-muted-foreground">Đánh giá trung bình</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {(overview?.avgRating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {loading ? (
          <SectionCardSkeleton rows={3} />
        ) : (
          <SectionCard title="Tuân thủ pháp lý" titleIcon={FileSignature}>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className={`rounded-lg p-2 ${contractStatus.className}`}>
                  <ContractStatusIcon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {contractStatus.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {contractStatus.description}
                  </p>
                  {business?.contractSignedAt && (
                    <p className="text-xs text-muted-foreground">
                      Ký lúc:{" "}
                      {new Date(business.contractSignedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant={contractStatusKey === "signed" ? "outline" : "default"}
                className="w-full gap-2"
                onClick={() => navigate(BUSINESS_ROUTES.PROFILE_CONTRACT)}
              >
                {contractStatusKey === "signed"
                  ? "Xem thông tin hợp đồng"
                  : "Hoàn tất ký hợp đồng"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </SectionCard>
        )}
      </div>

      {!loading && (
        <SectionCard title="Chỉ số vận hành P2" titleIcon={BarChart3}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Pending hôm nay</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {overview?.pendingBookingsToday ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Booking tuần này</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {overview?.newBookingsThisWeek ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Kỳ thống kê</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {period
                  ? `${period.from} → ${period.to}${period.preset ? ` (${period.preset})` : ""}`
                  : "Mặc định"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Top dịch vụ</p>
            {topServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Chưa có dịch vụ hoàn thành trong kỳ.
              </p>
            ) : (
              <div className="space-y-1.5">
                {topServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <p className="text-sm text-foreground truncate pr-3">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {service.bookingCount} booking ·{" "}
                      {formatVND(service.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default BusinessDashboardPage;
