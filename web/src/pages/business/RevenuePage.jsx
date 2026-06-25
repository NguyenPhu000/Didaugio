import { memo, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
} from "lucide-react";
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
import {
  BusinessPageHeader,
  BusinessStatCard,
  BusinessStatCardSkeleton,
  BusinessSectionCard,
  BusinessSectionCardSkeleton,
} from "@/components/business/ui";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const formatCompactVND = (value) => {
  if (!value) return "0";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
};

const RevenuePage = memo(() => {
  const { t } = useTranslation();

  const DATE_RANGE_OPTIONS = [
    { value: "today", label: t("business.revenue.today") },
    { value: "7d", label: t("business.revenue.days7") },
    { value: "30d", label: t("business.revenue.days30") },
    { value: "90d", label: t("business.revenue.days90") },
  ];

  const CHART_CONFIG = {
    grossRevenue: {
      label: t("business.revenue.grossRevenueLabel"),
      color: "hsl(var(--chart-1))",
    },
    netRevenue: {
      label: t("business.revenue.netRevenueLabel"),
      color: "hsl(var(--chart-2))",
    },
  };

  const STATUS_BADGE_MAP = {
    [BOOKING_STATUS.COMPLETED]: {
      label: t("business.revenue.completed"),
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    [BOOKING_STATUS.PENDING]: {
      label: t("business.revenue.pendingProcessing"),
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    [BOOKING_STATUS.CANCELLED]: {
      label: t("business.revenue.cancelled"),
      className: "bg-rose-50 text-rose-700 border-rose-200",
    },
    [BOOKING_STATUS.CONFIRMED]: {
      label: t("business.revenue.confirmed"),
      className: "bg-blue-50 text-700 border-blue-200",
    },
  };
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

  const overview = overviewRes?.data || {};
  const timeline = timelineRes?.data || [];
  const byPlace = byPlaceRes?.data || [];
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
  }, [byPlace]);

  const metricCards = useMemo(() => [
    {
      title: "GMV",
      value: formatVND(overview.gmv),
      icon: DollarSign,
      iconColor: "blue",
      trend: overview.gmvChange,
      description: t("business.revenue.gmvDescription"),
    },
    {
      title: t("business.revenue.netRevenue"),
      value: formatVND(overview.netRevenue),
      icon: TrendingUp,
      iconColor: "emerald",
      trend: overview.netRevenueChange,
      description: t("business.revenue.netRevenueDescription"),
    },
    {
      title: t("business.revenue.platformFees"),
      value: formatVND(overview.platformFees),
      icon: CreditCard,
      iconColor: "amber",
      trend: overview.platformFeesChange,
      description: t("business.revenue.platformFeesDescription"),
    },
    {
      title: t("business.revenue.refund"),
      value: formatVND(overview.refundAmount),
      icon: RefreshCw,
      iconColor: "rose",
      trend: overview.refundAmountChange,
      description: t("business.revenue.refundDescription"),
    },
  ], [overview]);

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6 lg:p-8">
      {/* Header */}
      <BusinessPageHeader
        title={t("business.revenue.headerTitle")}
        description={t("business.revenue.headerDesc")}
        action={
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={dateRange}
              onValueChange={(v) => v && setDateRange(v)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-8 rounded-md px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewLoading
          ? Array.from({ length: 4 }).map((_, i) => <BusinessStatCardSkeleton key={i} />)
          : metricCards.map((card) => (
              <BusinessStatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconColor={card.iconColor}
                trend={card.trend}
                description={card.description}
              />
            ))}
      </div>

      {/* Revenue Chart */}
      <BusinessSectionCard
        title={t("business.revenue.chartTitle")}
        titleIcon={BarChart3}
        action={
          <ToggleGroup
            type="single"
            value={chartGroupBy}
            onValueChange={(v) => v && setChartGroupBy(v)}
            className="rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <ToggleGroupItem
              value="day"
              className="h-7 rounded-sm px-2.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              {t("business.revenue.groupByDay")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              className="h-7 rounded-sm px-2.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              {t("business.revenue.groupByWeek")}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="month"
              className="h-7 rounded-sm px-2.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800"
            >
              {t("business.revenue.groupByMonth")}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {timelineLoading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : timeline.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            {t("business.revenue.noTimelineData")}
          </div>
        ) : (
          <ChartContainer config={CHART_CONFIG} className="h-[350px] w-full">
            <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactVND}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatVND(value),
                      CHART_CONFIG[name]?.label || name,
                    ]}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="grossRevenue"
                stroke="var(--color-grossRevenue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="netRevenue"
                stroke="var(--color-netRevenue)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </BusinessSectionCard>

      {/* Revenue Breakdown by Place */}
      <BusinessSectionCard title={t("business.revenue.revenueByPlace")} titleIcon={BarChart3}>
        {byPlaceLoading ? (
          <BusinessSectionCardSkeleton rows={5} />
        ) : byPlace.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("business.revenue.noDataByPlace")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("business.revenue.csvPlace")}</TableHead>
                    <TableHead className="text-right">{t("business.revenue.totalRevenue")}</TableHead>
                    <TableHead className="text-right">{t("business.revenue.csvBookings")}</TableHead>
                    <TableHead className="text-right">{t("business.revenue.csvAvgValue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPlace.map((item) => (
                    <TableRow key={item.placeId}>
                      <TableCell className="font-medium">{item.placeName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatVND(item.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right">{item.bookingCount}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatVND(item.avgOrderValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border/50">
              {byPlace.map((item) => (
                <div key={item.placeId} className="p-4 space-y-2">
                  <p className="font-medium text-sm">{item.placeName}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t("business.revenue.revenueLabel")}</p>
                      <p className="font-mono font-semibold">{formatVND(item.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("business.revenue.bookingLabel")}</p>
                      <p className="font-semibold">{item.bookingCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("business.revenue.avgLabel")}</p>
                      <p className="font-mono font-semibold">{formatVND(item.avgOrderValue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </BusinessSectionCard>

      {/* Recent Transactions */}
      <BusinessSectionCard
        title={t("business.revenue.recentTransactions")}
        titleIcon={Clock}
        action={
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <a href="/business/transactions">{t("business.revenue.viewAll")}</a>
          </Button>
        }
      >
        {txLoading ? (
          <BusinessSectionCardSkeleton rows={5} />
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("business.revenue.noTransactions")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("business.schedule.date")}</TableHead>
                    <TableHead>{t("business.revenue.csvPlace")}</TableHead>
                    <TableHead className="text-right">{t("business.revenue.amount")}</TableHead>
                    <TableHead className="text-right">{t("business.revenue.systemCommission")}</TableHead>
                    <TableHead>{t("business.revenue.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const statusInfo = STATUS_BADGE_MAP[tx.status] || {
                      label: tx.status,
                      className: "bg-zinc-50 text-zinc-700 border-zinc-200",
                    };
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="font-medium">{tx.placeName}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatVND(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatVND(tx.commission)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border/50">
              {transactions.map((tx) => {
                const statusInfo = STATUS_BADGE_MAP[tx.status] || {
                  label: tx.status,
                  className: "bg-zinc-50 text-zinc-700 border-zinc-200",
                };
                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px]", statusInfo.className)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{tx.placeName}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-semibold">{formatVND(tx.amount)}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("business.revenue.commissionLabel")}: {formatVND(tx.commission)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </BusinessSectionCard>
    </div>
  );
});

RevenuePage.displayName = "RevenuePage";

export default RevenuePage;
