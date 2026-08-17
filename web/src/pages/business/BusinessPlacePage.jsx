// MAP: BusinessPlacePage
// ├── UI: @/components/business/places/{PlaceHeaderSection, PlaceGridList, PlaceDetailDrawer, PlaceDeleteDialog}
// └── API: @/apis/businessApi

import { useState, useEffect, useCallback, useMemo, lazy, Suspense, memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Search,
  LayoutGrid,
  LayoutList,
  Plus,
  RefreshCw,
  Map as MapIcon,
  BarChart3,
  Building2,
} from "lucide-react";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { MapProvider } from "@/modules/map";
import { useBusinessPlaceHeatmap, useBusinessTrafficSummary } from "@/hooks/queries/useTelemetryQueries";
import { cn } from "@/lib/utils";

// Extracted Sub-Components
import PlaceGridView from "@/components/business/places/PlaceGridView";
import PlaceListView from "@/components/business/places/PlaceListView";
import PlaceDigitalMapView from "@/components/business/places/PlaceDigitalMapView";
import PlaceTrafficHeatmapTab from "@/components/business/places/PlaceTrafficHeatmapTab";

const PlaceDetailDialog = lazy(() => import("@/components/place/PlaceDetailDialog"));

const TABS = [
  { id: "grid", label: "Lưới Cơ Sở", icon: LayoutGrid },
  { id: "list", label: "Danh Sách Chi Tiết", icon: LayoutList },
  { id: "map", label: "Bản Đồ Số Cần Thơ", icon: MapIcon },
  { id: "analytics", label: "Mật Độ Tương Tác & Lưu Lượng", icon: BarChart3 },
];

