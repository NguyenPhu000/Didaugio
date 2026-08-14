import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import Eye from "lucide-react/dist/esm/icons/eye";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
import Star from "lucide-react/dist/esm/icons/star";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import Info from "lucide-react/dist/esm/icons/info";
import Layers from "lucide-react/dist/esm/icons/layers";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import Activity from "lucide-react/dist/esm/icons/activity";
import List from "lucide-react/dist/esm/icons/list";
import GridIcon from "lucide-react/dist/esm/icons/grid";
import AnimatedIcon from "@/components/ui/animated-icon";
import { cn } from "@/lib/utils";
import { lazy, Suspense } from "react";
import {
  usePlaces,
  useDeletePlace,
  useUpdatePlaceStatus,
  useApprovePlace,
  useRejectPlace,
  useToggleFeature,
} from "@/hooks/queries/usePlaceQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";

// Dynamic import for heavy component
const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Badge,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PRICE_RANGE_LABELS } from "@/constants/constants";
import { usePermission } from "@/hooks/usePermission";
import { Textarea } from "@/components/ui/textarea";
import TimStatsCard from "@/components/admin/TimStatsCard";
import BusinessDetailModal from "@/components/admin/BusinessDetailModal";
import { useTranslation } from "react-i18next";
import { getTableSerialNumber } from "@/utils/tableSerial";

/**
 * PLACE LIST PAGE - T.I.M STYLE OVERHAUL
 */

const getPlaceCardImageSrc = (place) => {
  const coverImage = Array.isArray(place?.images)
    ? place.images.find((image) => image?.isCover) || place.images[0]
    : null;

  return (
    place?.thumbnail ||
    coverImage?.secureUrl ||
    coverImage?.thumbnailUrl ||
    coverImage?.imageData ||
    coverImage?.url ||
    (typeof coverImage === "string" ? coverImage : null)
  );
};

