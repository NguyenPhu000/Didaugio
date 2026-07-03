import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { dashboardService } from "@/apis/dashboardService";
import "@/lib/chartSetup";
import { motion } from "motion/react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  CalendarCheck,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  PieChart,
  Activity,
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTableSerialNumber } from "@/utils/tableSerial";

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, className, t }) => (
  <Card className={cn("relative overflow-hidden", className)}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trendValue !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground"
            )}>
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : trend === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              <span>{trendValue}% {t("admin.analytics.vsLastWeek")}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// ─── Funnel Chart Component ───────────────────────────────────────────────────

const FunnelChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-2">
      {data.map((step, index) => {
        const width = (step.value / maxValue) * 100;
        const conversionRate = index > 0
          ? ((step.value / data[index - 1].value) * 100).toFixed(1)
          : null;

        return (
          <div key={step.label} className="relative">
            <div className="flex items-center gap-3">
              <span className="w-32 text-xs font-medium text-muted-foreground text-right">
                {step.label}
              </span>
              <div className="flex-1 h-10 bg-muted/30 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-lg flex items-center justify-end pr-3"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-xs font-bold text-white">
                    {step.value.toLocaleString()}
                  </span>
                </motion.div>
              </div>
              {conversionRate && (
                <span className="w-14 text-xs font-medium text-muted-foreground">
                  {conversionRate}%
                </span>
              )}
            </div>
            {index < data.length - 1 && (
              <div className="ml-[calc(8rem+12px)] mt-1">
                <ArrowDownRight className="h-3 w-3 text-muted-foreground/50" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Conversion Rate Card ───────────────────────────────────────────────────────

const ConversionCard = ({ title, fromStep, toStep, rate, count, t }) => (
  <Card className="bg-gradient-to-br from-primary/5 to-transparent">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{rate}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {fromStep} → {toStep}
          </p>
          <p className="text-sm font-semibold">{count} {t("admin.analytics.orders")}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Product Analytics Chart Config ────────────────────────────────────────────

const getProductFunnelData = (stats, t) => [
  { label: t("admin.analytics.funnelViews"), value: stats?.totalViews || 0, color: "#3b82f6" },
  { label: t("admin.analytics.funnelDetails"), value: Math.round((stats?.totalViews || 0) * 0.35), color: "#8b5cf6" },
  { label: t("admin.analytics.funnelBookings"), value: stats?.totalBookings || 0, color: "#f59e0b" },
  { label: t("admin.analytics.funnelConfirmed"), value: Math.round((stats?.totalBookings || 0) * 0.78), color: "#10b981" },
  { label: t("admin.analytics.funnelCompleted"), value: Math.round((stats?.totalBookings || 0) * 0.65), color: "#06b6d4" },
];

const getActivityChartConfig = (data, t) => ({
  labels: data?.map(d => d.date) || [],
  datasets: [
    {
      label: t("admin.analytics.chartViews"),
      data: data?.map(d => d.views) || [],
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    },
    {
      label: t("admin.analytics.chartBookings"),
      data: data?.map(d => d.bookings) || [],
      borderColor: "#10b981",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      fill: true,
      tension: 0.4,
    },
  ],
});

const activityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: { usePointStyle: true, padding: 20 },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: "rgba(0,0,0,0.05)" },
    },
    x: {
      grid: { display: false },
    },
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminAnalyticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState(null);
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsRes, timelineRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getTimeline(),
        ]);

        if (statsRes?.success) {
          setStats(statsRes.data);
        }
        if (timelineRes?.success) {
          setActivityData(timelineRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [timeRange]);

  const funnelData = getProductFunnelData(stats, t);
  const activityConfig = getActivityChartConfig(activityData, t);

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
      <div className="p-8 min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.analytics.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("admin.analytics.subtitle")}
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t("admin.analytics.last7Days")}</SelectItem>
              <SelectItem value="30d">{t("admin.analytics.last30Days")}</SelectItem>
              <SelectItem value="90d">{t("admin.analytics.last90Days")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>

        {/* Funnel Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t("admin.analytics.productFunnel")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {conversionRates.map((rate, i) => (
            <ConversionCard key={i} {...rate} t={t} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t("admin.analytics.activityOverTime")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <Line data={activityConfig} options={activityChartOptions} />
            </CardContent>
          </Card>

          {/* Place Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {t("admin.analytics.placeStatusDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <Doughnut
                data={{
                  labels: [t("admin.analytics.statusApproved"), t("admin.analytics.statusPending"), t("admin.analytics.statusRejected"), t("admin.analytics.statusHidden")],
                  datasets: [{
                    data: [
                      stats?.places?.approved || 0,
                      stats?.places?.pending || 0,
                      stats?.places?.rejected || 0,
                      stats?.places?.hidden || 0,
                    ],
                    backgroundColor: [
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                      "#6b7280",
                    ],
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { usePointStyle: true, padding: 20 },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("admin.analytics.topViewedPlaces")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats?.places?.topViewed || []).map((place, i) => (
                <div
                  key={place.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-700" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {getTableSerialNumber(stats?.places?.topViewed?.length || 0, i)}
                    </span>
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rating: {place.averageRating || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(place.viewCount || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t("admin.analytics.views")}</p>
                  </div>
                </div>
              ))}
              {(!stats?.places?.topViewed || stats.places.topViewed.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  {t("admin.analytics.noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
