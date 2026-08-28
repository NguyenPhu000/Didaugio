// MAP: AdminAnalyticsPage
// ├── UI: @/components/admin/analytics/{AnalyticsStatCard, AnalyticsFunnelSection, AnalyticsChartsSection, AnalyticsTopPlacesSection}
// └── API: @/apis/dashboardService, @/hooks/queries/useTelemetryQueries

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { dashboardService } from "@/apis/dashboardService";
import {
  Users,
  MapPin,
  Eye,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PlaceHeatmap from "@/components/analytics/PlaceHeatmap";
import { useAdminPlaceHeatmap } from "@/hooks/queries/useTelemetryQueries";

// Extracted Sub-Components
import AnalyticsStatCard from "@/components/admin/analytics/AnalyticsStatCard";
import AnalyticsFunnelSection from "@/components/admin/analytics/AnalyticsFunnelSection";
import AnalyticsChartsSection from "@/components/admin/analytics/AnalyticsChartsSection";
import AnalyticsTopPlacesSection from "@/components/admin/analytics/AnalyticsTopPlacesSection";

const HEATMAP_RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

const AdminAnalyticsPage = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("30d");
  const [heatmapAction, setHeatmapAction] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const placeHeatmap = useAdminPlaceHeatmap({
    days: HEATMAP_RANGE_DAYS[timeRange] || 30,
    action: heatmapAction === "all" ? undefined : heatmapAction,
    limit: 100,
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats({ range: timeRange });
      setStats(res?.data || null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const funnelData = useMemo(() => {
    const views = stats?.places?.totalViews || 12500;
    const detailViews = Math.round(views * 0.35);
    const bookings = Math.round(detailViews * 0.12);
    const confirmed = Math.round(bookings * 0.78);
    const completed = Math.round(confirmed * 0.85);

    return [
      {
        label: t("admin.analytics.funnelViews"),
        value: views,
        color: "#0f172a",
      },
      {
        label: t("admin.analytics.funnelDetail"),
        value: detailViews,
        color: "#334155",
      },
      {
        label: t("admin.analytics.funnelBooking"),
        value: bookings,
        color: "#475569",
      },
      {
        label: t("admin.analytics.funnelConfirm"),
        value: confirmed,
        color: "#64748b",
      },
      {
        label: t("admin.analytics.funnelComplete"),
        value: completed,
        color: "#10b981",
      },
    ];
  }, [stats, t]);

  const activityData = useMemo(() => {
    return [
      { date: "T2", views: 420, bookings: 45 },
      { date: "T3", views: 530, bookings: 52 },
      { date: "T4", views: 610, bookings: 58 },
      { date: "T5", views: 590, bookings: 61 },
      { date: "T6", views: 820, bookings: 89 },
      { date: "T7", views: 1100, bookings: 120 },
      { date: "CN", views: 980, bookings: 105 },
    ];
  }, []);

  const placeStatusData = useMemo(
    () => [
      {
        name: t("admin.analytics.statusApproved"),
        value: stats?.places?.approved || 0,
        color: "#10b981",
      },
      {
        name: t("admin.analytics.statusPending"),
        value: stats?.places?.pending || 0,
        color: "#f59e0b",
      },
      {
        name: t("admin.analytics.statusRejected"),
        value: stats?.places?.rejected || 0,
        color: "#ef4444",
      },
      {
        name: t("admin.analytics.statusHidden"),
        value: stats?.places?.hidden || 0,
        color: "#64748b",
      },
    ],
    [stats, t]
  );

  const conversionRates = [
    {
      title: "View → Detail",
      fromStep: t("admin.analytics.viewToDetailView"),
      toStep: t("admin.analytics.viewToDetailDetail"),
      rate: 35,
      count: Math.round((stats?.places?.totalViews || 0) * 0.35),
    },
    {
      title: "Detail → Booking",
      fromStep: t("admin.analytics.detailToBookingDetail"),
      toStep: t("admin.analytics.detailToBookingBooking"),
      rate: 12,
      count: Math.round((stats?.places?.totalViews || 0) * 0.35 * 0.12),
    },
    {
      title: "Booking → Confirm",
      fromStep: t("admin.analytics.bookingToConfirmBooking"),
      toStep: t("admin.analytics.bookingToConfirmConfirm"),
      rate: 78,
      count: Math.round(
        (stats?.places?.totalViews || 0) * 0.35 * 0.12 * 0.78
      ),
    },
    {
      title: "Confirm → Complete",
      fromStep: t("admin.analytics.confirmToCompleteConfirm"),
      toStep: t("admin.analytics.confirmToCompleteComplete"),
      rate: 85,
      count: Math.round(
        (stats?.places?.totalViews || 0) * 0.35 * 0.12 * 0.78 * 0.85
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1560px] mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Báo cáo & Phân tích Nâng cao
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.analytics.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.analytics.subtitle")}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-44 h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
            <SelectItem value="7d">{t("admin.analytics.last7Days")}</SelectItem>
            <SelectItem value="30d">
              {t("admin.analytics.last30Days")}
            </SelectItem>
            <SelectItem value="90d">
              {t("admin.analytics.last90Days")}
            </SelectItem>
          </SelectContent>
        </Select>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsStatCard
          title={t("admin.analytics.totalViews")}
          value={(stats?.places?.totalViews || 0).toLocaleString()}
          subtitle={t("admin.analytics.avgPerDay", {
            value: ((stats?.places?.totalViews || 0) / 30).toFixed(0),
          })}
          icon={Eye}
          trend="up"
          trendValue={12}
          t={t}
        />
        <AnalyticsStatCard
          title={t("admin.analytics.totalPlaces")}
          value={stats?.places?.total || 0}
          subtitle={`${stats?.places?.approved || 0} ${t("admin.analytics.approved")}`}
          icon={MapPin}
          trend="up"
          trendValue={5}
          t={t}
        />
        <AnalyticsStatCard
          title={t("admin.analytics.avgRating")}
          value={stats?.places?.averageRating || 0}
          subtitle={t("admin.analytics.allPlaces")}
          icon={Star}
          t={t}
        />
        <AnalyticsStatCard
          title={t("admin.analytics.users")}
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} ${t("admin.analytics.active")}`}
          icon={Users}
          trend="up"
          trendValue={8}
          t={t}
        />
      </section>

      {/* Funnel & Conversion Rates */}
      <AnalyticsFunnelSection
        funnelData={funnelData}
        conversionRates={conversionRates}
        t={t}
      />

      {/* Charts Row */}
      <AnalyticsChartsSection
        activityData={activityData}
        placeStatusData={placeStatusData}
        t={t}
      />

      {/* Heatmap Section */}
      <section className="rounded-2xl sm:rounded-3xl bg-white border border-black/[0.04] p-3.5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.04]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Bản đồ nhiệt tương tác địa điểm
            </h3>
          </div>
          <Select value={heatmapAction} onValueChange={setHeatmapAction}>
            <SelectTrigger className="w-full sm:w-48 h-9 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">Tất cả tương tác</SelectItem>
              <SelectItem value="VIEW">Lượt xem</SelectItem>
              <SelectItem value="DIRECTION">Chỉ đường</SelectItem>
              <SelectItem value="BOOKING_CLICK">Nhấn đặt chỗ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PlaceHeatmap {...placeHeatmap} />
      </section>

      {/* Top Viewed Places */}
      <AnalyticsTopPlacesSection
        topViewed={stats?.places?.topViewed}
        t={t}
      />
    </div>
  );
};

export default AdminAnalyticsPage;
