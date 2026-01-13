import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, MapPin, Eye, Edit, Trash2 } from "lucide-react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
import * as districtService from "@/services/districtService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PLACE_STATUS, PRICE_RANGE_LABELS } from "@/config/constants";
import { usePermission } from "@/hooks/usePermission";

/**
 * PLACE LIST PAGE
 * Trang quản lý danh sách địa điểm
 */

const PlaceListPage = () => {
  const navigate = useNavigate();
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
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    districtId: "",
    status: "",
    priceRange: "",
    page: 1,
    limit: 10,
  });

  // Load initial data
  useEffect(() => {
    fetchPlaces(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.categoryId,
    filters.districtId,
    filters.status,
    filters.priceRange,
    filters.page,
    filters.limit,
  ]);

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

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleCreate = () => {
    navigate("/admin/places/new");
  };

  const handleEdit = (place) => {
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
      draft: { variant: "secondary", label: "Nháp" },
      pending: { variant: "default", label: "Chờ duyệt" },
      approved: { variant: "default", label: "Đã duyệt", className: "bg-green-500" },
      rejected: { variant: "destructive", label: "Từ chối" },
      hidden: { variant: "outline", label: "Ẩn" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý địa điểm</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách địa điểm du lịch, ẩm thực, giải trí tại Cần Thơ
          </p>
        </div>
        {hasPermission("place.create") && (
          <Button onClick={handleCreate} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Thêm địa điểm
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
            onValueChange={(val) => handleFilterChange("categoryId", val === "all" ? "" : val)}
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
            onValueChange={(val) => handleFilterChange("districtId", val === "all" ? "" : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả quận/huyện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả quận/huyện</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.id} value={district.id.toString()}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || "all"}
            onValueChange={(val) => handleFilterChange("status", val === "all" ? "" : val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="hidden">Ẩn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Place List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </Card>
            ))
          : places.map((place) => (
              <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {place.images && place.images.length > 0 ? (
                    <img
                      src={place.images[0].url}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {place.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">
                      ⭐ Nổi bật
                    </Badge>
                  )}
                  {place.isVerified && (
                    <Badge className="absolute top-2 right-2 bg-blue-500">
                      ✓ Xác minh
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {place.name}
                    </h3>
                    {getStatusBadge(place.status)}
                  </div>

                  {place.category && (
                    <Badge variant="outline" className="mb-2">
                      {place.category.name}
                    </Badge>
                  )}

                  {place.shortDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {place.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">
                      {place.district?.name}
                      {place.ward && `, ${place.ward.name}`}
                    </span>
                  </div>

                  {place.priceRange && (
                    <div className="text-sm mb-3">
                      💰 {PRICE_RANGE_LABELS[place.priceRange]}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span>👁 {place.viewCount || 0}</span>
                    <span>⭐ {place.averageRating?.toFixed(1) || "N/A"}</span>
                    <span>💬 {place.reviewCount || 0}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(place)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Sửa
                    </Button>
                    {hasPermission("place.delete") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(place)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Empty State */}
      {!loading && places.length === 0 && (
        <Card className="p-12 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">
            Chưa có địa điểm nào
          </h3>
          <p className="text-muted-foreground mb-4">
            Bắt đầu bằng cách thêm địa điểm đầu tiên
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
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
    </div>
  );
};

export default PlaceListPage;
