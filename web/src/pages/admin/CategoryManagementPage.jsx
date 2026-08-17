// MAP: CategoryManagementPage
// ├── UI: @/components/admin/categories/{CategoryHeaderFilters, CategoryTreeTable, CategoryDeleteDialog}
// └── API: @/hooks/queries/useCategoryQueries

import { useState, useMemo } from "react";
import {
  FolderTree,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCategoryTree,
  useDeleteCategory,
} from "@/hooks/queries/useCategoryQueries";
import CategoryFormDialog from "@/components/category/CategoryFormDialog";
import TimStatsCard from "@/components/admin/TimStatsCard";
import { useTranslation } from "react-i18next";

// Extracted Sub-Components
import CategoryHeaderFilters from "@/components/admin/categories/CategoryHeaderFilters";
import CategoryTreeTable from "@/components/admin/categories/CategoryTreeTable";
import CategoryDeleteDialog from "@/components/admin/categories/CategoryDeleteDialog";

export default function CategoryManagementPage() {
  const { t } = useTranslation();
  const {
    data: categoryTree = [],
    isLoading,
    refetch,
  } = useCategoryTree(null, 3, true);
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
      {/* Header & Filter Controls */}
      <CategoryHeaderFilters
        handleRefresh={handleRefresh}
        handleAddRoot={handleAddRoot}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedRootFilter={selectedRootFilter}
        setSelectedRootFilter={setSelectedRootFilter}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        categoryTree={categoryTree}
      />

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

      {/* Categories Tree Table */}
      <CategoryTreeTable
        isLoading={isLoading}
        filteredFlatCategories={filteredFlatCategories}
        expandedRows={expandedRows}
        toggleExpand={toggleExpand}
        handleAddChild={handleAddChild}
        handleEdit={handleEdit}
        handleDeleteClick={handleDeleteClick}
      />

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
      <CategoryDeleteDialog
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        categoryToDelete={categoryToDelete}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
