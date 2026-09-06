// MAP: PlaceListPage
// ├── UI: @/components/admin/places/{PlaceHeaderFilters, PlaceMasterTable, PlaceQuickInspectDrawer, PlaceApproveRejectModal}
// └── API: @/hooks/queries/usePlaceQueries, @/hooks/queries/useCategoryQueries

import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, MapPin, CheckCircle, Activity, Star } from "lucide-react";
import { usePlaces, useDeletePlace, useUpdatePlaceStatus, useApprovePlace, useRejectPlace, useToggleFeature } from "@/hooks/queries/usePlaceQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import TimStatsCard from "@/components/admin/TimStatsCard";
import BusinessDetailModal from "@/components/admin/BusinessDetailModal";
import { useTranslation } from "react-i18next";

// Extracted Sub-Components
import PlaceFilterBar from "@/components/admin/places/PlaceFilterBar";
import PlaceAdminGridView from "@/components/admin/places/PlaceAdminGridView";
import PlaceAdminListView from "@/components/admin/places/PlaceAdminListView";
import PlaceModerationDialog from "@/components/admin/places/PlaceModerationDialog";

const PlaceDetailDialog = lazy(() => import("@/components/place/PlaceDetailDialog"));

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
  const canModeratePlaces = hasPermission("places.approve") || hasPermission("places.reject");
  const canFeaturePlaces = hasPermission("places.feature");

  // Mutations
  const deleteMutation = useDeletePlace();
  const updateStatusMutation = useUpdatePlaceStatus();
  const approveMutation = useApprovePlace();
  const rejectMutation = useRejectPlace();
  const toggleFeatureMutation = useToggleFeature();

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewBusinessId, setViewBusinessId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const searchDebounceRef = useRef(null);
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [moderationDialog, setModerationDialog] = useState({
    open: false,
    place: null,
    action: "approved",
    comment: "",
  });

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

  const apiFilters = useMemo(() => {
    const f = { ...filters };
    if (f.status === "all") f.status = "";
    if (f.categoryId === "all") f.categoryId = "";
    if (f.districtId === "all") f.districtId = "";
    if (!f.businessId) delete f.businessId;
    return f;
  }, [filters]);

  const { data: placesRes, isLoading } = usePlaces(apiFilters);
  const places = placesRes?.data || placesRes || [];
  const pagination = placesRes?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };
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
    setLocalSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
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
      page: key === "page" ? Number(value) : 1,
    };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (nextPage) => {
    const boundedPage = Math.min(
      Math.max(1, Number(nextPage) || 1),
      pagination.totalPages
    );
    if (boundedPage !== filters.page) handleFilterChange("page", boundedPage);
  };

  const handleCreate = () => navigate("/admin/places/new");

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

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Hệ thống Dữ liệu Địa điểm
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {resolvedPageTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {resolvedPageMeta}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          {allowCreate && hasPermission("places.create") && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full sm:w-auto justify-center h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>{t("places.createPlace")}</span>
            </button>
          )}
        </div>
      </header>

      {/* Thống kê nhanh */}
      {isLoading ? (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-black/[0.04] p-4 animate-pulse">
              <div className="h-3.5 w-24 bg-slate-200 rounded-md mb-3" />
              <div className="h-7 w-16 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </section>
      ) : (
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

      {/* Filter Bar */}
      <PlaceFilterBar
        localSearch={localSearch}
        handleSearch={handleSearch}
        onSearchKey={onSearchKey}
        handleClearSearch={handleClearSearch}
        filters={filters}
        handleFilterChange={handleFilterChange}
        lockStatusFilter={lockStatusFilter}
        categories={categories}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Content Grid/List */}
      {isLoading ? (
        <div className="py-28 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
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
      ) : viewMode === "grid" ? (
        <PlaceAdminGridView
          places={places}
          pagination={pagination}
          filters={filters}
          handleViewDetails={handleViewDetails}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleToggleFeature={handleToggleFeature}
          handleStatusChange={handleStatusChange}
          openModerationDialog={openModerationDialog}
          canFeaturePlaces={canFeaturePlaces}
          canModeratePlaces={canModeratePlaces}
          hasPermission={hasPermission}
          moderationMode={moderationMode}
        />
      ) : (
        <PlaceAdminListView
          places={places}
          handleViewDetails={handleViewDetails}
          handleEdit={handleEdit}
        />
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

      <PlaceModerationDialog
        open={moderationDialog.open}
        onOpenChange={(open) =>
          setModerationDialog((prev) => ({ ...prev, open }))
        }
        moderationDialog={moderationDialog}
        setModerationDialog={setModerationDialog}
        onConfirm={handleModerationConfirm}
      />
    </div>
  );
};

export default PlaceListPage;
