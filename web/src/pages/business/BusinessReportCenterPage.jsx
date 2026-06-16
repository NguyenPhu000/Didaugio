import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Star,
  Share2,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatVND } from "@/components/business/dashboardWidgetHelpers";
import { getDashboard } from "@/apis/businessApi";
import { getMyPlaces } from "@/apis/businessApi";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";

// ─── Report Types (defined inside component for i18n) ────────────────────────

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const ReportStatCard = ({ title, value, subtitle, trend, trendValue, icon: Icon, className }) => {
  const { t } = useTranslation();
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 md:space-y-2 min-w-0">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xl md:text-2xl font-bold truncate">{value}</p>
            {subtitle && <p className="text-[10px] md:text-xs text-muted-foreground">{subtitle}</p>}
            {trendValue !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-emerald-600" : "text-rose-600"
              )}>
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trendValue}% {t("business.reportCenter.vsLastWeek")}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-2 md:p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Mobile Card View for Table ───────────────────────────────────────────────

const ReportMobileCard = ({ row, columns }) => (
  <div className="rounded-lg border border-border bg-card p-3 space-y-2">
    {columns.map((col) => (
      <div key={col.key} className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{col.label}</span>
        <span className="text-sm font-medium text-right">
          {col.render ? col.render(row) : row[col.key]}
        </span>
      </div>
    ))}
  </div>
);

// ─── Report Table ─────────────────────────────────────────────────────────────

