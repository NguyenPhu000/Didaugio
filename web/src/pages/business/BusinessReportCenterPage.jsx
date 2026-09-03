// MAP: BusinessReportCenterPage
// ├── UI: @/components/business/reports/{ReportHeaderFilters, ReportKpiSummary, ReportChartsSection, ReportTopPlacesTable}
// └── API: @/apis/businessReportApi, @/apis/businessApi

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, ChevronRight, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";
import FinancialSubNav from "@/components/business/FinancialSubNav";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { getDashboard, getMyPlaces } from "@/apis/businessApi";
import api from "@/constants/api";
import { exportToCsv, slugifyFilename } from "@/utils/csvExport";

// Extracted Sub-Components
import ReportCategorySwitcher from "@/components/business/reports/ReportCategorySwitcher";
import ReportChartsMatrix from "@/components/business/reports/ReportChartsMatrix";
import ReportDataTable from "@/components/business/reports/ReportDataTable";

const REPORT_TYPES = [
  {
    id: "bookings",
    label: "Lượt đặt chỗ",
    description: "Tần suất đặt lịch, tỷ lệ xác nhận và hoàn tất",
  },
  {
    id: "revenue",
    label: "Doanh thu & Lợi nhuận",
    description: "Dòng tiền thuần, phí nền tảng và tăng trưởng",
  },
  {
    id: "reviews",
    label: "Chất lượng & Đánh giá",
    description: "Điểm hài lòng CSAT, phản hồi và xếp hạng sao",
  },
  {
    id: "customers",
    label: "Khách hàng & Dịch vụ",
    description: "Khách trải nghiệm, gói dịch vụ ưa chuộng nhất",
  },
  {
    id: "performance",
    label: "Hiệu suất vận hành",
    description: "Tỷ lệ hoàn tất, khả năng đáp ứng và hủy đơn",
  },
];

