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
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
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
              <h1 className="text-4xl md:text-5xl uppercase font-black tracking-tight mb-2">
                {t("categories.title")}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                <span className="bg-black text-white px-2.5 py-0.5 text-xs font-mono font-bold tracking-widest uppercase">
                  TAXONOMY // CATEGORIES
                </span>
                <span className="text-gray-500 font-mono text-xs font-bold tracking-widest uppercase">
                  {t("categories.subtitle")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 shrink-0 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              className="h-12 w-12 flex items-center justify-center border border-black bg-white hover:bg-gray-100 transition-colors"
            >
              <RefreshCw
                className={`h-5 w-5 text-black ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleAddRoot}
              className="h-12 px-6 flex items-center gap-2 border border-black bg-black text-white font-mono text-sm font-bold tracking-widest uppercase hover:bg-yellow-400 hover:text-black transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("categories.createRoot")}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <TimStatsCard
            title={t("categories.stats.total")}
            value={actualTotalCategories}
            icon={FolderTree}
            serial="CAT-001"
          />
          <TimStatsCard
            title={t("categories.stats.active")}
            value={actualActiveCount}
            icon={Eye}
            serial="CAT-002"
            textColor="text-emerald-500"
          />
          <TimStatsCard
            title={t("categories.stats.hidden")}
            value={actualHiddenCount}
            icon={EyeOff}
            serial="CAT-003"
            textColor="text-gray-400"
          />
          <TimStatsCard
            title={t("categories.stats.totalPlaces")}
            value={filteredFlatCategories.reduce(
              (acc, curr) => acc + (curr._count?.places || 0),
              0
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
              placeholder={t("categories.searchPlaceholder")}
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
              <option value="all">{t("categories.filters.allCategories")}</option>
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
              <option value="all">{t("categories.filters.allStatuses")}</option>
              <option value="active">{t("categories.filters.active")}</option>
              <option value="hidden">{t("categories.filters.hidden")}</option>
            </select>
            <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="font-mono text-xs uppercase text-gray-500">
                {t("common.loading")}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white font-mono text-[11px] md:text-sm font-bold uppercase tracking-widest">
                    <th className="p-4 border-r border-gray-800 text-left">
                      {t("categories.table.name")}
                    </th>
                    <th className="p-4 border-r border-gray-800 text-center w-[120px]">
                      {t("categories.table.icon")}
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      SLUG
                    </th>
                    <th className="p-4 border-r border-gray-800 text-center w-[100px]">
                      {t("categories.table.order")}
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      {t("categories.table.places")}
                    </th>
                    <th className="p-4 border-r border-gray-800 w-[150px] text-center">
                      {t("categories.table.status")}
                    </th>
                    <th className="p-4 text-center w-[100px]">{t("categories.table.actions")}</th>
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
                          {String(cat.icon || "").startsWith("http") ? (
                            <Avatar className="h-8 w-8 rounded-none border border-gray-200">
                              <AvatarImage src={cat.icon} />
                              <AvatarFallback className="rounded-none bg-gray-100 font-mono">
                                {(cat.name || "?")
                                  .substring(0, 1)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center border border-gray-200 bg-gray-50">
                              <MdiCategoryIcon category={cat} className="h-4 w-4 text-black" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono text-xs text-gray-500 lowercase max-w-[140px] truncate text-center mx-auto">
                        {cat.slug}
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono font-bold text-[13px] text-center">
                        {" "}
                        {cat.order || 0}{" "}
                      </td>
                      <td className="p-4 border-r border-gray-100 text-center">
                        <span className="border border-gray-300 px-2 py-0.5 text-xs text-gray-600 font-mono inline-block">
                          {" "}
                          {cat._count?.places || 0} Places{" "}
                        </span>
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        {!cat.isActive ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 uppercase font-mono">
                            <EyeOff className="w-3 h-3" /> {t("categories.status.hidden")}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-green-600 uppercase font-mono">
                            <Eye className="w-3 h-3" /> {t("categories.status.active")}
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
                            <DropdownMenuLabel>{t("categories.management")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {cat.level < 2 && (
                              <DropdownMenuItem
                                onClick={() => handleAddChild(cat)}
                                className="cursor-pointer"
                              >
                                <Plus className="mr-2 h-3 w-3" /> {t("categories.actions.addChild")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleEdit(cat)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-3 w-3" /> {t("categories.actions.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(cat)}
                              className="text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3 w-3" /> {t("categories.actions.delete")}
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
                          {t("common.noData")}
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
                <Activity className="h-6 w-6" /> {t("categories.deleteDialog.title")}
              </DialogTitle>
              <DialogDescription className="text-red-100 font-mono text-xs mt-2 uppercase">
                {t("categories.deleteDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 bg-white">
              <p className="font-mono text-sm mb-4">
                {t("categories.deleteDialog.message", { name: categoryToDelete?.name })}
              </p>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="rounded-none border-black hover:bg-gray-100"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="rounded-none bg-red-600 hover:bg-red-700 font-bold uppercase"
                >
                  {t("common.confirmDelete")}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
