import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import AnimatedIcon from "@/components/ui/animated-icon";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import * as districtService from "@/apis/districtService";
import PlaceDetailDialog from "@/components/place/PlaceDetailDialog";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PLACE_STATUS, PRICE_RANGE_LABELS } from "@/constants/constants";
import { usePermission } from "@/hooks/usePermission";

/**
 * PLACE LIST PAGE
 * Trang quản lý danh sách địa điểm
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
    toggleVerify,
  } = usePlaceStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [districts, setDistricts] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Initialize from URL or defaults
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    categoryId: searchParams.get("categoryId") || "",
    districtId: searchParams.get("districtId") || "",
    status: searchParams.get("status") || "all", // "all" to match select value
    priceRange: searchParams.get("priceRange") || "",
    page: parseInt(searchParams.get("page")) || 1,
    limit: parseInt(searchParams.get("limit")) || 10,
  });

  // Sync from URL to State (when URL changes externally, e.g. sidebar)
  useEffect(() => {
    const newFilters = {
      search: searchParams.get("search") || "",
      categoryId: searchParams.get("categoryId") || "",
      districtId: searchParams.get("districtId") || "",
      status: searchParams.get("status") || "all",
      priceRange: searchParams.get("priceRange") || "",
      page: parseInt(searchParams.get("page")) || 1,
      limit: parseInt(searchParams.get("limit")) || 10,
    };

    // Only update if different to avoid infinite loops if we were doing 2-way sync roughly
    // But honestly, just setting it is fine as long as we don't depend solely on it for "dirty" checks
    setFilters(newFilters);
  }, [searchParams]);

  // Load data when filters change
  useEffect(() => {
    // Convert "all" to undefined/empty for API
    const apiFilters = { ...filters };
    if (apiFilters.status === "all") apiFilters.status = "";
    if (apiFilters.categoryId === "all") apiFilters.categoryId = "";
    if (apiFilters.districtId === "all") apiFilters.districtId = "";

    fetchPlaces(apiFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (newFilters.limit !== 10) params.limit = newFilters.limit.toString();

    setSearchParams(params);
  };

  const handleSearch = (e) => {
    const newVal = e.target.value;
    const newFilters = { ...filters, search: newVal, page: 1 };
    setFilters(newFilters);
    // Debounce/Delay API call is handled by useEffect on filters,
    // but URL update might be too frequent.
    // For now, let's update URL only on blur or create a debounced version.
    // However, existing code was direct. Let's keep direct but maybe update URL.
    // Actually, for search input, updating URL on every keystroke is standard but can be noisy.
    // Let's defer URL update or just update state.
    // The previous implementation updated filter state immediately.
  };

  // Specific handler for search blur or enter key could be better, but let's stick to simple first.

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
    if (!confirm(`Bạn có chắc muốn xóa địa điểm "${place.name}"?`)) return;

    try {
      await deletePlace(place.id);
      toast({
        title: "Thành công",
        description: "Đã xóa địa điểm",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa địa điểm",
      });
    }
  };

  const handleStatusChange = async (place, newStatus) => {
    try {
      await updatePlaceStatus(place.id, newStatus);
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    }
  };

  const handleToggleFeature = async (place) => {
    try {
      await toggleFeature(place.id);
      toast({
        title: "Thành công",
        description: place.isFeatured ? "Đã bỏ nổi bật" : "Đã đặt nổi bật",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: {
        variant: "secondary",
        label: "Nháp",
        className: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      pending: {
        variant: "outline",
        label: "Chờ duyệt",
        className: "text-amber-600 border-amber-200 bg-amber-50",
      },
      approved: {
        variant: "default",
        label: "Đã duyệt",
        className: "bg-green-600 hover:bg-green-700",
      },
      rejected: { variant: "destructive", label: "Từ chối" },
      hidden: {
        variant: "outline",
        label: "Ẩn",
        className: "text-muted-foreground",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản lý địa điểm
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và kiểm duyệt các địa điểm trong hệ thống
          </p>
        </div>
        {hasPermission("place.create") && (
          <Button onClick={handleCreate} size="sm" className="h-9">
            <AnimatedIcon icon={Plus} className="mr-2 h-4 w-4" type="hover" />
            Thêm địa điểm
          </Button>
        )}
      </div>

      {/* Filters & Tabs */}
      <Tabs
        defaultValue="all"
        value={filters.status || "all"}
        onValueChange={(val) => handleFilterChange("status", val)}
        className="w-full"
      >
        <div className="flex flex-col space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="draft">Nháp</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="hidden">Ẩn</TabsTrigger>
          </TabsList>

          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    <AnimatedIcon icon={Search} className="h-4 w-4 text-muted-foreground" type="none" />
                  </div>
                  <Input
                    placeholder="Tìm kiếm theo tên, địa chỉ..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(val) =>
                  handleFilterChange("categoryId", val === "all" ? "" : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* District Filter */}
              <Select
                value={filters.districtId || "all"}
                onValueChange={(val) =>
                  handleFilterChange("districtId", val === "all" ? "" : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả quận/huyện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả quận/huyện</SelectItem>
                  {districts.map((district) => (
                    <SelectItem
                      key={district.id}
                      value={district.id.toString()}
                    >
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
      </Tabs>

      {/* Place List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border-border/40 shadow-sm"
              >
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </Card>
            ))
          : places.map((place) => (
              <Card
                key={place.id}
                className="group overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Image Gallery Grid */}
                <div className="relative w-full bg-muted">
                  {place.images && place.images.length > 0 ? (
                    place.images.length === 1 ? (
                      // Single image - full width
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={place.images[0].imageData}
                          alt={place.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      // Multiple images - grid layout
                      <div className="grid grid-cols-2 gap-1 p-1">
                        {place.images.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative overflow-hidden rounded ${
                              idx === 0 && place.images.length >= 3
                                ? "col-span-2 aspect-[16/9]"
                                : "aspect-square"
                            }`}
                          >
                            <img
                              src={img.imageData}
                              alt={`${place.name} - ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {idx === 3 && place.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  +{place.images.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="aspect-[16/9] flex items-center justify-center bg-secondary/20">
                      <AnimatedIcon icon={MapPin} className="h-12 w-12 text-muted-foreground/30" type="pulse" />
                    </div>
                  )}
                  {/* Status badges overlay */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {getStatusBadge(place.status)}
                    {place.isFeatured && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-sm">
                        <AnimatedIcon icon={Star} className="mr-1 h-3 w-3 fill-white" type="pulse" />
                        Nổi bật
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 overflow-hidden flex-1">
                      <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {place.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1 flex items-center text-xs">
                        <span className="font-medium text-foreground/80">
                          {place.category?.name}
                        </span>
                        <span className="mx-1.5 text-muted-foreground/50">
                          •
                        </span>
                        <AnimatedIcon icon={MapPin} className="h-3 w-3 mr-0.5" type="none" />
                        <span>{place.district?.name}</span>
                        {place.ward && (
                          <>
                            <span className="mx-1 text-muted-foreground/50">
                              ,
                            </span>
                            <span>{place.ward.name}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <AnimatedIcon icon={MoreHorizontal} className="h-4 w-4" type="hover" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(place)}
                        >
                          <AnimatedIcon icon={Info} className="mr-2 h-4 w-4" type="hover" /> Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(place)}>
                          <AnimatedIcon icon={Edit} className="mr-2 h-4 w-4" type="hover" /> Chỉnh sửa
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleToggleFeature(place)}
                        >
                          <AnimatedIcon 
                            icon={Star}
                            className={`mr-2 h-4 w-4 ${
                              place.isFeatured
                                ? "text-yellow-500 fill-yellow-500"
                                : ""
                            }`}
                            type="pulse"
                          />
                          {place.isFeatured ? "Bỏ nổi bật" : "Đặt nổi bật"}
                        </DropdownMenuItem>

                        {place.status === "pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(place, "approved")
                              }
                              className="text-green-600 focus:text-green-700"
                            >
                              <AnimatedIcon icon={CheckCircle} className="mr-2 h-4 w-4" type="tap" />
                              Duyệt ngay
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(place, "rejected")
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <AnimatedIcon icon={XCircle} className="mr-2 h-4 w-4" type="tap" />
                              Từ chối
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        {hasPermission("place.delete") && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(place)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <AnimatedIcon icon={Trash2} className="mr-2 h-4 w-4" type="tap" /> Xóa địa điểm
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 pb-3 text-sm space-y-2.5">
                  {place.priceRange && (
                    <div className="flex items-center gap-2">
                      <span className="text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 text-xs font-medium">
                        {PRICE_RANGE_LABELS[place.priceRange]}
                      </span>
                    </div>
                  )}

                  {place.shortDescription && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {place.shortDescription}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-3 border-t bg-muted/5">
                  <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title="Lượt xem">
                        <AnimatedIcon icon={Eye} className="h-3.5 w-3.5" type="none" />
                        <span className="font-medium">
                          {place.viewCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1" title="Đánh giá">
                        <span className="text-yellow-500 text-sm">★</span>
                        <span className="font-medium">
                          {place.ratingAvg
                            ? parseFloat(place.ratingAvg).toFixed(1)
                            : "N/A"}
                        </span>
                        <span className="text-muted-foreground/60">
                          ({place.ratingCount || 0})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {place.isVerified && (
                        <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                          <AnimatedIcon icon={CheckCircle} className="h-3 w-3 mr-0.5" type="none" />
                          Xác minh
                        </div>
                      )}
                      {place.images && place.images.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground/60">
                          <span>{place.images.length} ảnh</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
      </div>

      {/* Empty State */}
      {!loading && places.length === 0 && (
        <Card className="p-12 text-center">
          <AnimatedIcon icon={MapPin} className="h-12 w-12 mx-auto mb-4 text-gray-400" type="pulse" />
          <h3 className="text-lg font-semibold mb-2">Chưa có địa điểm nào</h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu bằng cách thêm địa điểm đầu tiên
          </p>
          <Button onClick={handleCreate}>
            <AnimatedIcon icon={Plus} className="mr-2 h-4 w-4" type="hover" />
            Thêm địa điểm
          </Button>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleFilterChange("page", filters.page - 1)}
            disabled={filters.page === 1}
          >
            Trước
          </Button>
          <span className="text-sm">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handleFilterChange("page", filters.page + 1)}
            disabled={filters.page === pagination.totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Place Detail Dialog */}
      <PlaceDetailDialog
        place={selectedPlace}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={(place) => handleStatusChange(place, "approved")}
        onReject={(place) => handleStatusChange(place, "rejected")}
      />
    </div>
  );
};

export default PlaceListPage;