const BusinessPlacePage = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [places, setPlacesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewTab, setViewTab] = useState(searchParams.get("tab") || "grid");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Heatmap Telemetry Filters & Query
  const [heatmapAction, setHeatmapAction] = useState("all");
  const [heatmapRange, setHeatmapRange] = useState("30d");

  const heatmapFilters = useMemo(() => {
    const now = new Date();
    const days = heatmapRange === "7d" ? 7 : heatmapRange === "30d" ? 30 : heatmapRange === "90d" ? 90 : 365;
    const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    return {
      action: heatmapAction,
      fromDate,
      toDate: now.toISOString(),
    };
  }, [heatmapAction, heatmapRange]);

  const {
    data: heatmapData,
    isLoading: heatmapLoading,
    isError: heatmapError,
    refetch: refetchHeatmap,
  } = useBusinessPlaceHeatmap(heatmapFilters);

  const {
    data: trafficRes,
    isLoading: trafficLoading,
    refetch: refetchTraffic,
  } = useBusinessTrafficSummary({ period: heatmapRange });

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

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPlaces();
      setPlacesData(res.data || []);
    } catch (err) {
      console.error("[BusinessPlacePage] Fetch error:", err);
      toast.error(t("business.places.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // URL Sync
  const updateURL = useCallback(
    (tab, searchVal) => {
      const params = {};
      if (tab && tab !== "grid") params.tab = tab;
      if (searchVal) params.search = searchVal;
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleTabChange = useCallback(
    (tab) => {
      setViewTab(tab);
      updateURL(tab, search);
    },
    [search, updateURL]
  );

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && p.status === "approved") ||
        (statusFilter === "pending" && p.status === "pending") ||
        (statusFilter === "draft" && (p.status === "draft" || !p.status));

      return matchesSearch && matchesStatus;
    });
  }, [places, search, statusFilter]);

  // Top KPI Stats
  const stats = useMemo(
    () => ({
      total: places.length,
      approved: places.filter((p) => p.status === "approved").length,
      pending: places.filter((p) => p.status === "pending").length,
      draft: places.filter((p) => p.status === "draft" || !p.status).length,
    }),
    [places]
  );

  const handlePlaceView = useCallback((place) => {
    setSelectedPlace(place);
    setDetailOpen(true);
  }, []);

  const handlePlaceEdit = useCallback(
    (place) => {
      navigate(`${BUSINESS_ROUTES.PLACES}/edit/${place.id}`);
    },
    [navigate]
  );

  const handlePlaceFly = useCallback(
    (place) => {
      setViewTab("map");
      updateURL("map", search);
      setTimeout(() => handlePlaceView(place), 100);
    },
    [search, updateURL, handlePlaceView]
  );

  const handleAddNew = useCallback(() => {
    navigate(`${BUSINESS_ROUTES.PLACES}/new`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans transition-colors duration-200">
      {/* ── Top Header & Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quản Lý Địa Điểm & Cơ Sở
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5">
            Quản lý thông tin chi nhánh, gói dịch vụ liên kết, tọa độ GPS và phân tích tương tác thực tế
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPlaces}
            disabled={loading}
            className="flex-1 sm:flex-initial justify-center rounded-2xl h-10 px-4 text-xs font-bold border-slate-200 dark:border-border/80 shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} /> Làm mới
          </Button>

          <Button
            onClick={handleAddNew}
            className="flex-1 sm:flex-initial justify-center rounded-[22px] px-5 h-10 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground shadow-sm gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm cơ sở mới
          </Button>
        </div>
      </div>

      {/* ── Top Bento KPI Metrics (Signature Notched Corners) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <AetherBentoCard
          title="Tổng cơ sở kinh doanh"
          subtitle="Toàn bộ chi nhánh trong hệ thống"
          value={stats.total}
          variant="gray"
          onClick={() => setStatusFilter("all")}
          className={statusFilter === "all" ? "ring-2 ring-slate-950 dark:ring-white" : ""}
        />

        <AetherBentoCard
          title="Đang hoạt động"
          subtitle="Đã được duyệt và xuất hiện trên app"
          value={stats.approved}
          variant="mint"
          onClick={() => setStatusFilter("approved")}
          className={statusFilter === "approved" ? "ring-2 ring-slate-950 dark:ring-emerald-400" : ""}
        />

        <AetherBentoCard
          title="Chờ duyệt hồ sơ"
          subtitle="Đang trong quá trình xét duyệt"
          value={stats.pending}
          variant="peach"
          onClick={() => setStatusFilter("pending")}
          className={statusFilter === "pending" ? "ring-2 ring-slate-950 dark:ring-amber-400" : ""}
        />

        <AetherBentoCard
          title="Bản nháp / Cần bổ sung"
          subtitle="Chưa gửi yêu cầu phê duyệt"
          value={stats.draft}
          variant="blue"
          onClick={() => setStatusFilter("draft")}
          className={statusFilter === "draft" ? "ring-2 ring-slate-950 dark:ring-blue-400" : ""}
        />
      </div>

      {/* ── View Modes & Filter Command Bar ── */}
      <div className="p-4 sm:p-5 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-muted/80 rounded-[24px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-[20px] text-xs font-extrabold whitespace-nowrap transition-all duration-200 select-none",
                viewTab === id
                  ? "bg-white dark:bg-card text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Tìm theo tên, địa chỉ, danh mục..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateURL(viewTab, e.target.value);
              }}
              className="pl-9 pr-4 h-10 rounded-2xl text-xs bg-slate-50 dark:bg-muted/50 border-slate-200/80 dark:border-border/80 focus-visible:ring-1 focus-visible:ring-slate-950 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-muted/80 rounded-2xl overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {["all", "approved", "pending", "draft"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all capitalize",
                  statusFilter === st
                    ? "bg-white dark:bg-card text-slate-950 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                {st === "all" ? "Tất cả" : st === "approved" ? "Hoạt động" : st === "pending" ? "Chờ duyệt" : "Bản nháp"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Body (Grid / List / Map / Analytics) ── */}
      <main>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-[32px]" />
            ))}
          </div>
        ) : filteredPlaces.length === 0 && viewTab !== "analytics" ? (
          <div className="py-20 text-center space-y-4 rounded-[36px] bg-white dark:bg-card border border-dashed border-slate-200 dark:border-border">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-muted mx-auto flex items-center justify-center text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Không tìm thấy cơ sở nào
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc." : "Bắt đầu đăng ký và quản lý các cơ sở kinh doanh du lịch của bạn."}
              </p>
            </div>
            {!search && (
              <Button
                onClick={handleAddNew}
                className="rounded-2xl px-5 h-9 text-xs font-bold bg-slate-950 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Thêm cơ sở đầu tiên
              </Button>
            )}
          </div>
        ) : viewTab === "grid" ? (
          <PlaceGridView
            places={filteredPlaces}
            onView={handlePlaceView}
            onEdit={handlePlaceEdit}
            onFly={handlePlaceFly}
          />
        ) : viewTab === "list" ? (
          <PlaceListView
            places={filteredPlaces}
            onView={handlePlaceView}
            onEdit={handlePlaceEdit}
            onFly={handlePlaceFly}
          />
        ) : viewTab === "map" ? (
          <MapProvider>
            <PlaceDigitalMapView places={filteredPlaces} onPlaceSelect={handlePlaceView} />
          </MapProvider>
        ) : (
          <PlaceTrafficHeatmapTab
            trafficSummary={trafficSummary}
            heatmapAction={heatmapAction}
            setHeatmapAction={setHeatmapAction}
            heatmapRange={heatmapRange}
            setHeatmapRange={setHeatmapRange}
            heatmapData={heatmapData}
            heatmapLoading={heatmapLoading}
            heatmapError={heatmapError}
            trafficLoading={trafficLoading}
            refetchHeatmap={refetchHeatmap}
            refetchTraffic={refetchTraffic}
          />
        )}
      </main>

      {/* ── Place Detail Dialog ── */}
      <Suspense fallback={null}>
        {selectedPlace && (
          <PlaceDetailDialog
            place={selectedPlace}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onEdit={() => {
              setDetailOpen(false);
              handlePlaceEdit(selectedPlace);
            }}
          />
        )}
      </Suspense>
    </div>
  );
});

BusinessPlacePage.displayName = "BusinessPlacePage";
export default BusinessPlacePage;
