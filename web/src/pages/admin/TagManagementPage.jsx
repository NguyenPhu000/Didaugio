import { useState, useEffect } from "react";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";  
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import useTagStore from "@/stores/tagStore";
import TagList from "@/components/tag/TagList";
import TagFormDialog from "@/components/tag/TagFormDialog";
import { TAG_TYPES } from "@/constants/tagConstants";

/**
 * TAG MANAGEMENT PAGE
 * Admin page quản lý tags
 */

// Extend TAG_TYPES with "all" option for filter
const TAG_TYPES_FILTER = {
  all: "All Types",
  ...TAG_TYPES,
};

export default function TagManagementPage() {
  const { tags, loading, fetchTags, deleteTag } = useTagStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("usageCount");

  useEffect(() => {
    loadTags();
  }, [filterType, sortBy]);

  const loadTags = () => {
    const params = {};
    if (filterType !== "all") params.tagType = filterType;
    if (searchQuery) params.search = searchQuery;
    params.sortBy = sortBy;
    fetchTags(params);
  };

  const handleSearch = () => {
    loadTags();
  };

  const handleAdd = () => {
    setSelectedTag(null);
    setFormOpen(true);
  };

  const handleEdit = (tag) => {
    setSelectedTag(tag);
    setFormOpen(true);
  };

  const handleDeleteClick = (tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;

    try {
      await deleteTag(selectedTag.id);
      toast({
        title: "Thành công",
        description: "Đã xóa thẻ thành công",
      });
      setDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleRefresh = () => {
    loadTags();
    toast({
      title: "Đã làm mới",
      description: "Danh sách thẻ đã được tải lại",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Thẻ</h1>
          <p className="text-muted-foreground">Quản lý thẻ cho địa điểm</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Thẻ
          </Button>
        </div>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Tìm kiếm */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm thẻ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} variant="secondary">
                  Tìm
                </Button>
              </div>
            </div>

            {/* Lọc theo loại */}
            <div className="w-[180px]">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAG_TYPES_FILTER).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sắp xếp */}
            <div className="w-[150px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usageCount">Dùng nhiều nhất</SelectItem>
                  <SelectItem value="name">Tên (A-Z)</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thống kê */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng số thẻ</CardDescription>
            <CardTitle className="text-3xl">{tags.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Thẻ đang hoạt động</CardDescription>
            <CardTitle className="text-3xl">
              {tags.filter((t) => t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng lượt dùng</CardDescription>
            <CardTitle className="text-3xl">
              {tags.reduce((sum, t) => sum + (t.usageCount || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Số loại thẻ</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(tags.map((t) => t.tagType)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Danh sách thẻ */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Thẻ</CardTitle>
          <CardDescription>Tìm thấy {tags.length} thẻ</CardDescription>
        </CardHeader>
        <CardContent>
          <TagList
            tags={tags}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <TagFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedTag(null);
        }}
        tag={selectedTag}
      />

      {/* Xác nhận xóa */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Thẻ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{selectedTag?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Hành động này không thể hoàn tác. Đảm bảo không có địa điểm nào
              đang sử dụng thẻ này.
            </AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