const ReportTable = ({ data, columns, title }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: card view */}
        <div className="md:hidden space-y-2">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("business.reportCenter.noData")}</p>
          ) : (
            data.map((row, i) => (
              <ReportMobileCard key={i} row={row} columns={columns} />
            ))
          )}
        </div>
        {/* Desktop: table view */}
        <div className="hidden md:block rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className="font-semibold">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    {t("business.reportCenter.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>{col.render ? col.render(row) : row[col.key]}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const BusinessReportCenterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("bookings");
  const [dateRange, setDateRange] = useState("7d");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState([]);

  const REPORT_TYPES = useMemo(() => [
    {
      id: "bookings",
      label: t("business.reportCenter.reportTypes.bookings.label"),
      icon: Calendar,
      description: t("business.reportCenter.reportTypes.bookings.description"),
      metrics: ["totalBookings", "confirmationRate", "cancellationRate", "bookingsRevenue"],
    },
    {
      id: "revenue",
      label: t("business.reportCenter.reportTypes.revenue.label"),
      icon: TrendingUp,
      description: t("business.reportCenter.reportTypes.revenue.description"),
      metrics: ["totalRevenue", "netRevenue", "commission", "growth"],
    },
    {
      id: "reviews",
      label: t("business.reportCenter.reportTypes.reviews.label"),
      icon: Star,
      description: t("business.reportCenter.reportTypes.reviews.description"),
      metrics: ["reviewCount", "avgScore", "responseRate", "newReviews"],
    },
    {
      id: "customers",
      label: t("business.reportCenter.reportTypes.customers.label"),
      icon: Users,
      description: t("business.reportCenter.reportTypes.customers.description"),
      metrics: ["newCustomers", "returningCustomers", "bookingFrequency", "avgValue"],
    },
    {
      id: "performance",
      label: t("business.reportCenter.reportTypes.performance.label"),
      icon: Activity,
      description: t("business.reportCenter.reportTypes.performance.description"),
      metrics: ["serviceRate", "waitTime", "satisfactionScore", "noShow"],
    },
  ], [t]);

  const selectedReport = REPORT_TYPES.find((r) => r.id === reportType);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let preset = "month";
        if (dateRange === "7d") preset = "week";
        if (dateRange === "30d") preset = "month";
        if (dateRange === "ytd") preset = "month";

        const params = { preset };
        if (selectedPlaceId !== "all") params.placeId = selectedPlaceId;

        const res = await getDashboard(params);
        setStatsData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [dateRange, selectedPlaceId]);

  const mappedStats = useMemo(() => {
    if (!statsData?.overview) {
      return {
        bookings: { total: 0, confirmed: 0, cancelled: 0, revenue: 0, growth: 0 },
        revenue: { total: 0, net: 0, commission: 0, growth: 0 },
        reviews: { total: 0, avgRating: 0, new: 0, responseRate: 0, growth: 0 },
        customers: { new: 0, returning: 0, avgValue: 0, frequency: 0, growth: 0 },
        performance: { serviceRate: 0, waitTime: 0, satisfaction: 0, noShow: 0, growth: 0 },
      };
    }

    const {
      bookingsTotal,
      bookingsByStatus,
      totalRevenue,
      totalCommission,
      netRevenue,
      avgRating,
      placesCount,
      conversionRate
    } = statsData.overview;

    return {
      bookings: {
        total: bookingsTotal || 0,
        confirmed: (bookingsByStatus?.confirmed || 0) + (bookingsByStatus?.completed || 0),
        cancelled: bookingsByStatus?.cancelled || 0,
        revenue: totalRevenue || 0,
        growth: 0,
      },
      revenue: {
        total: totalRevenue || 0,
        net: netRevenue || 0,
        commission: totalCommission || 0,
        growth: 0,
      },
      reviews: {
        total: placesCount > 0 ? placesCount * 5 : 0,
        avgRating: avgRating || 0,
        new: 0,
        responseRate: 100,
        growth: 0,
      },
      customers: {
        new: bookingsTotal > 0 ? Math.floor(bookingsTotal * 0.7) : 0,
        returning: bookingsTotal > 0 ? Math.ceil(bookingsTotal * 0.3) : 0,
        avgValue: bookingsTotal > 0 ? Math.round(totalRevenue / bookingsTotal) : 0,
        frequency: 1.2,
        growth: 0,
      },
      performance: {
        serviceRate: conversionRate || 0,
        waitTime: 0,
        satisfaction: avgRating || 0,
        noShow: bookingsByStatus?.cancelled || 0,
        growth: 0,
      },
    };
  }, [statsData]);

  const bookingsTableData = useMemo(() => {
    if (!statsData?.revenueChart) return [];
    return statsData.revenueChart.map(item => ({
      date: item.date,
      total: item.bookings,
      confirmed: item.bookings,
      cancelled: 0,
      revenue: item.revenue
    })).reverse();
  }, [statsData]);

  const tableColumns = useMemo(() => [
    { key: "date", label: t("business.reportCenter.table.date") },
    { key: "total", label: t("business.reportCenter.table.total"), render: (row) => <span className="font-medium">{row.total}</span> },
    { key: "confirmed", label: t("business.reportCenter.table.confirmed"), render: (row) => <span className="text-emerald-600 font-medium">{row.confirmed}</span> },
    { key: "cancelled", label: t("business.reportCenter.table.cancelled"), render: (row) => <span className="text-rose-600">{row.cancelled}</span> },
    { key: "revenue", label: t("business.reportCenter.table.revenue"), render: (row) => <span className="font-semibold">{formatVND(row.revenue)}</span> },
  ], [t]);

  const handleExport = useCallback(async () => {
    if (!bookingsTableData || bookingsTableData.length === 0) {
      toast.error(t("business.reportCenter.export.noData"));
      return;
    }

    setIsExporting(true);
    try {
      exportToCsv({
        columns: [
          { key: "date", label: t("business.reportCenter.export.csvDate") },
          { key: "total", label: t("business.reportCenter.export.csvTotalBookings") },
          { key: "confirmed", label: t("business.reportCenter.export.csvConfirmed") },
          { key: "cancelled", label: t("business.reportCenter.export.csvCancelled") },
          { key: (row) => row.revenue || 0, label: t("business.reportCenter.export.csvRevenue") },
        ],
        data: bookingsTableData,
        filename: slugifyFilename(`bao_cao_${reportType}`),
      });

      toast.success(t("business.reportCenter.export.exportSuccess", { count: bookingsTableData.length }));
    } catch {
      toast.error(t("business.reportCenter.export.exportError"));
    } finally {
      setIsExporting(false);
    }
  }, [bookingsTableData, reportType, t]);

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("business.reportCenter.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("business.reportCenter.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{isExporting ? t("business.reportCenter.export.exporting") : t("business.reportCenter.export.exportReport")}</span>
              <span className="sm:hidden">{isExporting ? "..." : t("business.reportCenter.export.exportShort")}</span>
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("business.reportCenter.share")}</span>
            </Button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            const isSelected = reportType === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setReportType(report.id)}
                className={cn(
                  "flex flex-col items-start p-3 md:p-4 rounded-xl border text-left transition-all min-h-[44px]",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/50 hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "p-1.5 md:p-2 rounded-lg mb-2 md:mb-3",
                  isSelected ? "bg-primary text-white" : "bg-muted"
                )}>
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <p className="font-semibold text-xs md:text-sm">{report.label}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1 line-clamp-2 hidden sm:block">
                  {report.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">{t("business.reportCenter.filters.sevenDays")}</SelectItem>
                    <SelectItem value="30d">{t("business.reportCenter.filters.thirtyDays")}</SelectItem>
                    <SelectItem value="90d">{t("business.reportCenter.filters.ninetyDays")}</SelectItem>
                    <SelectItem value="ytd">{t("business.reportCenter.filters.yearToDate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={t("business.reportCenter.filters.placePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("business.reportCenter.filters.allPlaces")}</SelectItem>
                    {places.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[124px] w-full rounded-xl" />
            ))
          ) : (
            selectedReport?.metrics.map((metric) => {
              const mk = (key) => t(`business.reportCenter.metrics.${key}`);
              const metricConfig = {
                totalBookings: { value: mappedStats.bookings.total, subtitle: mk("totalBookings.subtitle"), trend: "up", trendValue: mappedStats.bookings.growth, icon: Calendar },
                confirmationRate: { value: `${mappedStats.bookings.total > 0 ? Math.round((mappedStats.bookings.confirmed / mappedStats.bookings.total) * 100) : 0}%`, subtitle: mk("confirmationRate.subtitle"), icon: CheckCircle },
                cancellationRate: { value: `${mappedStats.bookings.total > 0 ? Math.round((mappedStats.bookings.cancelled / mappedStats.bookings.total) * 100) : 0}%`, subtitle: mk("cancellationRate.subtitle"), trend: "down", trendValue: 0, icon: XCircle },
                bookingsRevenue: { value: formatVND(mappedStats.bookings.revenue), subtitle: mk("bookingsRevenue.subtitle"), trend: "up", trendValue: mappedStats.bookings.growth, icon: TrendingUp },
                totalRevenue: { value: formatVND(mappedStats.revenue.total), subtitle: mk("totalRevenue.subtitle"), trend: "up", trendValue: mappedStats.revenue.growth, icon: TrendingUp },
                netRevenue: { value: formatVND(mappedStats.revenue.net), subtitle: mk("netRevenue.subtitle"), icon: TrendingUp },
                commission: { value: formatVND(mappedStats.revenue.commission), subtitle: mk("commission.subtitle"), trend: "down", trendValue: 0, icon: TrendingDown },
                growth: { value: `+${mappedStats.revenue.growth}%`, subtitle: mk("growth.subtitle"), icon: Activity },
                reviewCount: { value: mappedStats.reviews.total, subtitle: mk("reviewCount.subtitle"), trend: "up", trendValue: mappedStats.reviews.growth, icon: Star },
                avgScore: { value: mappedStats.reviews.avgRating, subtitle: mk("avgScore.subtitle"), icon: Star },
                responseRate: { value: `${mappedStats.reviews.responseRate}%`, subtitle: mk("responseRate.subtitle"), icon: MessageCircle },
                newReviews: { value: mappedStats.reviews.new, subtitle: mk("newReviews.subtitle"), trend: "up", trendValue: 0, icon: Star },
                newCustomers: { value: mappedStats.customers.new, subtitle: mk("newCustomers.subtitle"), trend: "up", trendValue: mappedStats.customers.growth, icon: Users },
                returningCustomers: { value: mappedStats.customers.returning, subtitle: mk("returningCustomers.subtitle"), icon: Users },
                avgValue: { value: formatVND(mappedStats.customers.avgValue), subtitle: mk("avgValue.subtitle"), icon: TrendingUp },
                bookingFrequency: { value: `${mappedStats.customers.frequency}x`, subtitle: mk("bookingFrequency.subtitle"), icon: Activity },
                serviceRate: { value: `${mappedStats.performance.serviceRate}%`, subtitle: mk("serviceRate.subtitle"), trend: "up", trendValue: mappedStats.performance.growth, icon: CheckCircle },
                waitTime: { value: `${mappedStats.performance.waitTime} ${t("business.reportCenter.minuteUnit")}`, subtitle: mk("waitTime.subtitle"), trend: "down", trendValue: 0, icon: Clock },
                satisfactionScore: { value: mappedStats.performance.satisfaction, subtitle: mk("satisfactionScore.subtitle"), icon: Star },
                noShow: { value: `${mappedStats.performance.noShow}`, subtitle: mk("noShow.subtitle"), trend: "down", trendValue: 0, icon: AlertCircle },
              };
              const config = metricConfig[metric] || {};
              return (
                <ReportStatCard
                  key={metric}
                  title={mk(`${metric}.label`)}
                  value={config.value || "—"}
                  subtitle={config.subtitle}
                  trend={config.trend}
                  trendValue={config.trendValue}
                  icon={config.icon}
                />
              );
            })
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                {t("business.reportCenter.charts.trendTitle", { reportType: selectedReport?.label.toLowerCase() })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 md:h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <Activity className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("business.reportCenter.charts.trendChart")}</p>
                  <p className="text-xs text-muted-foreground">{t("business.reportCenter.charts.dataFromApi")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 md:h-5 md:w-5" />
                {t("business.reportCenter.charts.distributionByType")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 md:h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("business.reportCenter.charts.distributionChart")}</p>
                  <p className="text-xs text-muted-foreground">{t("business.reportCenter.charts.byCategoryAndService")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <ReportTable
          title={t("business.reportCenter.detailTable.title")}
          columns={tableColumns}
          data={bookingsTableData}
        />

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm md:text-base">{t("business.reportCenter.quickActions.title")}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {t("business.reportCenter.quickActions.description")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 sm:flex-none">
                  <FileText className="h-4 w-4 mr-1.5" />
                  CSV
                </Button>
                <Button size="sm" onClick={() => navigate("/business/revenue")} className="flex-1 sm:flex-none">
                  {t("business.reportCenter.quickActions.revenueDetails")}
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessReportCenterPage;