const PlaceListPage = ({
  initialStatus = "all",
  lockStatusFilter = false,
  pageTitle,
  pageMeta,
  moderationMode = false,
  allowCreate = true,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
  const resolvedPageTitle = pageTitle || t("places.title");
  const resolvedPageMeta = pageMeta || t("places.subtitle");
  const { hasPermission } = usePermission();
  const canModeratePlaces =
    hasPermission("places.approve") || hasPermission("places.reject");
  const canFeaturePlaces = hasPermission("places.feature");

  // TanStack Query mutations
  const deleteMutation = useDeletePlace();
  const updateStatusMutation = useUpdatePlaceStatus();
  const approveMutation = useApprovePlace();
  const rejectMutation = useRejectPlace();
  const toggleFeatureMutation = useToggleFeature();

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewBusinessId, setViewBusinessId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const searchDebounceRef = useRef(null);
  // localSearch: controlled input value updated immediately (no debounce)
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [moderationDialog, setModerationDialog] = useState({
    open: false,
    place: null,
    action: "approved",
    comment: "",
  });

  // Initialize from URL or defaults
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    categoryId: searchParams.get("categoryId") || "",
    districtId: searchParams.get("districtId") || "",
    businessId: searchParams.get("businessId") || "",
    status: searchParams.get("status") || initialStatus,
    priceRange: searchParams.get("priceRange") || "",
    page: parseInt(searchParams.get("page")) || 1,
    limit: parseInt(searchParams.get("limit")) || 12,
  });

  // Sync from URL to State
  useEffect(() => {
    const newFilters = {
      search: searchParams.get("search") || "",
      categoryId: searchParams.get("categoryId") || "",
      districtId: searchParams.get("districtId") || "",
      businessId: searchParams.get("businessId") || "",
      status: searchParams.get("status") || initialStatus,
      priceRange: searchParams.get("priceRange") || "",
      page: parseInt(searchParams.get("page")) || 1,
      limit: parseInt(searchParams.get("limit")) || 12,
    };
    setFilters(newFilters);
  }, [searchParams, initialStatus]);

  // Build API filters
  const apiFilters = useMemo(() => {
    const f = { ...filters };
    if (f.status === "all") f.status = "";
    if (f.categoryId === "all") f.categoryId = "";
    if (f.districtId === "all") f.districtId = "";
    if (!f.businessId) delete f.businessId;
    return f;
  }, [filters]);

  // TanStack Query for places
  const { data: placesRes, isLoading } = usePlaces(apiFilters);
  const places = placesRes?.data || placesRes || [];
  const pagination = placesRes?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };

  // TanStack Query for categories
  const { data: categories = [] } = useCategories();

  const updateURL = (newFilters) => {
    const params = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.categoryId && newFilters.categoryId !== "all")
      params.categoryId = newFilters.categoryId;
    if (newFilters.districtId && newFilters.districtId !== "all")
      params.districtId = newFilters.districtId;
    if (newFilters.status && newFilters.status !== "all")
      params.status = newFilters.status;
    if (newFilters.priceRange) params.priceRange = newFilters.priceRange;
    if (newFilters.businessId) params.businessId = newFilters.businessId;
    if (newFilters.page > 1) params.page = newFilters.page.toString();
    if (newFilters.limit !== 12) params.limit = newFilters.limit.toString();
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    // Update input display immediately — no lag
    setLocalSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    // Only trigger API call after debounce
    searchDebounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: value, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    }, 350);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const newFilters = { ...filters, search: "", page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      const newFilters = { ...filters, search: localSearch, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    }
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      // Changing a filter returns to page one; pagination itself must retain
      // the requested page instead of being reset to one.
      page: key === "page" ? Number(value) : 1,
    };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (nextPage) => {
    const boundedPage = Math.min(
      Math.max(1, Number(nextPage) || 1),
      pagination.totalPages,
    );
    if (boundedPage !== filters.page) handleFilterChange("page", boundedPage);
  };

  const handleCreate = () => {
    navigate("/admin/places/new");
  };

  const handleViewDetails = (place) => {
    setSelectedPlace(place);
    setDetailDialogOpen(true);
  };

  const handleEdit = (place) => {
    setDetailDialogOpen(false);
    navigate(`/admin/places/edit/${place.id}`);
  };

  const handleDelete = async (place) => {
    if (!confirm(t("places.confirmDelete", { name: place.name }))) return;

    try {
      await deleteMutation.mutateAsync(place.id);
      toast({
        title: t("common.success"),
        description: t("places.messages.deleteSuccess"),
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("places.errors.actionFailed"),
      });
    }
  };

  const handleStatusChange = async (place, newStatus) => {
    try {
      if (newStatus === "approved") {
        if (!hasPermission("places.approve")) {
          throw new Error(t("places.errors.noApprovePermission"));
        }
        await approveMutation.mutateAsync(place.id);
      } else if (newStatus === "rejected") {
        if (!hasPermission("places.reject")) {
          throw new Error(t("places.errors.noRejectPermission"));
        }
        openModerationDialog(place, "rejected");
        return;
      } else {
        await updateStatusMutation.mutateAsync({ id: place.id, status: newStatus });
      }
      toast({
        title: t("places.statusUpdated"),
        description: t("places.messages.statusUpdateSuccess"),
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  const openModerationDialog = (place, action) => {
    setModerationDialog({
      open: true,
      place,
      action,
      comment: "",
    });
  };

  const handleModerationConfirm = async () => {
    const place = moderationDialog.place;
    if (!place) return;

    const note = moderationDialog.comment?.trim() || "";
    if (moderationDialog.action === "rejected" && note.length < 10) {
      toast({
        variant: "destructive",
        title: t("places.moderation.dataError"),
        description: t("places.moderation.rejectReasonMinLength"),
      });
      return;
    }

    try {
      if (moderationDialog.action === "approved") {
        await approveMutation.mutateAsync(place.id);
        toast({
          title: t("places.moderation.approved"),
          description: t("places.moderation.approvedDescription"),
          className: "bg-black text-white border border-primary font-mono",
        });
      } else {
        await rejectMutation.mutateAsync({ id: place.id, reason: note });
        toast({
          title: t("places.moderation.rejected"),
          description: t("places.moderation.rejectedDescription"),
          className: "bg-black text-white border border-primary font-mono",
        });
      }

      setModerationDialog({
        open: false,
        place: null,
        action: "approved",
        comment: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || t("places.errors.moderationFailed"),
      });
    }
  };

  const handleToggleFeature = async (place) => {
    try {
      await toggleFeatureMutation.mutateAsync(place.id);
      toast({
        title: t("places.featured"),
        description: place.isFeatured
          ? t("places.messages.featureRemoved")
          : t("places.messages.featureAdded"),
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    }
  };

  const placeStats = useMemo(() => {
    const total = places.length;
    const approved = places.filter((p) => p.status === "approved").length;
    const pending = places.filter((p) => p.status === "pending").length;
    const featured = places.filter((p) => p.isFeatured).length;
    return { total, approved, pending, featured };
  }, [places]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: {
        label: "Bản nháp",
        className: "bg-[#F4F2EC] text-slate-600 border-black/[0.04]",
        dot: "bg-slate-400",
      },
      pending: {
        label: "Chờ duyệt",
        className: "bg-[#FFFDE6] text-slate-900 border-[#F3E600]/80",
        dot: "bg-[#F3E600] animate-pulse shadow-[0_0_6px_#F3E600]",
      },
      approved: {
        label: "Đã duyệt",
        className: "bg-slate-950 text-white border-slate-950",
        dot: "bg-[#F3E600]",
      },
      rejected: {
        label: "Từ chối",
        className: "bg-[#F4F2EC] text-slate-600 border-black/[0.04]",
        dot: "bg-slate-400",
      },
      hidden: {
        label: "Tạm ẩn",
        className: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border shadow-2xs transition-all",
          config.className
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        <span>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hệ thống Dữ liệu Địa điểm
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {resolvedPageTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {resolvedPageMeta}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {allowCreate && hasPermission("places.create") && (
            <button
              type="button"
              onClick={handleCreate}
              className="h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="h-4 w-4 text-[#F3E600]" />
              <span>{t("places.createPlace")}</span>
            </button>
          )}
        </div>
      </header>

      {/* Thống kê nhanh (theo dữ liệu trang / bộ lọc hiện tại) */}
      {!isLoading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("places.stats.total")}
            value={placeStats.total}
            icon={MapPin}
          />
          <TimStatsCard
            title={t("places.stats.approved")}
            value={placeStats.approved}
            icon={CheckCircle}
          />
          <TimStatsCard
            title={t("places.stats.pending")}
            value={placeStats.pending}
            icon={Activity}
          />
          <TimStatsCard
            title={t("places.stats.featured")}
            value={placeStats.featured}
            icon={Star}
          />
        </section>
      )}

      {/* Soft Filter Bar */}
      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t("places.searchPlaceholder")}
            value={localSearch}
            onChange={handleSearch}
            onKeyDown={onSearchKey}
            className="w-full h-10 pl-10 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 text-xs font-bold"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <Select
            value={filters.status || "all"}
            onValueChange={(val) => handleFilterChange("status", val)}
            disabled={lockStatusFilter}
          >
            <SelectTrigger className="h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-[140px]">
              <SelectValue placeholder={t("places.statusFilters.placeholder")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("places.statusFilters.all")}</SelectItem>
              <SelectItem value="pending">{t("places.statusFilters.pending")}</SelectItem>
              <SelectItem value="approved">{t("places.statusFilters.approved")}</SelectItem>
              <SelectItem value="draft">{t("places.statusFilters.draft")}</SelectItem>
              <SelectItem value="rejected">{t("places.statusFilters.rejected")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.categoryId || "all"}
            onValueChange={(val) => handleFilterChange("categoryId", val)}
          >
            <SelectTrigger className="h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-[160px]">
              <SelectValue placeholder={t("places.categoryFilter.placeholder")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("places.categoryFilter.all")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg text-xs transition-all",
                viewMode === "grid"
                  ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-950"
              )}
              title="Dạng lưới thẻ"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg text-xs transition-all",
                viewMode === "list"
                  ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-950"
              )}
              title="Dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      {isLoading ? (
        <div className="py-28 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">{t("common.loading")}</p>
        </div>
      ) : places.length === 0 ? (
        <div className="rounded-3xl bg-white border border-black/[0.04] p-16 text-center shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <MapPin className="h-12 w-12 mx-auto text-slate-300 mb-3 stroke-[1.5]" />
          <h3 className="font-bold text-base text-slate-900">
            Không tìm thấy địa điểm nào
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-3"
          }
        >
          {places.map((place, index) =>
            viewMode === "grid" ? (
              /* GRID VIEW CARD (Homely Soft UI) */
              <article
                key={place.id}
                className="group bg-white rounded-2xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden relative"
              >
                {/* Top Subtle Yellow Accent Bar on Hover */}
                <div className="h-1 w-full bg-transparent group-hover:bg-[#F3E600] transition-colors" />

                {/* Photo Thumbnail Container */}
                <div className="h-48 bg-[#F4F2EC] relative overflow-hidden shrink-0">
                  {getPlaceCardImageSrc(place) ? (
                    <img
                      src={getPlaceCardImageSrc(place)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                      alt={place.name}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF9F6]">
                      <MapPin className="h-8 w-8 text-slate-300 mb-1" />
                      <span className="font-mono text-[10px] text-slate-400">
                        Chưa có hình ảnh
                      </span>
                    </div>
                  )}

                  {/* Status & Featured Badges */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    {getStatusBadge(place.status)}
                    {place.isFeatured && (
                      <div className="bg-[#F3E600] text-slate-950 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1 rounded-full shadow-xs">
                        <Star className="w-3 h-3 fill-slate-950" /> Nổi bật
                      </div>
                    )}
                  </div>

                  {/* Serial Number */}
                  <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                    <span className="font-mono text-[10px] text-[#F3E600] font-bold tabular-nums">
                      #{getTableSerialNumber(
                        pagination.total || places.length,
                        index,
                        pagination.page || filters.page,
                        pagination.limit || filters.limit,
                      )}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div>
                    <h3
                      className="font-bold text-[15px] text-slate-950 leading-snug truncate group-hover:text-slate-800 transition-colors cursor-pointer"
                      title={place.name}
                      onClick={() => handleViewDetails(place)}
                    >
                      {place.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F4F0] text-slate-800">
                        {place.category?.name || "Chưa phân loại"}
                      </span>
                      <span>•</span>
                      <span className="truncate text-[11px]" title={place.district?.name}>
                        {place.district?.name || "Cần Thơ"}
                      </span>
                    </div>
                  </div>

                  {/* 2-Col Metric Strip */}
                  <div className="grid grid-cols-2 divide-x divide-black/[0.04] bg-[#FAF9F5] rounded-xl py-2 px-1 border border-black/[0.03] text-center">
                    <div className="px-1">
                      <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" /> Lượt xem
                      </div>
                      <div className="font-extrabold text-sm text-slate-950 font-mono tabular-nums mt-0.5">
                        {place.viewCount || 0}
                      </div>
                    </div>
                    <div className="px-1">
                      <div className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-[#F3E600] fill-[#F3E600]" /> Đánh giá
                      </div>
                      <div className="font-extrabold text-sm text-slate-950 font-mono tabular-nums mt-0.5">
                        {place.ratingAvg ? parseFloat(place.ratingAvg).toFixed(1) : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-auto pt-2 border-t border-black/[0.04] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(place)}
                      className="flex-1 h-8 rounded-xl font-semibold text-xs bg-white text-slate-900 hover:bg-[#F5F4F0] border border-black/[0.06] shadow-2xs transition-all flex items-center justify-center gap-1 active:scale-98"
                    >
                      <Info className="h-3.5 w-3.5 text-slate-500" />
                      Chi tiết
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(place)}
                      className="flex-1 h-8 rounded-xl bg-slate-950 hover:bg-black text-white font-semibold text-xs transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98"
                    >
                      <Edit className="h-3.5 w-3.5 text-[#F3E600]" />
                      Chỉnh sửa
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-xl border border-black/[0.06] bg-white hover:bg-[#F5F4F0] text-slate-700 flex items-center justify-center transition-all shrink-0 active:scale-98"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs"
                      >
                        <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          Thao tác địa điểm
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-black/[0.04]" />
                        {canFeaturePlaces && (
                          <DropdownMenuItem
                            onClick={() => handleToggleFeature(place)}
                            className="rounded-xl cursor-pointer py-2 font-medium"
                          >
                            <Star className="mr-2 h-3.5 w-3.5 text-[#F3E600]" />
                            {place.isFeatured ? "Bỏ đánh dấu nổi bật" : "Đánh dấu nổi bật"}
                          </DropdownMenuItem>
                        )}

                        {place.status === "pending" && canModeratePlaces && (
                          <>
                            <DropdownMenuSeparator className="bg-black/[0.04]" />
                            {hasPermission("places.approve") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  moderationMode
                                    ? openModerationDialog(place, "approved")
                                    : handleStatusChange(place, "approved")
                                }
                                className="rounded-xl text-slate-900 hover:bg-[#FFFDE6] cursor-pointer py-2 font-semibold"
                              >
                                <CheckCircle className="mr-2 h-3.5 w-3.5 text-[#F3E600]" />
                                Phê duyệt nhanh
                              </DropdownMenuItem>
                            )}
                            {hasPermission("places.reject") && (
                              <DropdownMenuItem
                                onClick={() =>
                                  moderationMode
                                    ? openModerationDialog(place, "rejected")
                                    : handleStatusChange(place, "rejected")
                                }
                                className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                              >
                                <XCircle className="mr-2 h-3.5 w-3.5 text-rose-500" />
                                Từ chối địa điểm
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {hasPermission("places.delete") && (
                          <>
                            <DropdownMenuSeparator className="bg-black/[0.04]" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(place)}
                              className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" />
                              Xóa địa điểm
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </article>
            ) : (
              /* LIST VIEW ROW */
              <div
                key={place.id}
                className="flex flex-col sm:flex-row sm:items-center bg-white rounded-2xl border border-black/[0.04] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all gap-3"
              >
                <div className="w-full sm:w-16 sm:h-16 h-36 bg-[#F4F2EC] rounded-xl overflow-hidden shrink-0 relative border border-black/[0.04]">
                  {getPlaceCardImageSrc(place) ? (
                    <img
                      src={getPlaceCardImageSrc(place)}
                      className="w-full h-full object-cover"
                      alt={place.name}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4">
                  <div className="md:col-span-5 min-w-0">
                    <h4
                      className="font-bold text-sm text-slate-950 truncate cursor-pointer hover:text-slate-800"
                      onClick={() => handleViewDetails(place)}
                    >
                      {place.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 truncate" title={place.address}>
                      {place.address || "Chưa có địa chỉ"}
                    </div>
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold bg-[#F5F4F0] px-2.5 py-0.5 rounded-full text-slate-800">
                      {place.category?.name || "Chưa phân loại"}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    {getStatusBadge(place.status)}
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(place)}
                      className="h-8 px-3 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-2xs transition-all"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewDetails(place)}
                      className="h-8 px-3 rounded-xl bg-white hover:bg-[#F5F4F0] text-slate-900 border border-black/[0.06] text-xs font-semibold transition-all"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-5 border-t border-black/[0.04] text-xs">
          <div className="text-slate-500 font-medium">
            Hiển thị trang <span className="font-bold text-slate-900 font-mono tabular-nums">{filters.page}</span> / <span className="font-mono tabular-nums">{pagination.totalPages}</span> (Tổng <span className="font-mono tabular-nums">{pagination.total}</span> địa điểm)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => handlePageChange(filters.page - 1)}
              className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
              className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900"
            >
              Sau →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {detailDialogOpen && selectedPlace && (
          <PlaceDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            place={selectedPlace}
            onEdit={() => handleEdit(selectedPlace)}
            onViewBusiness={(bizId) => setViewBusinessId(bizId)}
          />
        )}
      </Suspense>

      <BusinessDetailModal
        open={viewBusinessId != null}
        onOpenChange={(open) => {
          if (!open) setViewBusinessId(null);
        }}
        businessId={viewBusinessId}
      />

      {/* Dialog Duyệt / Từ chối kèm lý do */}
      <Dialog
        open={moderationDialog.open}
        onOpenChange={(open) =>
          setModerationDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-black/[0.06] p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-950">
              {moderationDialog.action === "approved"
                ? "Duyệt địa điểm"
                : "Từ chối địa điểm"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {moderationDialog.place?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-slate-700">
              {moderationDialog.action === "approved"
                ? "Ghi chú duyệt (tùy chọn):"
                : "Lý do từ chối (bắt buộc, gửi thông báo cho đối tác):"}
            </label>
            <Textarea
              value={moderationDialog.comment}
              onChange={(e) =>
                setModerationDialog((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              placeholder={
                moderationDialog.action === "approved"
                  ? "Nhập ghi chú cho quản trị viên..."
                  : "Nêu rõ lý do từ chối (thiếu thông tin, hình ảnh không đạt chuẩn...)"
              }
              rows={3}
              className="rounded-xl border border-black/[0.06] bg-[#F8F7F3] text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() =>
                setModerationDialog((prev) => ({ ...prev, open: false }))
              }
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              Hủy
            </Button>
            <Button
              onClick={handleModerationConfirm}
              className={cn(
                "rounded-full text-xs font-semibold h-9 px-5 shadow-sm",
                moderationDialog.action === "approved"
                  ? "bg-slate-950 text-white hover:bg-black"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              )}
            >
              Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaceListPage;
