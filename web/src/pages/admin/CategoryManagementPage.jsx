import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  FolderTree,
  Eye,
  EyeOff,
  MapPin,
  MoreHorizontal,
  Edit,
  Trash2,
  Activity,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import useCategoryStore from "@/stores/categoryStore";
import CategoryFormDialog from "@/components/category/CategoryFormDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { CATEGORY_ICON_MAP } from "@/constants/categoryConstants";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  serial,
  color = "bg-white",
  textColor = "text-black",
}) => (
  <div
    className={`border border-black p-4 relative overflow-hidden group hover:shadow-hard transition-all ${color}`}
  >
    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="font-mono text-[10px] uppercase tracking-widest border border-black px-1.5 py-0.5 bg-white text-black">
          {serial}
        </div>
        <Icon className={`w-5 h-5 ${textColor}`} />
      </div>
      <div className={`text-4xl font-black mb-1 font-technical ${textColor}`}>
        {value}
      </div>
      <div
        className={`text-xs font-bold uppercase tracking-wider ${textColor}`}
      >
        {title}
      </div>
    </div>
  </div>
);

/**
 * CATEGORY MANAGEMENT PAGE - T.I.M STYLE
 */

export default function CategoryManagementPage() {
  const { categoryTree, loading, error, deleteCategory, fetchCategoryTree } =
    useCategoryStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);

  // Custom Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRootFilter, setSelectedRootFilter] = useState("all");

  const toggleExpand = (catId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [catId]: !prev[catId], // Toggle logic (default is false/undefined)
    }));
  };

  const filteredFlatCategories = useMemo(() => {
    const getVisible = (cats, lvl) => {
      let res = [];
      cats.forEach((cat) => {
        // Status Filter
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && !cat.isHidden) ||
          (filterStatus === "hidden" && cat.isHidden);

        const matchesSearch =
          !searchQuery ||
          cat.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (searchQuery) {
          // Search Mode: Flatten and filter
          if (matchesSearch && matchesStatus) {
            res.push({ ...cat, level: lvl });
          }
          if (cat.children && cat.children.length > 0) {
            res = res.concat(getVisible(cat.children, lvl + 1));
          }
        } else {
          // Tree Mode: Respect expansion
          if (matchesStatus) {
            res.push({ ...cat, level: lvl });
          }

          const isExpanded = !!expandedRows[cat.id]; // Default Collasped (undefined/false -> false)

          if (isExpanded && cat.children && cat.children.length > 0) {
            res = res.concat(getVisible(cat.children, lvl + 1));
          }
        }
      });
      return res;
    };

    const rootsToProcess =
      selectedRootFilter === "all"
        ? categoryTree || []
        : (categoryTree || []).filter((c) => c.id === selectedRootFilter);

    return getVisible(rootsToProcess, 0);
  }, [
    categoryTree,
    searchQuery,
    filterStatus,
    expandedRows,
    selectedRootFilter,
  ]);

  // Stats
  const activeCount = filteredFlatCategories.filter((c) => !c.isHidden).length;
  const hiddenCount = filteredFlatCategories.filter((c) => c.isHidden).length;

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
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      toast({
        title: "THÀNH CÔNG",
        description: "Đã xóa danh mục khỏi hệ thống.",
        className: "bg-black text-white border border-primary font-mono",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "LỖI",
        description:
          error.response?.data?.message ||
          "Không thể xóa danh mục này (có thể do còn địa điểm con).",
      });
    }
  };

  const handleRefresh = () => {
    fetchCategoryTree();
    toast({
      title: "ĐÃ LÀM MỚI",
      description: "Dữ liệu danh mục đã được cập nhật.",
      className: "font-mono",
    });
  };

  return (
    <div className="min-h-screen p-8 bg-[#F4F4F4] relative font-sans">
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-4">
            <div className="w-2 h-16 bg-primary"></div>
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter leading-none text-foreground font-technical">
                QUẢN LÝ DANH MỤC
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] bg-black text-white px-2 py-0.5 font-mono uppercase">
                  SYSTEM // CATEGORIES
                </span>
                <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                  {filteredFlatCategories.length} MỤC TRONG CƠ SỞ DỮ LIỆU
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={handleAddRoot}
              className="h-12 bg-black text-white hover:bg-primary hover:text-black hover:shadow-hard transition-all font-bold uppercase rounded-none border border-black px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              TẠO DANH MỤC GỐC
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="TỔNG DANH MỤC"
            value={filteredFlatCategories.length}
            icon={FolderTree}
            serial="CAT-001"
          />
          <StatsCard
            title="ĐANG HIỂN THỊ"
            value={activeCount}
            icon={Eye}
            serial="CAT-002"
            textColor="text-green-600"
          />
          <StatsCard
            title="ĐANG ẨN"
            value={hiddenCount}
            icon={EyeOff}
            serial="CAT-003"
            textColor="text-gray-500"
          />
          <StatsCard
            title="TỔNG ĐỊA ĐIỂM"
            value={filteredFlatCategories.reduce(
              (acc, curr) => acc + (curr._count?.places || 0),
              0,
            )}
            icon={MapPin}
            serial="CAT-004"
            color="bg-yellow-50"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white border border-black p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="flex-1 flex shadow-sm">
            <div className="h-10 w-10 bg-black flex items-center justify-center text-white">
              <Search className="h-4 w-4" />
            </div>
            <Input
              placeholder="TÌM KIẾM DANH MỤC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 px-4 border-y border-r border-black font-mono text-sm uppercase focus:outline-none rounded-none focus-visible:ring-0"
            />
          </div>

          <div className="flex gap-4">
            <Select
              value={selectedRootFilter}
              onValueChange={setSelectedRootFilter}
            >
              <SelectTrigger className="w-[200px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white focus:ring-0">
                <SelectValue placeholder="LỌC THEO DANH MỤC" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black max-h-[300px]">
                <SelectItem value="all">TẤT CẢ DANH MỤC</SelectItem>
                {(categoryTree || []).map((root) => (
                  <SelectItem
                    key={root.id}
                    value={root.id}
                    className="font-mono text-xs uppercase"
                  >
                    {root.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] h-10 rounded-none border-black font-mono text-xs uppercase bg-white focus:ring-0">
                <SelectValue placeholder="TRẠNG THÁI" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-black">
                <SelectItem value="all">TẤT CẢ TRẠNG THÁI</SelectItem>
                <SelectItem value="active">ĐANG HIỂN THỊ</SelectItem>
                <SelectItem value="hidden">ĐANG ẨN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="font-mono text-xs uppercase text-gray-500">
                ĐANG TẢI DỮ LIỆU...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white font-mono text-sm uppercase tracking-wider">
                    <th className="p-4 border-r border-gray-800">
                      TÊN DANH MỤC / CẤP ĐỘ
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px]">
                      ICON / HÌNH
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px]">
                      SLUG
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[120px]">
                      THỨ TỰ
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px]">
                      ĐỊA ĐIỂM
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px]">
                      TRẠNG THÁI
                    </th>
                    <th className="p-4 text-right w-[100px]">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFlatCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-yellow-50 group transition-colors"
                    >
                      <td className="p-4 border-r border-gray-100 font-medium">
                        <div
                          className="flex items-center"
                          style={{ paddingLeft: `${cat.level * 24}px` }}
                        >
                          <div className="flex items-center mr-2">
                            {cat.children && cat.children.length > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(cat.id);
                                }}
                                className="h-5 w-5 flex items-center justify-center border border-gray-300 bg-white hover:bg-black hover:text-white hover:border-black transition-all z-10"
                              >
                                {expandedRows[cat.id] !== false ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            ) : (
                              <div className="w-5 h-5 flex items-center justify-center opacity-50">
                                {cat.level > 0 && (
                                  <div className="w-2 h-px bg-black"></div>
                                )}
                              </div>
                            )}
                          </div>
                          <span
                            className={
                              cat.level === 0
                                ? "font-bold uppercase tracking-tight"
                                : "text-gray-700 font-mono text-sm"
                            }
                          >
                            {cat.name}
                          </span>
                          {cat.level === 0 && (
                            <span className="ml-2 text-[10px] bg-black text-white px-1.5 py-0.5 font-mono">
                              ROOT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        <div className="flex justify-center">
                          {CATEGORY_ICON_MAP[cat.icon] ? (
                            (() => {
                              const Icon = CATEGORY_ICON_MAP[cat.icon];
                              return (
                                <div className="h-8 w-8 flex items-center justify-center border border-gray-200 bg-gray-50">
                                  <Icon className="h-4 w-4 text-black" />
                                </div>
                              );
                            })()
                          ) : (
                            <Avatar className="h-8 w-8 rounded-none border border-gray-200">
                              <AvatarImage src={cat.icon} />
                              <AvatarFallback className="rounded-none bg-gray-100 font-mono">
                                {(cat.name || "?")
                                  .substring(0, 1)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono text-xs text-gray-500">
                        {cat.slug}
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono text-sm">
                        {cat.order || 0}
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        <Badge
                          variant="outline"
                          className="rounded-none border-gray-300 font-mono"
                        >
                          {cat._count?.places || 0} Places
                        </Badge>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        {cat.isHidden ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                            <EyeOff className="w-3 h-3" /> Ẩn
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase">
                            <Eye className="w-3 h-3" /> Hiển thị
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-none border border-transparent hover:border-black hover:bg-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-none border border-black w-56 font-mono text-xs uppercase"
                          >
                            <DropdownMenuLabel>QUẢN LÝ</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {cat.level < 2 && (
                              <DropdownMenuItem
                                onClick={() => handleAddChild(cat)}
                                className="cursor-pointer"
                              >
                                <Plus className="mr-2 h-3 w-3" /> THÊM DANH MỤC
                                CON
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleEdit(cat)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-3 w-3" /> CHỈNH SỬA
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(cat)}
                              className="text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3 w-3" /> XÓA DANH MỤC
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredFlatCategories.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <div className="font-bold uppercase text-gray-400">
                          KHÔNG TÌM THẤY DỮ LIỆU
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-none border border-black p-0 overflow-hidden sm:max-w-md">
          <DialogHeader className="p-6 bg-red-600 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6" /> CẢNH BÁO: QUY TRÌNH XÓA
            </DialogTitle>
            <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
              Thao tác này là vĩnh viễn và không thể hoàn tác. Xin xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white">
            <p className="font-mono text-sm mb-4">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <span className="font-bold">[{categoryToDelete?.name}]</span> khỏi
              cơ sở dữ liệu?
            </p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none border-black hover:bg-gray-100"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
              >
                Xác nhận xóa
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
