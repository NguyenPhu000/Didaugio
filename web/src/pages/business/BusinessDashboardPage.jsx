// MAP: BusinessDashboardPage
// ├── UI: @/components/business/dashboard/{DashboardHeroHeader, DashboardBentoCards, DashboardChartTabs, DashboardRecentBookings, DashboardPlaceSummary}
// └── API: @/hooks/queries/useBusinessQueries, @/apis/businessApi, @/apis/bookingService

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBusinessPlaceHeatmap, useBusinessTrafficSummary } from "@/hooks/queries/useTelemetryQueries";
import { useBusinessProfile, useBusinessDashboard } from "@/hooks/queries/useBusinessQueries";
import { queryKeys } from "@/constants/query-keys";
import { useAuthStore } from "@/stores/authStore";
import { getDocumentStatus } from "@/apis/documentApi";
import { downloadContract } from "@/apis/businessApi";
import * as bookingApi from "@/apis/bookingService";

// Extracted Sub-Components
import DashboardHeroHeader from "@/components/business/dashboard/DashboardHeroHeader";
import DashboardBentoCards from "@/components/business/dashboard/DashboardBentoCards";
import DashboardOperationsCharts from "@/components/business/dashboard/DashboardOperationsCharts";
import DashboardPendingQueue from "@/components/business/dashboard/DashboardPendingQueue";
import DashboardRecentBookings from "@/components/business/dashboard/DashboardRecentBookings";
import DashboardTrafficHub from "@/components/business/dashboard/DashboardTrafficHub";
import DashboardTopServices from "@/components/business/dashboard/DashboardTopServices";
import DashboardAiInsights from "@/components/business/dashboard/DashboardAiInsights";
import DashboardContractWidget from "@/components/business/dashboard/DashboardContractWidget";

