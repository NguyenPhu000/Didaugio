import { memo, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS } from "@/constants/constants";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";
import {
  useRevenueOverview,
  useRevenueTimeline,
  useRevenueByPlace,
  useTransactions,
} from "@/hooks/queries/useRevenueQueries";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

const formatCompactVND = (value) => {
  if (!value) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

const STATUS_CONFIG = {
  [BOOKING_STATUS.COMPLETED]: {
    label: "Hoàn tất",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  [BOOKING_STATUS.PENDING]: {
    label: "Chờ xử lý",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: "Đã hủy",
    dotClass: "bg-rose-500",
    textClass: "text-rose-600 dark:text-rose-400",
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: "Đã xác nhận",
    dotClass: "bg-blue-500",
    textClass: "text-blue-600 dark:text-blue-400",
  },
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-border/80 bg-slate-950 text-white p-3 shadow-xl text-xs space-y-1 min-w-[150px]">
        <p className="font-bold text-slate-300 border-b border-white/10 pb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{item.name}:</span>
            <span className="font-bold text-white">{formatVND(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenuePage = memo(() => {
  const { t } = useTranslation();

  const DATE_RANGE_OPTIONS = [
    { value: "today", label: t("business.revenue.today") },
    { value: "7d", label: t("business.revenue.days7") },
    { value: "30d", label: t("business.revenue.days30") },
    { value: "90d", label: t("business.revenue.days90") },
  ];

  const [dateRange, setDateRange] = useState("30d");
  const [chartGroupBy, setChartGroupBy] = useState("day");

  const dateParams = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    switch (dateRange) {
      case "today":
        return { startDate: end, endDate: end };
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
      case "90d":
        start.setDate(now.getDate() - 90);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }
    return { startDate: start.toISOString().slice(0, 10), endDate: end };
  }, [dateRange]);

  const { data: overviewRes, isLoading: overviewLoading } = useRevenueOverview(dateParams);
  const { data: timelineRes, isLoading: timelineLoading } = useRevenueTimeline({
    ...dateParams,
    groupBy: chartGroupBy,
  });
  const { data: byPlaceRes, isLoading: byPlaceLoading } = useRevenueByPlace(dateParams);
  const { data: transactionsRes, isLoading: txLoading } = useTransactions({
    ...dateParams,
    page: 1,
    limit: 10,
  });

  const overview = useMemo(() => overviewRes?.data || {}, [overviewRes?.data]);
  const timeline = timelineRes?.data || [];
  const byPlace = useMemo(() => byPlaceRes?.data || [], [byPlaceRes?.data]);
  const transactions = transactionsRes?.data?.transactions || [];

  const handleExportCsv = useCallback(() => {
    const data = byPlace.map((item) => ({
      place: item.placeName,
      revenue: item.totalRevenue,
      bookings: item.bookingCount,
      avgOrder: item.avgOrderValue,
    }));

    if (data.length === 0) {
      toast.error(t("business.revenue.toastNoData"));
      return;
    }

    exportToCsv({
      columns: [
        { key: "place", label: t("business.revenue.csvPlace") },
        { key: "revenue", label: t("business.revenue.totalRevenue") },
        { key: "bookings", label: t("business.revenue.csvBookings") },
        { key: "avgOrder", label: t("business.revenue.csvAvgValue") },
      ],
      data,
      filename: slugifyFilename("bao_cao_doanh_thu"),
    });
    toast.success(t("business.revenue.toastExported"));
  }, [byPlace, t]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("business.revenue.headerTitle")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            {t("business.revenue.headerDesc")}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <ToggleGroup
            type="single"
            value={dateRange}
            onValueChange={(v) => v && setDateRange(v)}
            className="flex-1 sm:flex-initial rounded-2xl border border-slate-200 dark:border-border/80 bg-white dark:bg-card p-1 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="h-8 rounded-xl px-3 text-xs font-bold whitespace-nowrap data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground transition-all"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-2xl border-slate-200 dark:border-border/80 text-xs font-bold shadow-sm shrink-0"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
      </div>

      <FinancialSubNav activeTab="revenue" />

      {/* ── Top Bento Metric Cards (Signature Notched Corners) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Tổng Doanh Thu Gộp (GMV)"
          subtitle={t("business.revenue.gmvDescription")}
          value={overviewLoading ? "..." : formatVND(overview.gmv)}
          trendText={overview.gmvChange !== undefined && overview.gmvChange !== null ? (overview.gmvChange >= 0 ? `+${overview.gmvChange}% so kỳ trước` : `${overview.gmvChange}% so kỳ trước`) : null}
          variant="peach"
        />

        <AetherBentoCard
          title={t("business.revenue.netRevenue")}
          subtitle={t("business.revenue.netRevenueDescription")}
          value={overviewLoading ? "..." : formatVND(overview.netRevenue)}
          trendText={overview.netRevenueChange !== undefined && overview.netRevenueChange !== null ? (overview.netRevenueChange >= 0 ? `+${overview.netRevenueChange}% so kỳ trước` : `${overview.netRevenueChange}% so kỳ trước`) : null}
          variant="blue"
        />

        <AetherBentoCard
          title={t("business.revenue.platformFees")}
          subtitle={t("business.revenue.platformFeesDescription")}
          value={overviewLoading ? "..." : formatVND(overview.platformFees)}
          trendText={overview.platformFeesChange !== undefined && overview.platformFeesChange !== null ? (overview.platformFeesChange >= 0 ? `+${overview.platformFeesChange}%` : `${overview.platformFeesChange}%`) : null}
          variant="gray"
        />

        <AetherBentoCard
          title={t("business.revenue.refund")}
          subtitle={t("business.revenue.refundDescription")}
          value={overviewLoading ? "..." : formatVND(overview.refundAmount)}
          trendText={overview.refundAmountChange !== undefined && overview.refundAmountChange !== null ? (overview.refundAmountChange >= 0 ? `+${overview.refundAmountChange}%` : `${overview.refundAmountChange}%`) : null}
          variant="rose"
        />
      </div>

      {/* ── Main Area Chart: Diễn Biến Doanh Thu Theo Thời Gian ── */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {t("business.revenue.chartTitle")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Diễn biến chi tiết doanh thu gộp và thực nhận theo chu kỳ đã chọn
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={chartGroupBy}
            onValueChange={(v) => v && setChartGroupBy(v)}
            className="rounded-xl border border-slate-200/80 dark:border-border/80 bg-slate-50 dark:bg-muted p-0.5 self-start"
          >
            <ToggleGroupItem
              value="day"
              className="h-7 rounded-lg px-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-card dark:data-[state=active]:text-white"
            >
              {t("business.revenue.groupByDay")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              className="h-7 rounded-lg px-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-card dark:data-[state=active]:text-white"
            >
              {t("business.revenue.groupByWeek")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="month"
              className="h-7 rounded-lg px-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-card dark:data-[state=active]:text-white"
            >
              {t("business.revenue.groupByMonth")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {timelineLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : timeline.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
            {t("business.revenue.noTimelineData")}
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="revNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactVND} tick={{ fontSize: 11, fill: "#64748B" }} />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  name={t("business.revenue.grossRevenueLabel")}
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGross)"
                />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  name={t("business.revenue.netRevenueLabel")}
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Bottom Grid: Revenue by Place & Transactions Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Place (1/3 width) */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("business.revenue.byPlaceTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Phân bổ doanh thu theo từng địa điểm kinh doanh
            </p>
          </div>

          {byPlaceLoading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : byPlace.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t("business.revenue.noPlaceData")}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {byPlace.map((item) => (
                <div
                  key={item.placeId || item.placeName}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-muted/40 border border-slate-100 dark:border-border/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[160px]">
                      {item.placeName}
                    </span>
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatVND(item.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.bookingCount} lượt đặt</span>
                    <span>Đơn TB: {formatVND(item.avgOrderValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transactions Table (2/3 width) */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("business.revenue.txTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Nhật ký giao dịch tài chính gần nhất
            </p>
          </div>

          <div className="overflow-x-auto">
            {txLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Đang tải dữ liệu giao dịch...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {t("business.revenue.noTransactions")}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-muted-foreground text-left border-b border-slate-100 dark:border-border/60">
                    <th className="pb-3 font-semibold">Mã GD</th>
                    <th className="pb-3 font-semibold">{t("business.revenue.txColPlace")}</th>
                    <th className="pb-3 font-semibold">{t("business.revenue.txColDate")}</th>
                    <th className="pb-3 font-semibold">{t("business.revenue.txColAmount")}</th>
                    <th className="pb-3 font-semibold text-right">{t("business.revenue.txColStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border/40 font-medium">
                  {transactions.map((tx) => {
                    const status = STATUS_CONFIG[tx.status] || {
                      label: tx.status,
                      dotClass: "bg-slate-400",
                      textClass: "text-slate-500",
                    };
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 font-mono text-slate-500">#{tx.id}</td>
                        <td className="py-3.5 font-bold text-slate-900 dark:text-foreground">
                          {tx.placeName || "Dịch vụ"}
                        </td>
                        <td className="py-3.5 text-slate-500">
                          {tx.date ? tx.date.slice(0, 10) : "N/A"}
                        </td>
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {formatVND(tx.amount)}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className={cn("inline-flex items-center gap-1.5 font-bold", status.textClass)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

RevenuePage.displayName = "RevenuePage";

export default RevenuePage;
