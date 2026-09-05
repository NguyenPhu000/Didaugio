import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { dashboardService } from "@/apis/dashboardService";
import {
  Activity,
  Users,
  MapPin,
  CalendarCheck,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react";

const METRIC_TABS = [
  { id: "overview", label: "Tổng quan", icon: Layers },
  { id: "users", label: "Người dùng & Phiên", icon: Users },
  { id: "system", label: "Nhật ký hệ thống", icon: Activity },
  { id: "content", label: "Địa điểm & Đặt chỗ", icon: MapPin },
];

const METRIC_CONFIG = {
  activities: {
    label: "Thao tác hệ thống",
    color: "#0F172A",
    gradientId: "fillActivities",
  },
  logins: {
    label: "Phiên đăng nhập",
    color: "#3B82F6",
    gradientId: "fillLogins",
  },
  places: {
    label: "Địa điểm mới",
    color: "#10B981",
    gradientId: "fillPlaces",
  },
  users: {
    label: "Người dùng mới",
    color: "#8B5CF6",
    gradientId: "fillUsers",
  },
  bookings: {
    label: "Lượt đặt chỗ",
    color: "#F97316",
    gradientId: "fillBookings",
  },
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const formattedDate = label
      ? new Date(label).toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    return (
      <div className="rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-xl backdrop-blur-md text-xs min-w-[200px]">
        <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border/60">
          {formattedDate}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => {
            const config = METRIC_CONFIG[entry.dataKey] || {
              label: entry.name,
              color: entry.color,
            };
            return (
              <div
                key={`tooltip-item-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-muted-foreground font-medium">
                    {config.label}
                  </span>
                </div>
                <span className="font-bold text-foreground">
                  {Number(entry.value).toLocaleString("vi-VN")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function ChartAreaInteractive() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysCount = useMemo(() => {
    if (timeRange === "7d") return 7;
    if (timeRange === "90d") return 90;
    return 30;
  }, [timeRange]);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getTimeline({ days: daysCount });
      const payload = res?.success === true && res?.data != null ? res.data : res;

      if (Array.isArray(payload) && payload.length > 0) {
        setChartData(
          payload.map((item) => ({
            date: item.date || item.label,
            activities: Number(item.activities) || 0,
            logins: Number(item.logins) || 0,
            places: Number(item.places) || 0,
            users: Number(item.users) || 0,
            bookings: Number(item.bookings) || 0,
          }))
        );
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("[Dashboard] Failed to load timeline data:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [daysCount]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Aggregate KPI metrics across the active timeline
  const summaryKpis = useMemo(() => {
    if (!chartData.length) {
      return {
        totalActivities: 0,
        totalLogins: 0,
        totalPlaces: 0,
        totalBookings: 0,
        avgActivitiesPerDay: 0,
      };
    }

    const totalActivities = chartData.reduce((acc, curr) => acc + curr.activities, 0);
    const totalLogins = chartData.reduce((acc, curr) => acc + curr.logins, 0);
    const totalPlaces = chartData.reduce((acc, curr) => acc + curr.places, 0);
    const totalBookings = chartData.reduce((acc, curr) => acc + curr.bookings, 0);
    const avgActivitiesPerDay = (totalActivities / chartData.length).toFixed(1);

    return {
      totalActivities,
      totalLogins,
      totalPlaces,
      totalBookings,
      avgActivitiesPerDay,
    };
  }, [chartData]);

  return (
    <Card className="overflow-hidden border border-border/80 shadow-sm bg-card">
      <CardHeader className="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-black dark:text-white" />
              Biểu đồ hoạt động & Tương tác
            </CardTitle>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[11px] font-semibold border-black/30 dark:border-white/30 text-black dark:text-white bg-black/5 dark:bg-white/10"
            >
              Real-time
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Theo dõi xu hướng người dùng, lượt đăng nhập, thao tác hệ thống và nội dung
          </CardDescription>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          {/* Time range toggle */}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="7d" className="text-xs px-3">
              7 ngày
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-xs px-3">
              30 ngày
            </ToggleGroupItem>
            <ToggleGroupItem value="90d" className="text-xs px-3">
              90 ngày
            </ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 sm:hidden text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày</SelectItem>
              <SelectItem value="30d">30 ngày</SelectItem>
              <SelectItem value="90d">90 ngày</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-muted/20 border-b border-border/40 text-xs">
        <div className="space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-black dark:bg-white" />
            Thao tác hệ thống
          </p>
          <p className="text-lg font-bold text-foreground">
            {summaryKpis.totalActivities.toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            Phiên đăng nhập
          </p>
          <p className="text-lg font-bold text-foreground">
            {summaryKpis.totalLogins.toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            Địa điểm mới
          </p>
          <p className="text-lg font-bold text-foreground">
            {summaryKpis.totalPlaces.toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
            Lượt đặt chỗ
          </p>
          <p className="text-lg font-bold text-foreground">
            {summaryKpis.totalBookings.toLocaleString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Metric Filter Tabs */}
      <div className="px-4 sm:px-6 pt-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-muted-foreground mr-1">Chế độ xem:</span>
        {METRIC_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedMetric === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMetric(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-4">
        {loading ? (
          <div className="h-[280px] w-full animate-pulse rounded-lg bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
            Đang tải dữ liệu hoạt động...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-2 text-muted-foreground/50" />
            <p className="font-semibold text-sm text-foreground">Chưa có đủ dữ liệu hoạt động</p>
            <p className="text-xs mt-1">Các thao tác trên hệ thống sẽ tự động tổng hợp biểu đồ theo thời gian thực.</p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillActivities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillPlaces" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return d.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
                      day: "numeric",
                      month: "numeric",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  formatter={(value) => {
                    const config = METRIC_CONFIG[value] || { label: value };
                    return <span className="text-xs text-foreground font-medium">{config.label}</span>;
                  }}
                />

                {(selectedMetric === "overview" || selectedMetric === "system") && (
                  <Area
                    type="monotone"
                    dataKey="activities"
                    name="activities"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    fill="url(#fillActivities)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}

                {(selectedMetric === "overview" || selectedMetric === "users") && (
                  <Area
                    type="monotone"
                    dataKey="logins"
                    name="logins"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#fillLogins)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}

                {(selectedMetric === "overview" || selectedMetric === "content") && (
                  <Area
                    type="monotone"
                    dataKey="places"
                    name="places"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#fillPlaces)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}

                {selectedMetric === "users" && (
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="users"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#fillUsers)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}

                {selectedMetric === "content" && (
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="bookings"
                    stroke="#F97316"
                    strokeWidth={2}
                    fill="url(#fillBookings)"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
