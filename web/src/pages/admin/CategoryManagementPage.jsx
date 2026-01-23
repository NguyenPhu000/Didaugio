import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Grid3x3,
  LayoutList,
  Filter,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
  import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
  import { useToast } from "@/hooks/use-toast";
import useCategoryStore from "@/stores/categoryStore";
import CategoryCardList from "@/components/category/CategoryCardList";
import CategoryFormDialog from "@/components/category/CategoryFormDialog";
import CategoryPagination from "@/components/category/CategoryPagination";
import CategoryStats from "@/components/category/CategoryStats";
import CategoryEmptyState from "@/components/category/CategoryEmptyState";

/**
 * CATEGORY MANAGEMENT PAGE
 * Trang quản lý danh mục với Card Grid Layout
 */

export default function CategoryManagementPage() {
  const { categoryTree, loading, error, deleteCategory, fetchCategoryTree } =
    useCategoryStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, hidden
  const [sortBy, setSortBy] = useState("order"); // order, name, createdAt
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter & Sort categories
  const filteredCategories = useMemo(() => {
    return (categoryTree || [])
      .filter((cat) => {
        // Search filter
        if (
          searchQuery &&
          !cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        // Status filter
        if (filterStatus === "active" && cat.isHidden) return false;
        if (filterStatus === "hidden" && !cat.isHidden) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "createdAt")
          return new Date(b.createdAt) - new Date(a.createdAt);
        return (a.order || 0) - (b.order || 0); // default: order
      });
  }, [categoryTree, searchQuery, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  const handleAddRoot = () => {
    setSelectedCategory(null);
    setParentCategory(null);
    setFormOpen(true);
  };

  const handleAddChild = (category) => {
    setSelectedCategory(null);
    setParentCategory(category);
    setFormOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setParentCategory(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    try {
      await deleteCategory(selectedCategory.id);
      toast({
        title: "Thành công",
        description: "Đã xóa danh mục",
      });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleRefresh = () => {
    fetchCategoryTree();
    toast({
      title: "Làm mới",
      description: "Đã tải lại danh sách danh mục",
    });
  };

  const handleViewDetails = (category) => {
    // TODO: Navigate to category detail page or show in modal
    console.log("View details:", category);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản Lý Danh Mục
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh mục địa điểm (tối đa 3 cấp)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddRoot} size="lg" className="font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Danh Mục
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CategoryStats categories={categoryTree || []} />

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
                className="pl-10"
              />
            </div>

            {/* Filter Status */}
            <Tabs
              value={filterStatus}
              onValueChange={(val) => {
                setFilterStatus(val);
                setCurrentPage(1); // Reset to page 1 on filter
              }}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="active">Hiển thị</TabsTrigger>
                <TabsTrigger value="hidden">Ẩn</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val);
                setCurrentPage(1); // Reset to page 1 on sort
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Thứ tự tùy chỉnh</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="createdAt">Mới nhất</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={setViewMode}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid3x3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <LayoutList className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Results count */}
          {(searchQuery || filterStatus !== "all") && (
            <div className="text-sm text-muted-foreground">
              Tìm thấy{" "}
              <span className="font-semibold text-foreground">
                {filteredCategories.length}
              </span>{" "}
              danh mục
              {searchQuery && ` cho "${searchQuery}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Display */}
      {!loading && !error && (categoryTree || []).length === 0 ? (
        <CategoryEmptyState onCreateFirst={handleAddRoot} />
      ) : (
        <>
          <CategoryCardList
            categories={paginatedCategories}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onAddChild={handleAddChild}
            onViewDetails={handleViewDetails}
          />

          {/* Pagination */}
          {!loading && !error && filteredCategories.length > 0 && (
            <CategoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </>
      )}

      {/* Form Dialog */}
      <CategoryFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCategory(null);
          setParentCategory(null);
        }}
        category={selectedCategory}
        parentCategory={parentCategory}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Danh Mục</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              <strong>{selectedCategory?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Hành động này không thể hoàn tác. Đảm bảo không có danh mục con
              hoặc địa điểm nào đang sử dụng danh mục này.
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