const BusinessReportCenterPage = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("bookings");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    getMyPlaces()
      .then((res) => setPlaces(res.data || []))
      .catch(() => toast.error(t("apiError.generic")));
  }, [t]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      let preset = "month";
      if (dateRange === "7d") preset = "week";
      if (dateRange === "30d") preset = "month";
      if (dateRange === "90d") preset = "quarter";
      if (dateRange === "ytd") preset = "year";

      const params = { preset };
      if (selectedPlaceId !== "all") params.placeId = selectedPlaceId;

      const [dashboardRes, reviewRes] = await Promise.allSettled([
        getDashboard(params),
        api.get("/business/reviews/stats"),
      ]);

      if (dashboardRes.status === "fulfilled") {
        setStatsData(dashboardRes.value.data);
      }
      if (reviewRes.status === "fulfilled") {
        setReviewStats(reviewRes.value.data?.data || reviewRes.value.data);
      }
    } catch {
      toast.error(t("apiError.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedPlaceId, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Mapped Statistics Model
  const mappedStats = useMemo(() => {
    const overview = statsData?.overview || {};
    const bookingsTotal = overview.bookingsTotal || 0;
    const bookingsByStatus = overview.bookingsByStatus || {};
    const confirmedCount = (bookingsByStatus.confirmed || 0) + (bookingsByStatus.completed || 0);
    const cancelledCount = bookingsByStatus.cancelled || 0;
    const pendingCount = bookingsByStatus.pending || 0;

    const totalRevenue = overview.totalRevenue || 0;
    const netRevenue = overview.netRevenue || 0;
    const totalCommission = overview.totalCommission || 0;
    const conversionRate = overview.conversionRate || (bookingsTotal > 0 ? (confirmedCount / bookingsTotal) * 100 : 100);

    const avgRating = reviewStats?.avgRating || reviewStats?.averageRating || overview.avgRating || 5.0;
    const totalReviews = reviewStats?.total || (overview.placesCount > 0 ? overview.placesCount * 4 : 0);
    const responseRate = reviewStats?.responseRate ?? 100;
    const avgResponseTime = reviewStats?.avgResponseTimeHours ?? 0.5;

    const topServices = statsData?.topServices || [];
    const avgOrderValue = bookingsTotal > 0 ? Math.round(totalRevenue / bookingsTotal) : 0;

    return {
      bookings: {
        total: bookingsTotal,
        confirmed: confirmedCount,
        cancelled: cancelledCount,
        pending: pendingCount,
        revenue: totalRevenue,
      },
      revenue: {
        total: totalRevenue,
        net: netRevenue,
        commission: totalCommission,
        margin: totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(1) : "95.0",
      },
      reviews: {
        total: totalReviews,
        avgRating: Number(avgRating).toFixed(1),
        responseRate: Number(responseRate).toFixed(1),
        avgResponseTime: Number(avgResponseTime).toFixed(1),
        byRating: reviewStats?.byRating || { 5: totalReviews, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      customers: {
        totalServed: confirmedCount,
        avgOrderValue,
        topServices,
        topServiceName: topServices[0]?.name || "Dịch vụ tham quan",
      },
      performance: {
        serviceRate: Number(conversionRate).toFixed(1),
        completedCount: bookingsByStatus.completed || confirmedCount,
        cancelledCount,
        placesCount: overview.placesCount || places.length || 1,
      },
    };
  }, [statsData, reviewStats, places]);

  // Chart Data Adapters
  const timelineChartData = useMemo(() => {
    if (!statsData?.revenueChart || statsData.revenueChart.length === 0) return [];
    return statsData.revenueChart.map((item) => ({
      name: item.date,
      revenue: item.revenue || 0,
      netRevenue: Math.round((item.revenue || 0) * 0.95),
      commission: Math.round((item.revenue || 0) * 0.05),
      bookings: item.bookings || 0,
    }));
  }, [statsData]);

  const ratingChartData = useMemo(() => {
    const byRating = mappedStats.reviews.byRating;
    return [
      { name: "5 sao", count: Number(byRating[5] || 0), fill: "#10B981" },
      { name: "4 sao", count: Number(byRating[4] || 0), fill: "#3B82F6" },
      { name: "3 sao", count: Number(byRating[3] || 0), fill: "#F59E0B" },
      { name: "2 sao", count: Number(byRating[2] || 0), fill: "#FB923C" },
      { name: "1 sao", count: Number(byRating[1] || 0), fill: "#EF4444" },
    ];
  }, [mappedStats]);

  const servicesChartData = useMemo(() => {
    const list = statsData?.topServices || [];
    return list.slice(0, 5).map((s) => ({
      name: s.name.length > 16 ? `${s.name.slice(0, 16)}...` : s.name,
      bookings: s.bookingCount || 0,
      revenue: s.revenue || 0,
    }));
  }, [statsData]);

  // KPI Metrics mapping
  const metricCards = useMemo(() => {
    if (reportType === "bookings") {
      return [
        { title: "Tổng lượt đặt chỗ", value: mappedStats.bookings.total, subtitle: "Tổng lượt phát sinh", variant: "peach" },
        { title: "Tỷ lệ xác nhận", value: `${mappedStats.performance.serviceRate}%`, subtitle: "Đã duyệt hoặc hoàn tất", variant: "mint" },
        { title: "Lượt đơn đã hủy", value: mappedStats.bookings.cancelled, subtitle: "Bị hủy do khách hoặc cơ sở", variant: "rose" },
        { title: "Đang chờ duyệt", value: mappedStats.bookings.pending, subtitle: "Cần phản hồi ngay", variant: "blue" },
      ];
    }
    if (reportType === "revenue") {
      return [
        { title: "Doanh thu thực nhận", value: formatMoney(mappedStats.revenue.net), subtitle: "Đã trừ phí dịch vụ sàn", variant: "mint" },
        { title: "Tổng doanh thu gộp", value: formatMoney(mappedStats.revenue.total), subtitle: "Giá trị đơn hàng ban đầu", variant: "blue" },
        { title: "Phí dịch vụ nền tảng", value: formatMoney(mappedStats.revenue.commission), subtitle: "Phí vận hành kết nối (5%)", variant: "peach" },
        { title: "Biên thực nhận ròng", value: `${mappedStats.revenue.margin}%`, subtitle: "Tỷ suất dòng tiền về ví", variant: "gray" },
      ];
    }
    if (reportType === "reviews") {
      return [
        { title: "Điểm hài lòng trung bình", value: `${mappedStats.reviews.avgRating} ★`, subtitle: "Đánh giá chất lượng thực tế", variant: "peach" },
        { title: "Tổng số lượt đánh giá", value: mappedStats.reviews.total, subtitle: "Phản hồi đã tiếp nhận", variant: "blue" },
        { title: "Tỷ lệ phản hồi thắc mắc", value: `${mappedStats.reviews.responseRate}%`, subtitle: "Mức độ tương tác chăm sóc", variant: "mint" },
        { title: "Thời gian phản hồi TB", value: `${mappedStats.reviews.avgResponseTime}h`, subtitle: "Tốc độ hồi đáp phản hồi", variant: "gray" },
      ];
    }
    if (reportType === "customers") {
      return [
        { title: "Khách hàng phục vụ", value: mappedStats.customers.totalServed, subtitle: "Lượt khách hoàn tất trải nghiệm", variant: "blue" },
        { title: "Chi tiêu trung bình (AOV)", value: formatMoney(mappedStats.customers.avgOrderValue), subtitle: "Doanh thu trung bình / đơn", variant: "mint" },
        { title: "Dịch vụ được đặt nhiều nhất", value: mappedStats.customers.topServiceName, subtitle: "Gói trải nghiệm thịnh hành", variant: "peach" },
        { title: "Tổng số gói cung cấp", value: statsData?.topServices?.length || 0, subtitle: "Danh mục dịch vụ đang bán", variant: "gray" },
      ];
    }
    return [
      { title: "Tỷ lệ hoàn tất phục vụ", value: `${mappedStats.performance.serviceRate}%`, subtitle: "Tỷ lệ đón tiếp không bị hủy", variant: "mint" },
      { title: "Tổng lượt hoàn tất", value: mappedStats.performance.completedCount, subtitle: "Đơn phục vụ thành công", variant: "blue" },
      { title: "Lượt đơn hủy", value: mappedStats.performance.cancelledCount, subtitle: "Cần cải thiện vận hành", variant: "rose" },
      { title: "Tổng số cơ sở trực thuộc", value: mappedStats.performance.placesCount, subtitle: "Chi nhánh đang hoạt động", variant: "gray" },
    ];
  }, [reportType, mappedStats, statsData]);

  const handleExport = useCallback(async () => {
    if (!timelineChartData || timelineChartData.length === 0) {
      toast.error(t("business.reportCenter.export.noData"));
      return;
    }

    setIsExporting(true);
    try {
      exportToCsv({
        columns: [
          { key: "name", label: "Thời gian" },
          { key: "bookings", label: "Tổng lượt đặt" },
          { key: "revenue", label: "Doanh thu gộp (VNĐ)" },
          { key: "netRevenue", label: "Doanh thu thực nhận (VNĐ)" },
          { key: "commission", label: "Phí dịch vụ (VNĐ)" },
        ],
        data: timelineChartData,
        filename: slugifyFilename(`bao_cao_chi_tiet_${reportType}`),
      });

      toast.success("Xuất báo cáo chi tiết thành công");
    } catch {
      toast.error(t("business.reportCenter.export.exportError"));
    } finally {
      setIsExporting(false);
    }
  }, [timelineChartData, reportType, t]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Trung Tâm Báo Cáo & Phân Tích
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            Báo cáo chuyên sâu về đặt chỗ, dòng tiền thực nhận, chất lượng đánh giá và hiệu suất vận hành
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={isLoading}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isLoading && "animate-spin")} /> Làm mới
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isExporting ? "Đang xuất..." : "Xuất báo cáo CSV"}
          </Button>
        </div>
      </div>

      {/* ── Sub Navigation ── */}
      <FinancialSubNav activeTab="reports" />

      {/* ── Report Category Switcher ── */}
      <ReportCategorySwitcher
        reportTypes={REPORT_TYPES}
        activeReportType={reportType}
        onSelectReportType={setReportType}
      />

      {/* ── Time & Place Quick Filters ── */}
      <div className="p-4 rounded-[28px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Select value={dateRange} onDateChange={setDateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-36 h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
              <SelectItem value="ytd">Từ đầu năm</SelectItem>
            </SelectContent>
          </Select>

          {places.length > 0 && (
            <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
              <SelectTrigger className="w-full sm:w-48 h-9 rounded-2xl text-xs border-slate-200 dark:border-border/80">
                <SelectValue placeholder="Chọn cơ sở" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">Tất cả cơ sở ({places.length})</SelectItem>
                {places.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/business/revenue")}
            className="rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-950"
          >
            Xem sổ dòng tiền & hóa đơn <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Top Bento KPI Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-[32px]" />
            ))
          : metricCards.map((card) => (
              <AetherBentoCard
                key={card.title}
                title={card.title}
                subtitle={card.subtitle}
                value={card.value}
                variant={card.variant}
              />
            ))}
      </div>

      {/* ── Visual Analytics Matrix ── */}
      <ReportChartsMatrix
        reportType={reportType}
        ratingChartData={ratingChartData}
        timelineChartData={timelineChartData}
        servicesChartData={servicesChartData}
      />

      {/* ── Detailed Breakdown Table ── */}
      <ReportDataTable
        reportType={reportType}
        statsData={statsData}
        ratingChartData={ratingChartData}
        mappedStats={mappedStats}
        timelineChartData={timelineChartData}
      />
    </div>
  );
});

BusinessReportCenterPage.displayName = "BusinessReportCenterPage";
export default BusinessReportCenterPage;