const BusinessDashboardPage = memo(() => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: businessRes } = useBusinessProfile();
  const { data: statsRes } = useBusinessDashboard();

  const [heatmapAction, setHeatmapAction] = useState("all");
  const [chartMetric, setChartMetric] = useState("both"); // "both" | "bookings" | "revenue"
  const [heatmapPeriodEnd] = useState(() => new Date());
  const [trafficPeriod, setTrafficPeriod] = useState("30d");

  // 1. Traffic Summary Query
  const { data: trafficRes } = useBusinessTrafficSummary({
    period: trafficPeriod,
  });
  const trafficData = trafficRes?.data || trafficRes || {};
  const trafficSummary = trafficData?.summary || {
    todayViews: 0,
    todayAiRecommendations: 0,
    todayDirections: 0,
    todayBookingClicks: 0,
    totalViews: 0,
    totalAiRecommendations: 0,
    totalDirections: 0,
    totalBookingClicks: 0,
  };
  const placesTraffic = trafficData?.byPlace || [];

  // 2. Business & Stats Parsing
  const business = businessRes?.data || businessRes;
  const stats = statsRes?.data || statsRes;
  const overview = useMemo(() => stats?.overview || stats || {}, [stats]);
  const topServices = stats?.topServices || [];
  const revenueChart = stats?.revenueChart || [];
  const businessId = business?.id;

  // 3. Recent Bookings
  const { data: recentBookingsRes, isLoading: bookingsLoading } = useQuery({
    queryKey: queryKeys.bookings.list({ limit: 5 }),
    queryFn: () => bookingApi.getAll({ limit: 5 }),
    enabled: !!businessId,
  });

  // 4. Pending Queue
  const { data: pendingQueueRes, isLoading: queueLoading } = useQuery({
    queryKey: queryKeys.bookings.list({ status: "pending", limit: 6 }),
    queryFn: () => bookingApi.getAll({ status: "pending", limit: 6 }),
    enabled: !!businessId,
  });

  const recentBookings = useMemo(() => {
    const raw = recentBookingsRes?.data || recentBookingsRes || {};
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [recentBookingsRes]);

  const pendingQueue = useMemo(() => {
    const raw = pendingQueueRes?.data || pendingQueueRes || {};
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [pendingQueueRes]);

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => bookingApi.quickApprove(id),
    onSuccess: () => {
      toast.success("Đã xác nhận đơn đặt chỗ thành công");
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard() });
    },
    onError: () => toast.error("Không thể xác nhận đơn đặt"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => bookingApi.quickReject(id, "Doanh nghiệp từ chối"),
    onSuccess: () => {
      toast.success("Đã từ chối đơn đặt chỗ");
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.business.dashboard() });
    },
    onError: () => toast.error("Không thể từ chối đơn đặt"),
  });

  // 5. Document Status
  const { data: docStatusRes } = useQuery({
    queryKey: queryKeys.documents.status(businessId),
    queryFn: () => getDocumentStatus(businessId),
    enabled: !!businessId,
  });

  const docStatus = useMemo(() => {
    const raw = docStatusRes?.data || docStatusRes || {};
    return {
      idCardFront: Array.isArray(raw?.idCardFront) ? raw.idCardFront : [],
      idCardBack: Array.isArray(raw?.idCardBack) ? raw.idCardBack : [],
      businessLicense: Array.isArray(raw?.businessLicense) ? raw.businessLicense : [],
      certificate: Array.isArray(raw?.certificate) ? raw.certificate : [],
    };
  }, [docStatusRes]);

  const docsUploadedCount = useMemo(
    () =>
      [docStatus.idCardFront, docStatus.idCardBack, docStatus.businessLicense, docStatus.certificate]
        .filter((arr) => arr.length > 0).length,
    [docStatus]
  );

  // 6. Spatial Heatmap
  const heatmapFilters = useMemo(
    () => ({
      action: heatmapAction,
      fromDate: new Date(heatmapPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: heatmapPeriodEnd.toISOString(),
    }),
    [heatmapAction, heatmapPeriodEnd]
  );
  const placeHeatmap = useBusinessPlaceHeatmap(heatmapFilters);

  const handleDownloadContract = useCallback(async () => {
    if (!businessId) return;
    try {
      const blob = await downloadContract(businessId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract-${businessId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("business.dashboard.contract.downloadFailed"));
    }
  }, [businessId, t]);

  // Derived Values
  const displayName = business?.brandName || business?.businessName || user?.name || "Doanh Nghiệp";
  const totalBookings = Number(overview.bookingsTotal ?? overview.totalBookings ?? 0);
  const netRevenue = Number(overview.netRevenue ?? overview.totalRevenue ?? 0);
  const conversionRate = Number(overview.conversionRate ?? 0);
  const placesCount = Number(overview.placesCount ?? 0);
  const servicesCount = Number(overview.servicesCount ?? 0);
  const newThisWeek = Number(overview.newBookingsThisWeek ?? 0);
  const pendingToday = Number(overview.pendingBookingsToday ?? pendingQueue.length ?? 0);

  // Status Breakdown Data for Donut Chart
  const statusBreakdownData = useMemo(() => {
    const statusMap = overview.bookingsByStatus || {};
    return [
      { name: "Chờ xác nhận", status: "pending", value: Number(statusMap.pending || 0) },
      { name: "Đã duyệt", status: "confirmed", value: Number(statusMap.confirmed || 0) },
      { name: "Hoàn tất", status: "completed", value: Number(statusMap.completed || 0) },
      { name: "Đã hủy", status: "cancelled", value: Number(statusMap.cancelled || 0) },
      { name: "Vắng mặt", status: "no_show", value: Number(statusMap.no_show || 0) },
    ];
  }, [overview.bookingsByStatus]);

  // Timeline Chart Data for Area Chart
  const timelineChartData = useMemo(() => {
    if (!Array.isArray(revenueChart) || revenueChart.length === 0) {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push({
          date: d.toISOString().slice(5, 10),
          bookings: 0,
          revenue: 0,
        });
      }
      return days;
    }
    return revenueChart.map((item) => ({
      date: item.date ? item.date.slice(5) : "N/A",
      bookings: Number(item.bookings || 0),
      revenue: Number(item.revenue || 0),
    }));
  }, [revenueChart]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#07090E] text-foreground p-4 sm:p-6 lg:p-8 space-y-7 max-w-[1640px] mx-auto font-sans transition-colors duration-300 antialiased selection:bg-slate-900 selection:text-white">
      {/* 1. Hero Header & Action Deck */}
      <DashboardHeroHeader displayName={displayName} />

      {/* 2. Top Bento Metrics Grid */}
      <DashboardBentoCards
        totalBookings={totalBookings}
        placesCount={placesCount}
        servicesCount={servicesCount}
        netRevenue={netRevenue}
        conversionRate={conversionRate}
        newThisWeek={newThisWeek}
        pendingToday={pendingToday}
      />

      {/* 3. Operations Charts Row (Area Chart & Donut Chart) */}
      <DashboardOperationsCharts
        timelineChartData={timelineChartData}
        statusBreakdownData={statusBreakdownData}
        chartMetric={chartMetric}
        setChartMetric={setChartMetric}
        totalBookings={totalBookings}
      />

      {/* 4. Dual Column Operations & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardPendingQueue
            pendingQueue={pendingQueue}
            queueLoading={queueLoading}
            approveMutation={approveMutation}
            rejectMutation={rejectMutation}
          />

          <DashboardRecentBookings
            recentBookings={recentBookings}
            bookingsLoading={bookingsLoading}
          />

          <DashboardTrafficHub
            trafficPeriod={trafficPeriod}
            setTrafficPeriod={setTrafficPeriod}
            trafficSummary={trafficSummary}
            placesTraffic={placesTraffic}
            heatmapAction={heatmapAction}
            setHeatmapAction={setHeatmapAction}
            placeHeatmap={placeHeatmap}
          />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          <DashboardTopServices topServices={topServices} />
          <DashboardAiInsights conversionRate={conversionRate} pendingToday={pendingToday} />
          <DashboardContractWidget
            docsUploadedCount={docsUploadedCount}
            handleDownloadContract={handleDownloadContract}
          />
        </div>
      </div>
    </div>
  );
});

BusinessDashboardPage.displayName = "BusinessDashboardPage";
export default BusinessDashboardPage;
