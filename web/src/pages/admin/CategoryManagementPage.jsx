import { useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCategoryTree, useDeleteCategory } from "@/hooks/queries/useCategoryQueries";
import CategoryFormDialog from "@/components/category/CategoryFormDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MdiCategoryIcon } from "@/components/category/MdiCategoryIcon";
import TimStatsCard from "@/components/admin/TimStatsCard";
import { useTranslation } from "react-i18next";

/**
 * CATEGORY MANAGEMENT PAGE - T.I.M STYLE
 */

export default function CategoryManagementPage() {
  const { t } = useTranslation();
  const { data: categoryTree = [], isLoading, refetch } = useCategoryTree(null, 3, true);
  const deleteMutation = useDeleteCategory();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);

  // Custom Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRootFilter, setSelectedRootFilter] = useState("all");

  const toggleExpand = (catId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const filteredFlatCategories = useMemo(() => {
    const getVisible = (cats, lvl) => {
      let res = [];
      cats.forEach((cat) => {
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && cat.isActive) ||
          (filterStatus === "hidden" && !cat.isActive);

        const matchesSearch =
          !searchQuery ||
          cat.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (searchQuery) {
          if (matchesSearch && matchesStatus) {
            res.push({ ...cat, level: lvl });
          }
          if (cat.children && cat.children.length > 0) {
            res = res.concat(getVisible(cat.children, lvl + 1));
          }
        } else {
          if (matchesStatus) {
            res.push({ ...cat, level: lvl });
          }

          const isExpanded = !!expandedRows[cat.id];

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
        const thisActive = cat.isActive ? 1 : 0;
        return (
          total + thisActive + (cat.children ? countActive(cat.children) : 0)
        );
      }, 0);
    };
    return categoryTree ? countActive(categoryTree) : 0;
  }, [categoryTree]);

  const actualHiddenCount = actualTotalCategories - actualActiveCount;

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
      await deleteMutation.mutateAsync(categoryToDelete.id);
      toast({
        title: t("common.success"),
        description: t("categories.messages.deleteSuccess"),
        className: "bg-black text-white border border-primary font-mono",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error.response?.data?.message ||
          t("categories.errors.deleteFailed"),
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: t("common.refreshed"),
      description: t("categories.messages.refreshed"),
      className: "font-mono",
    });
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phân loại & Danh mục Địa điểm
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            {t("categories.title")}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("categories.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Đồng bộ lại"
          >
            <RefreshCw className={`h-4 w-4 text-slate-800 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleAddRoot}
            className="h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-4 w-4 text-[#F3E600]" />
            <span>{t("categories.createRoot")}</span>
          </button>
        </div>
      </header>

      {/* Stats Cards Strip */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TimStatsCard
          title={t("categories.stats.total")}
          value={actualTotalCategories}
          icon={FolderTree}
        />
        <TimStatsCard
          title={t("categories.stats.active")}
          value={actualActiveCount}
          icon={Eye}
        />
        <TimStatsCard
          title={t("categories.stats.hidden")}
          value={actualHiddenCount}
          icon={EyeOff}
        />
        <TimStatsCard
          title={t("categories.stats.totalPlaces")}
          value={filteredFlatCategories.reduce(
            (acc, curr) => acc + (curr._count?.places || 0),
            0
          )}
          icon={MapPin}
        />
      </section>

      {/* Search & Filters */}
      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t("categories.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-56">
            <select
              value={selectedRootFilter}
              onChange={(e) => setSelectedRootFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-semibold text-slate-800 border border-black/[0.05] appearance-none focus:outline-none focus:bg-white"
            >
              <option value="all">{t("categories.filters.allCategories")}</option>
              {(categoryTree || []).map((root) => (
                <option key={root.id} value={root.id}>
                  {root.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-44">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-10 pl-3 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-semibold text-slate-800 border border-black/[0.05] appearance-none focus:outline-none focus:bg-white"
            >
              <option value="all">{t("categories.filters.allStatuses")}</option>
              <option value="active">{t("categories.filters.active")}</option>
              <option value="hidden">{t("categories.filters.hidden")}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Categories Tree Table */}
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500">{t("common.loading")}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                  <th className="p-4">{t("categories.table.name")}</th>
                  <th className="p-4 text-center w-[90px]">{t("categories.table.icon")}</th>
                  <th className="p-4 text-center w-[140px]">SLUG</th>
                  <th className="p-4 text-center w-[90px]">{t("categories.table.order")}</th>
                  <th className="p-4 text-center w-[130px]">{t("categories.table.places")}</th>
                  <th className="p-4 text-center w-[130px]">{t("categories.table.status")}</th>
                  <th className="p-4 text-right w-[100px]">{t("categories.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {filteredFlatCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#FAF9F5] group transition-colors"
                  >
                    <td className="p-4 font-medium">
                      <div
                        className="flex items-center"
                        style={{ paddingLeft: `${cat.level * 24}px` }}
                      >
                        <div className="flex items-center mr-2">
                          {cat.children && cat.children.length > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(cat.id);
                              }}
                              className="h-6 w-6 rounded-lg flex items-center justify-center border border-black/[0.08] bg-white hover:bg-[#F5F4F0] transition-all z-10"
                            >
                              {expandedRows[cat.id] !== false ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center opacity-30">
                              {cat.level > 0 && (
                                <div className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Name */}
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              cat.level === 0
                                ? "font-bold text-slate-950 text-sm"
                                : "text-slate-800 font-semibold text-xs"
                            }
                          >
                            {cat.name}
                          </span>
                          {cat.level === 0 && (
                            <span className="bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                              ROOT
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        {String(cat.icon || "").startsWith("http") ? (
                          <Avatar className="h-8 w-8 rounded-xl border border-black/[0.06]">
                            <AvatarImage src={cat.icon} />
                            <AvatarFallback className="rounded-xl bg-slate-100 font-mono text-xs">
                              {(cat.name || "?").substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center border border-black/[0.06] bg-[#FAF9F5]">
                            <MdiCategoryIcon category={cat} className="h-4 w-4 text-slate-900" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400 lowercase max-w-[140px] truncate text-center mx-auto">
                      {cat.slug}
                    </td>
                    <td className="p-4 font-mono font-bold text-xs text-center tabular-nums text-slate-900">
                      {cat.order || 0}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-semibold inline-block">
                        {cat._count?.places || 0} địa điểm
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {!cat.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <EyeOff className="w-3 h-3 text-slate-400" /> {t("categories.status.hidden")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFDE6] text-slate-950 border border-[#F3E600]/80">
                          <Eye className="w-3 h-3 text-slate-900" /> {t("categories.status.active")}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-8 w-8 rounded-xl border border-black/[0.06] bg-white hover:bg-[#F5F4F0] text-slate-700 flex items-center justify-center transition-all ml-auto"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-1.5 w-48 text-xs"
                        >
                          <DropdownMenuLabel className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{t("categories.management")}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-black/[0.04]" />
                          {cat.level < 2 && (
                            <DropdownMenuItem
                              onClick={() => handleAddChild(cat)}
                              className="rounded-xl cursor-pointer py-2 font-medium"
                            >
                              <Plus className="mr-2 h-3.5 w-3.5 text-slate-700" /> {t("categories.actions.addChild")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleEdit(cat)}
                            className="rounded-xl cursor-pointer py-2 font-medium"
                          >
                            <Edit className="mr-2 h-3.5 w-3.5 text-slate-700" /> {t("categories.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/[0.04]" />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(cat)}
                            className="rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer py-2 font-semibold"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" /> {t("categories.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredFlatCategories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <FolderOpen className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                      <div className="font-bold text-slate-800">
                        {t("common.noData")}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Không tìm thấy danh mục nào.</p>
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
        <DialogContent className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> {t("categories.deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              {t("categories.deleteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-slate-700 leading-relaxed">
              {t("categories.deleteDialog.message", { name: categoryToDelete?.name })}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-black/[0.04]">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-full text-xs font-semibold h-9 px-4"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-5 shadow-sm"
            >
              {t("common.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
