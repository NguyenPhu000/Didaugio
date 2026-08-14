import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/apis/dashboardService";
import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  MapPin,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  PieChart as PieChartIcon,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getTableSerialNumber } from "@/utils/tableSerial";
import PlaceHeatmap from "@/components/analytics/PlaceHeatmap";
import { useAdminPlaceHeatmap } from "@/hooks/queries/useTelemetryQueries";

const HEATMAP_RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, t }) => (
  <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
    <div className="h-0.5 w-0 group-hover:w-full bg-[#F3E600] absolute top-0 left-0 transition-all duration-300" />
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
        <p className="text-2xl font-black tracking-tight text-slate-950 font-mono tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>
        )}
        {trendValue !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-bold font-mono pt-1 tabular-nums",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-400"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : trend === "down" ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : null}
            <span>{trendValue}% {t("admin.analytics.vsLastWeek")}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04] text-slate-800 shrink-0 group-hover:bg-[#FFFDE6] group-hover:text-slate-950 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  </div>
);

// ─── Funnel Chart Component ───────────────────────────────────────────────────

const FunnelChart = ({ data = [] }) => {
  const maxValue = Math.max(1, ...data.map((d) => d.value || 0));

  return (
    <div className="space-y-3">
      {data.map((step, index) => {
        const width = maxValue > 0 ? ((step.value || 0) / maxValue) * 100 : 0;
        const prevValue = data[index - 1]?.value || 0;
        const conversionRate =
          index > 0 && prevValue > 0
            ? (((step.value || 0) / prevValue) * 100).toFixed(1)
            : null;

        return (
          <div key={step.label} className="relative">
            <div className="flex items-center gap-3">
              <span className="w-32 text-xs font-bold text-slate-600 text-right truncate">
                {step.label}
              </span>
              <div className="flex-1 h-10 bg-[#F8F7F3] rounded-xl overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-xl flex items-center justify-end pr-3"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-xs font-mono font-bold text-white tabular-nums">
                    {step.value.toLocaleString()}
                  </span>
                </motion.div>
              </div>
              {conversionRate && (
                <span className="w-14 text-xs font-mono font-bold text-slate-500 tabular-nums">
                  {conversionRate}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Conversion Card ──────────────────────────────────────────────────────────

const ConversionCard = ({ title, fromStep, toStep, rate, count, t }) => (
  <div className="rounded-2xl bg-white border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-700">{title}</p>
      <span className="text-xs font-mono font-bold text-slate-900 bg-[#FFFDE6] px-2 py-0.5 rounded-full border border-[#F3E600]/80 tabular-nums">
        {rate}%
      </span>
    </div>
    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
      <span>{fromStep}</span>
      <span>→</span>
      <span className="font-semibold text-slate-600">{toStep}</span>
    </div>
    <p className="text-[11px] font-mono text-slate-500 tabular-nums pt-1 border-t border-black/[0.03]">
      ~{count.toLocaleString()} {t("admin.analytics.conversions")}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAnalyticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
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
      { label: t("admin.analytics.funnelViews"), value: views, color: "#0f172a" },
      { label: t("admin.analytics.funnelDetail"), value: detailViews, color: "#334155" },
      { label: t("admin.analytics.funnelBooking"), value: bookings, color: "#475569" },
      { label: t("admin.analytics.funnelConfirm"), value: confirmed, color: "#64748b" },
      { label: t("admin.analytics.funnelComplete"), value: completed, color: "#10b981" },
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
    [stats, t],
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
      count: Math.round((stats?.places?.totalViews || 0) * 0.35 * 0.12 * 0.78),
    },
    {
      title: "Confirm → Complete",
      fromStep: t("admin.analytics.confirmToCompleteConfirm"),
      toStep: t("admin.analytics.confirmToCompleteComplete"),
      rate: 85,
      count: Math.round((stats?.places?.totalViews || 0) * 0.35 * 0.12 * 0.78 * 0.85),
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
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Báo cáo & Phân tích Nâng cao
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("admin.analytics.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("admin.analytics.subtitle")}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-44 h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
            <SelectItem value="7d">{t("admin.analytics.last7Days")}</SelectItem>
            <SelectItem value="30d">{t("admin.analytics.last30Days")}</SelectItem>
            <SelectItem value="90d">{t("admin.analytics.last90Days")}</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.analytics.totalViews")}
          value={(stats?.places?.totalViews || 0).toLocaleString()}
          subtitle={t("admin.analytics.avgPerDay", { value: ((stats?.places?.totalViews || 0) / 30).toFixed(0) })}
          icon={Eye}
          trend="up"
          trendValue={12}
          t={t}
        />
        <StatCard
          title={t("admin.analytics.totalPlaces")}
          value={stats?.places?.total || 0}
          subtitle={`${stats?.places?.approved || 0} ${t("admin.analytics.approved")}`}
          icon={MapPin}
          trend="up"
          trendValue={5}
          t={t}
        />
        <StatCard
          title={t("admin.analytics.avgRating")}
          value={stats?.places?.averageRating || 0}
          subtitle={t("admin.analytics.allPlaces")}
          icon={Star}
          t={t}
        />
        <StatCard
          title={t("admin.analytics.users")}
          value={stats?.users?.total || 0}
          subtitle={`${stats?.users?.active || 0} ${t("admin.analytics.active")}`}
          icon={Users}
          trend="up"
          trendValue={8}
          t={t}
        />
      </section>

      {/* Funnel Metrics */}
      <section className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
          <Layers className="h-4 w-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t("admin.analytics.productFunnel")}
          </h3>
        </div>
        <FunnelChart data={funnelData} />
      </section>

      {/* Conversion Rates */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {conversionRates.map((rate, i) => (
          <ConversionCard key={i} {...rate} t={t} />
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
            <Activity className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t("admin.analytics.activityOverTime")}
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.05)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  name={t("admin.analytics.chartViews")}
                  dataKey="views"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#0f172a" }}
                />
                <Line
                  type="monotone"
                  name={t("admin.analytics.chartBookings")}
                  dataKey="bookings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Place Status Distribution */}
        <div className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
            <PieChartIcon className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t("admin.analytics.placeStatusDistribution")}
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={placeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {placeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Heatmap Section */}
      <section className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.04]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Bản đồ nhiệt tương tác địa điểm
            </h3>
          </div>
          <Select value={heatmapAction} onValueChange={setHeatmapAction}>
            <SelectTrigger className="w-48 h-9 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800">
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
      <section className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
          <TrendingUp className="h-4 w-4 text-slate-800" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t("admin.analytics.topViewedPlaces")}
          </h3>
        </div>
        <div className="space-y-2">
          {(stats?.places?.topViewed || []).map((place, i) => (
            <div
              key={place.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F7F3] hover:bg-[#FAF9F5] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold tabular-nums",
                    i === 0
                      ? "bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80"
                      : i === 1
                        ? "bg-slate-200 text-slate-800"
                        : i === 2
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-400"
                  )}
                >
                  #{getTableSerialNumber(stats?.places?.topViewed?.length || 0, i)}
                </span>
                <div>
                  <p className="font-bold text-xs text-slate-900">{place.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Đánh giá: {place.averageRating ? `${Number(place.averageRating).toFixed(1)} ★` : "Chưa có"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-xs text-slate-950 tabular-nums">
                  {(place.viewCount || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">{t("admin.analytics.views")}</p>
              </div>
            </div>
          ))}
          {(!stats?.places?.topViewed || stats.places.topViewed.length === 0) && (
            <p className="text-center text-slate-400 text-xs py-8">
              {t("admin.analytics.noData")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminAnalyticsPage;
