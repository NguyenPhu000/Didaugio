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

/**
 * PLACE LIST PAGE - T.I.M STYLE OVERHAUL
 */

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
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: value, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    }, 350);
  };

  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      const newFilters = { ...filters, search: e.target.value, page: 1 };
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
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateURL(newFilters);
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
        label: "DRAFT",
        className: "bg-gray-200 text-gray-700 border-2 border-gray-400",
      },
      pending: {
        label: "PENDING",
        className:
          "bg-yellow-400 text-black border-2 border-yellow-600 animate-pulse font-black",
      },
      approved: {
        label: "APPROVED",
        className: "bg-[#F3E600] text-black border-2 border-black font-black",
      },
      rejected: {
        label: "REJECTED",
        className: "bg-red-500 text-white border-2 border-red-700 font-black",
      },
      hidden: {
        label: "HIDDEN",
        className: "bg-gray-800 text-gray-300 border-2 border-gray-600",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <div
        className={`px-3 py-1.5 text-[10px] uppercase font-mono ${config.className} backdrop-blur-sm shadow-sm`}
      >
        {config.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">{resolvedPageTitle}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  DATABASE // PLACES
                </span>
                <p className="tim-meta">{resolvedPageMeta}</p>
              </div>
            </div>
          </div>
          {allowCreate && hasPermission("places.create") && (
            <Button
              onClick={handleCreate}
              className="h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all tim-button rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("places.createPlace")}
            </Button>
          )}
        </div>

        {/* Thống kê nhanh (theo dữ liệu trang / bộ lọc hiện tại) */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimStatsCard
              title={t("places.stats.total")}
              value={placeStats.total}
              icon={MapPin}
              serial="PLC-001"
            />
            <TimStatsCard
              title={t("places.stats.approved")}
              value={placeStats.approved}
              icon={CheckCircle}
              serial="PLC-002"
              textColor="text-emerald-600"
            />
            <TimStatsCard
              title={t("places.stats.pending")}
              value={placeStats.pending}
              icon={Activity}
              serial="PLC-003"
              textColor="text-amber-600"
            />
            <TimStatsCard
              title={t("places.stats.featured")}
              value={placeStats.featured}
              icon={Star}
              serial="PLC-004"
              color="bg-yellow-50"
            />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          {/* Search */}
          <div className="flex-1 flex shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder={t("places.searchPlaceholder")}
              value={filters.search}
              onChange={handleSearch}
              onKeyDown={onSearchKey}
              className="flex-1 h-10 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => handleFilterChange("status", val)}
              disabled={lockStatusFilter}
            >
              <SelectTrigger className="w-[150px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("places.statusFilters.placeholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
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
              <SelectTrigger className="w-[180px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder={t("places.categoryFilter.placeholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">{t("places.categoryFilter.all")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="border-l border-black pl-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-10 w-10 rounded-none border border-black ${viewMode === "grid" ? "bg-primary text-black" : "text-gray-400 hover:text-black"}`}
              >
                <GridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-10 w-10 rounded-none border border-black ${viewMode === "list" ? "bg-primary text-black" : "text-gray-400 hover:text-black"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin"></div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("common.loading")}
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-2"
            }
          >
            {places.map((place) =>
              viewMode === "grid" ? (
                // GRID VIEW CARD - ENHANCED T.I.M STYLE
                <div
                  key={place.id}
                  className="relative group bg-white border-2 border-black transition-all hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                >
                  {/* Grid Background Overlay */}
                  <div className="absolute inset-0 bg-grid-dots opacity-30 pointer-events-none"></div>

                  {/* Image Container */}
                  <div className="h-52 bg-gray-900 relative overflow-hidden border-b-2 border-black">
                    {place.images?.[0] ? (
                      <>
                        <img
                          src={place.images[0].imageData || place.images[0]}
                          className="w-full h-full object-cover grayscale-[0.7] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                          alt={place.name}
                        />
                        {/* Accent Bar on Image */}
                        <div className="absolute bottom-0 left-0 w-1 h-full bg-[#F3E600] group-hover:w-2 transition-all"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <MapPin className="h-12 w-12 text-gray-600 mb-2" />
                        <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                          NO_IMAGE_DATA
                        </span>
                      </div>
                    )}

                    {/* Status & Featured Badges */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                      {getStatusBadge(place.status)}
                      {place.isFeatured && (
                        <div className="bg-[#F3E600] border-2 border-black text-black px-2 py-1 text-[10px] uppercase font-black flex items-center gap-1">
                          <Star className="w-3 h-3 fill-black" /> FEATURED
                        </div>
                      )}
                    </div>

                    {/* ID Badge */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm border border-white/20 px-2 py-1">
                      <span className="font-mono text-[10px] text-white">
                        #{place.id}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 relative bg-white">
                    {/* Title */}
                    <h3
                      className="font-black text-lg leading-tight uppercase mb-2 tracking-tight hover:text-[#F3E600] transition-colors cursor-pointer"
                      title={place.name}
                      onClick={() => handleViewDetails(place)}
                    >
                      {place.name.length > 30
                        ? `${place.name.substring(0, 30)}...`
                        : place.name}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mb-4 uppercase">
                      <span className="bg-gray-100 px-2 py-0.5 border border-gray-300">
                        {place.category?.name || "UNCATEGORIZED"}
                      </span>
                      <span className="text-gray-300">//</span>
                      <span
                        className="truncate max-w-[120px]"
                        title={place.district?.name}
                      >
                        {place.district?.name || "NO_DISTRICT"}
                      </span>
                    </div>

                    {/* Stats Grid - Enhanced */}
                    <div className="grid grid-cols-2 gap-3 border-t-2 border-black pt-4 mb-4">
                      <div className="text-center bg-gray-50 border border-gray-200 p-2">
                        <div className="text-[10px] text-gray-400 font-mono uppercase mb-1 tracking-wider">
                          <Eye className="w-3 h-3 inline mr-1" />
                          VIEWS
                        </div>
                        <div className="font-black text-xl tracking-tighter">
                          {place.viewCount || 0}
                        </div>
                      </div>
                      <div className="text-center bg-yellow-50 border border-yellow-200 p-2">
                        <div className="text-[10px] text-gray-400 font-mono uppercase mb-1 tracking-wider">
                          <Star className="w-3 h-3 inline mr-1" />
                          RATING
                        </div>
                        <div className="font-black text-xl tracking-tighter text-yellow-600">
                          {place.ratingAvg
                            ? parseFloat(place.ratingAvg).toFixed(1)
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Tactical Style */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-none border-2 border-black bg-white text-black hover:bg-[#F3E600] hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black text-xs h-10 transition-all"
                        onClick={() => handleEdit(place)}
                      >
                        <Edit className="w-4 h-4 mr-1.5" /> EDIT
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 rounded-none border-2 border-black bg-black text-[#F3E600] hover:bg-[#F3E600] hover:text-black transition-all"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-none border border-black w-48 font-mono text-xs uppercase"
                        >
                          <DropdownMenuLabel>{t("places.card.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(place)}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <Info className="mr-2 h-3 w-3" /> {t("places.card.detail")}
                          </DropdownMenuItem>
                          {canFeaturePlaces && (
                            <DropdownMenuItem
                              onClick={() => handleToggleFeature(place)}
                              className="cursor-pointer hover:bg-gray-100"
                            >
                              <Star className="mr-2 h-3 w-3" />{" "}
                              {place.isFeatured ? t("places.card.unfeature") : t("places.card.feature")}
                            </DropdownMenuItem>
                          )}

                          {place.status === "pending" && canModeratePlaces && (
                            <>
                              <DropdownMenuSeparator />
                              {hasPermission("places.approve") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    moderationMode
                                      ? openModerationDialog(place, "approved")
                                      : handleStatusChange(place, "approved")
                                  }
                                  className="text-green-600 hover:bg-green-50 cursor-pointer text-bold"
                                >
                                  <CheckCircle className="mr-2 h-3 w-3" /> {t("places.card.quickApprove")}
                                </DropdownMenuItem>
                              )}
                              {hasPermission("places.reject") && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    moderationMode
                                      ? openModerationDialog(place, "rejected")
                                      : handleStatusChange(place, "rejected")
                                  }
                                  className="text-red-600 hover:bg-red-50 cursor-pointer text-bold"
                                >
                                  <XCircle className="mr-2 h-3 w-3" /> {t("places.card.reject")}
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {hasPermission("places.delete") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(place)}
                                className="text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-3 w-3" /> {t("places.card.delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ) : (
                // LIST VIEW ROW
                <div
                  key={place.id}
                  className="flex items-center bg-white border border-gray-200 p-2 hover:border-black transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-200 mr-4 shrink-0 relative">
                    {place.images?.[0] && (
                      <img
                        src={place.images[0].imageData || place.images[0]}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-12 items-center gap-4">
                    <div className="col-span-4">
                      <div className="font-bold text-sm uppercase truncate">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {place.address}
                      </div>
                    </div>
                    <div className="col-span-2 text-[10px] font-mono uppercase bg-gray-50 p-1 text-center">
                      {place.category?.name}
                    </div>
                    <div className="col-span-3">
                      {getStatusBadge(place.status)}
                    </div>
                    <div className="col-span-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] uppercase font-bold"
                        onClick={() => handleEdit(place)}
                      >
                        {t("common.edit")}
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && places.length === 0 && (
          <div className="text-center py-20 border border-dashed border-black bg-white/50">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-black text-xl uppercase mb-2">
              {t("places.empty.title")}
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-6 uppercase">
              {t("places.empty.description")}
            </p>
            <Button
              onClick={handleCreate}
              className="rounded-none bg-black text-white px-8 font-bold uppercase hover:bg-primary hover:text-black"
            >
              {t("places.empty.createNew")}
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black pt-4 font-mono text-xs uppercase">
            <div>
              {t("places.pagination.page", { page: pagination.page, totalPages: pagination.totalPages })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange("page", filters.page - 1)}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white"
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange("page", filters.page + 1)}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white"
              >
                {t("common.next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <PlaceDetailDialog
          place={selectedPlace}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={
            hasPermission("places.approve")
              ? (place) => approveMutation.mutateAsync(place.id)
              : undefined
          }
          onReject={
            hasPermission("places.reject")
              ? (place) => openModerationDialog(place, "rejected")
              : undefined
          }
          onViewBusinessDetails={(id) => {
            setDetailDialogOpen(false);
            setViewBusinessId(id);
          }}
        />
      </Suspense>

      <BusinessDetailModal
        open={viewBusinessId != null}
        onOpenChange={(open) => {
          if (!open) setViewBusinessId(null);
        }}
        businessId={viewBusinessId}
      />

      <Dialog
        open={moderationDialog.open}
        onOpenChange={(open) =>
          setModerationDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="rounded-none border border-black bg-white sm:max-w-[560px]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="font-black uppercase tracking-wide text-base">
              {moderationDialog.action === "approved"
                ? t("places.moderation.confirmApprove")
                : t("places.moderation.confirmReject")}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase text-gray-500">
              {moderationDialog.place?.name || t("places.moderation.placeLabel")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase text-gray-600">
              {moderationDialog.action === "approved"
                ? t("places.moderation.noteOptional")
                : t("places.moderation.rejectReasonRequired")}
            </label>
            <Textarea
              value={moderationDialog.comment}
              onChange={(e) =>
                setModerationDialog((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
              rows={4}
              placeholder={
                moderationDialog.action === "approved"
                  ? t("places.moderation.approvePlaceholder")
                  : t("places.moderation.rejectPlaceholder")
              }
              className="rounded-none border-black focus-visible:ring-0 font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-black font-bold uppercase text-xs"
              onClick={() =>
                setModerationDialog({
                  open: false,
                  place: null,
                  action: "approved",
                  comment: "",
                })
              }
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              className={`rounded-none border border-black font-bold uppercase text-xs ${
                moderationDialog.action === "approved"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              onClick={handleModerationConfirm}
            >
              {moderationDialog.action === "approved"
                ? t("places.moderation.confirmApproveBtn")
                : t("places.moderation.confirmRejectBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaceListPage;
