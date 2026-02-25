import { useEffect, useState } from "react";
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
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import * as districtService from "@/apis/districtService";

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

/**
 * PLACE LIST PAGE - T.I.M STYLE OVERHAUL (VIETNAMESE)
 */

const PlaceListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const {
    places,
    loading,
    pagination,
    fetchPlaces,
    deletePlace,
    updatePlaceStatus,
    toggleFeature,
  } = usePlaceStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [districts, setDistricts] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  // Initialize from URL or defaults
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    categoryId: searchParams.get("categoryId") || "",
    districtId: searchParams.get("districtId") || "",
    status: searchParams.get("status") || "all",
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
      status: searchParams.get("status") || "all",
      priceRange: searchParams.get("priceRange") || "",
      page: parseInt(searchParams.get("page")) || 1,
      limit: parseInt(searchParams.get("limit")) || 12,
    };
    setFilters(newFilters);
  }, [searchParams]);

  // Load data when filters change
  useEffect(() => {
    const apiFilters = { ...filters };
    if (apiFilters.status === "all") apiFilters.status = "";
    if (apiFilters.categoryId === "all") apiFilters.categoryId = "";
    if (apiFilters.districtId === "all") apiFilters.districtId = "";

    fetchPlaces(apiFilters);
  }, [filters]);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [categories.length]);

  useEffect(() => {
    districtService.getAllDistricts().then((res) => {
      setDistricts(res.data || []);
    });
  }, []);

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
    if (newFilters.page > 1) params.page = newFilters.page.toString();
    if (newFilters.limit !== 12) params.limit = newFilters.limit.toString();
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    // Handling search on enter would be better but let's stick to update
  };

  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      const newFilters = { ...filters, search: e.target.value, page: 1 };
      setFilters(newFilters);
      updateURL(newFilters);
    }
  };

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
    if (!confirm(`XÁC NHẬN XÓA: "${place.name}"?`)) return;

    try {
      await deletePlace(place.id);
      toast({
        title: "HỆ THỐNG",
        description: "Đã xóa địa điểm khỏi cơ sở dữ liệu.",
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description: error.message || "Không thể thực hiện tác vụ.",
      });
    }
  };

  const handleStatusChange = async (place, newStatus) => {
    try {
      await updatePlaceStatus(place.id, newStatus);
      toast({
        title: "TRẠNG THÁI",
        description: "Cập nhật trạng thái thành công.",
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description: error.message,
      });
    }
  };

  const handleToggleFeature = async (place) => {
    try {
      await toggleFeature(place.id);
      toast({
        title: "NỔI BẬT",
        description: place.isFeatured
          ? "Đã gỡ bỏ nổi bật."
          : "Đã thêm vào danh sách nổi bật.",
        className: "bg-black text-white border border-primary font-mono",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description: error.message,
      });
    }
  };

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
              <h1 className="tim-title">QUẢN LÝ ĐỊA ĐIỂM</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  DATABASE // PLACES
                </span>
                <p className="tim-meta">KIỂM SOÁT VÀ ĐIỀU PHỐI DỮ LIỆU</p>
              </div>
            </div>
          </div>
          {hasPermission("places.create") && (
            <Button
              onClick={handleCreate}
              className="h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all tim-button rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              KHỞI TẠO ĐỊA ĐIỂM
            </Button>
          )}
        </div>

        {/* Quick Stats Bar */}
        {!loading &&
          places.length > 0 &&
          (() => {
            const total = places.length;
            const approved = places.filter(
              (p) => p.status === "approved",
            ).length;
            const pending = places.filter((p) => p.status === "pending").length;
            const featured = places.filter((p) => p.isFeatured).length;
            const items = [
              { label: "TỔNG", value: total, cls: "border-black" },
              {
                label: "ĐÃ DUYỆT",
                value: approved,
                cls: "border-emerald-500 text-emerald-700",
              },
              {
                label: "CHỜ DUYỆT",
                value: pending,
                cls: "border-yellow-400 text-yellow-700",
              },
              {
                label: "NỔI BẬT",
                value: featured,
                cls: "border-primary text-primary",
              },
            ];
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map(({ label, value, cls }) => (
                  <div
                    key={label}
                    className={`bg-white border-l-4 border border-black pl-4 py-3 pr-4 flex items-center justify-between ${cls}`}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                    <span className="font-black font-mono text-xl">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}

        {/* Filter Bar */}
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          {/* Search */}
          <div className="flex-1 flex shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <input
              placeholder="TÌM KIẾM THEO TÊN, ĐỊA CHỈ [ENTER]..."
              defaultValue={filters.search}
              onKeyDown={onSearchKey}
              className="flex-1 h-10 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => handleFilterChange("status", val)}
            >
              <SelectTrigger className="w-[150px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder="TRẠNG THÁI" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">TẤT CẢ</SelectItem>
                <SelectItem value="pending">CHỜ DUYỆT</SelectItem>
                <SelectItem value="approved">ĐÃ DUYỆT</SelectItem>
                <SelectItem value="draft">NHÁP</SelectItem>
                <SelectItem value="rejected">TỪ CHỐI</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.categoryId || "all"}
              onValueChange={(val) => handleFilterChange("categoryId", val)}
            >
              <SelectTrigger className="w-[180px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white">
                <SelectValue placeholder="DANH MỤC" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">TẤT CẢ DANH MỤC</SelectItem>
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-black border-t-primary rounded-full animate-spin"></div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              LOADING DATA STREAM...
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
                        ? place.name.substring(0, 30) + "..."
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
                          <DropdownMenuLabel>TÁC VỤ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(place)}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <Info className="mr-2 h-3 w-3" /> CHI TIẾT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleFeature(place)}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <Star className="mr-2 h-3 w-3" />{" "}
                            {place.isFeatured ? "GỠ NỔI BẬT" : "ĐẶT NỔI BẬT"}
                          </DropdownMenuItem>

                          {place.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(place, "approved")
                                }
                                className="text-green-600 hover:bg-green-50 cursor-pointer text-bold"
                              >
                                <CheckCircle className="mr-2 h-3 w-3" /> DUYỆT
                                NHANH
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(place, "rejected")
                                }
                                className="text-red-600 hover:bg-red-50 cursor-pointer text-bold"
                              >
                                <XCircle className="mr-2 h-3 w-3" /> TỪ CHỐI
                              </DropdownMenuItem>
                            </>
                          )}

                          {hasPermission("places.delete") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(place)}
                                className="text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-3 w-3" /> XÓA BỎ
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
                        CHỈNH SỬA
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && places.length === 0 && (
          <div className="text-center py-20 border border-dashed border-black bg-white/50">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-black text-xl uppercase mb-2">
              KHÔNG CÓ DỮ LIỆU
            </h3>
            <p className="font-mono text-xs text-muted-foreground mb-6 uppercase">
              HỆ THỐNG KHÔNG TÌM THẤY ĐỊA ĐIỂM NÀO KHỚP VỚI BỘ LỌC.
            </p>
            <Button
              onClick={handleCreate}
              className="rounded-none bg-black text-white px-8 font-bold uppercase hover:bg-primary hover:text-black"
            >
              KHỞI TẠO MỚI
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black pt-4 font-mono text-xs uppercase">
            <div>
              TRANG {pagination.page} / {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() => handleFilterChange("page", filters.page - 1)}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white"
              >
                TRƯỚC
              </Button>
              <Button
                variant="outline"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handleFilterChange("page", filters.page + 1)}
                className="rounded-none border-black h-8 hover:bg-black hover:text-white"
              >
                SAU
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
          onApprove={(place) => handleStatusChange(place, "approved")}
          onReject={(place) => handleStatusChange(place, "rejected")}
        />
      </Suspense>
    </div>
  );
};

export default PlaceListPage;
