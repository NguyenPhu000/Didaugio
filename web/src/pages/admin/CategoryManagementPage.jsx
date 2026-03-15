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
    className={`border border-black p-5 relative overflow-hidden group hover:shadow-hard transition-all ${color}`}
  >
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
      <Icon className="w-32 h-32" />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
      <div className="flex justify-between items-start">
        <div className="px-2 py-0.5 border border-black bg-white text-black font-mono text-xs font-bold tracking-widest">
          {serial}
        </div>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <div>
        <div className={`text-4xl md:text-5xl font-black tracking-tighter mb-1 ${textColor}`}>{value}</div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-gray-700">{title}</div>
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

  // Calculate actual stats (not affected by expansion state)
  // BUG FIX: Separate actual total categories from filtered display count
  // Previously: filteredFlatCategories.length would increase when expanding subcategories
  // Now: actualTotalCategories always shows true total regardless of UI expansion state
  const actualTotalCategories = useMemo(() => {
    const countAll = (categories) => {
      return categories.reduce((total, cat) => {
        return total + 1 + (cat.children ? countAll(cat.children) : 0);
      }, 0);
    };
    return categoryTree ? countAll(categoryTree) : 0;
  }, [categoryTree]);

  const actualActiveCount = useMemo(() => {
    const countActive = (categories) => {
      return categories.reduce((total, cat) => {
        const thisActive = !cat.isHidden ? 1 : 0;
        return (
          total + thisActive + (cat.children ? countActive(cat.children) : 0)
        );
      }, 0);
    };
    return categoryTree ? countActive(categoryTree) : 0;
  }, [categoryTree]);

  const actualHiddenCount = actualTotalCategories - actualActiveCount;

  // Stats for currently visible (filtered) categories
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
    <div className="min-h-screen p-8 bg-background relative">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black pb-8">
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-16 bg-yellow-400"></div>
            <div>
              <h1 className="text-4xl md:text-5xl uppercase font-black tracking-tight mb-2">QUẢN LÝ DANH MỤC</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                <span className="bg-black text-white px-2.5 py-0.5 text-xs font-mono font-bold tracking-widest uppercase">
                  TAXONOMY // CATEGORIES
                </span>
                <span className="text-gray-500 font-mono text-xs font-bold tracking-widest uppercase">
                  PHÂN LOẠI VÀ TỔ CHỨC DỮ LIỆU
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 shrink-0 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="h-12 w-12 flex items-center justify-center border border-black bg-white hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-black ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleAddRoot}
              className="h-12 px-6 flex items-center gap-2 border border-black bg-black text-white font-mono text-sm font-bold tracking-widest uppercase hover:bg-yellow-400 hover:text-black transition-colors"
            >
              <Plus className="h-4 w-4" />
              TẠO DANH MỤC GỐC
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <StatsCard
            title="TỔNG DANH MỤC"
            value={actualTotalCategories}
            icon={FolderTree}
            serial="CAT-001"
          />
          <StatsCard
            title="ĐANG HIỂN THỊ"
            value={actualActiveCount}
            icon={Eye}
            serial="CAT-002"
            textColor="text-emerald-500"
          />
          <StatsCard
            title="ĐANG ẨN"
            value={actualHiddenCount}
            icon={EyeOff}
            serial="CAT-003"
            textColor="text-gray-400"
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

        {/* Search & Filter - Consolidated Bar */}
        <div className="flex flex-col md:flex-row w-full border border-black bg-white min-h-[56px] shadow-sm mt-8">
          {/* Search Input */}
          <div className="flex flex-1 border-b md:border-b-0 md:border-r border-black group">
            <div className="h-full w-14 bg-black flex items-center justify-center shrink-0">
              <Search className="h-5 w-5 text-white" />
            </div>
            <input
              type="text"
              placeholder="TÌM KIẾM DANH MỤC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-zinc-50 px-4 font-mono text-sm uppercase focus:outline-none focus:bg-yellow-50 placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* Root Filter segment */}
          <div className="flex relative border-b md:border-b-0 md:border-r border-black md:w-64">
            <select
              value={selectedRootFilter}
              onChange={(e) => setSelectedRootFilter(e.target.value)}
              className="w-full h-full px-4 appearance-none outline-none font-mono text-xs uppercase cursor-pointer bg-white z-10 hover:bg-gray-50 focus:bg-yellow-50"
            >
              <option value="all">TẤT CẢ DANH MỤC</option>
              {(categoryTree || []).map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Status Filter segment */}
          <div className="flex relative md:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-full px-4 appearance-none outline-none font-mono text-xs uppercase cursor-pointer bg-white z-10 hover:bg-gray-50 focus:bg-yellow-50"
            >
              <option value="all">TẤT CẢ TRẠNG THÁI</option>
              <option value="active">ĐANG HIỂN THỊ</option>
              <option value="hidden">ĐANG ẨN</option>
            </select>
            <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
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
                  <tr className="bg-black text-white font-mono text-[11px] md:text-sm font-bold uppercase tracking-widest">
                    <th className="p-4 border-r border-gray-800 text-left">
                      TÊN DANH MỤC / CẤP ĐỘ
                    </th>
                    <th className="p-4 border-r border-gray-800 text-center w-[120px]">ICON / HÌNH</th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      SLUG
                    </th>
                    <th className="p-4 border-r border-gray-800 text-center w-[100px]">THỨ TỰ</th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      ĐỊA ĐIỂM
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      TRẠNG THÁI
                    </th>
                    <th className="p-4 text-center w-[100px]">THAO TÁC</th>
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
                                className="h-6 w-6 flex items-center justify-center border border-gray-300 bg-white hover:border-black transition-all z-10"
                              >
                                {expandedRows[cat.id] !== false ? (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-600" />
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
                          {/* Name */}
<div className="flex items-center gap-2">
  <span
    className={
      cat.level === 0
        ? "font-black uppercase tracking-tight text-[15px]"
        : "text-gray-700 font-bold text-sm"
    }
  >
    {cat.name}
  </span>
  {cat.level === 0 && (
    <span className="bg-black text-white px-1.5 py-[2px] text-[9px] font-mono tracking-widest ml-1">
      ROOT
    </span>
  )}
</div>
                          {cat.level === 0 && (
                            <span className="ml-2 text-[10px] bg-black text-white px-1.5 py-0.5 font-mono">
                              ROOT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100 text-center">
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
                      <td className="p-4 border-r border-gray-100 font-mono text-xs text-gray-500 lowercase max-w-[140px] truncate text-center mx-auto">
                        {cat.slug}
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono font-bold text-[13px] text-center"> {cat.order || 0} </td>
                      <td className="p-4 border-r border-gray-100 text-center">
                        <span className="border border-gray-300 px-2 py-0.5 text-xs text-gray-600 font-mono inline-block"> {cat._count?.places || 0} Places </span>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        {cat.isHidden ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase font-mono">
                            <EyeOff className="w-3 h-3" /> Ẩn
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-600 uppercase font-mono">
                            <Eye className="w-3 h-3" /> Hiển thị
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 text-black bg-transparent hover:bg-gray-100 flex items-center justify-center focus:outline-none m-auto">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
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
                <span className="font-bold">[{categoryToDelete?.name}]</span>{" "}
                khỏi cơ sở dữ liệu?
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline"
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
    </div>
  );
}
