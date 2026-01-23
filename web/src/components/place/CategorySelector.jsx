import { useEffect, useState, memo, useCallback } from "react";
import { Loader2, Check, ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import useCategoryStore from "@/stores/categoryStore";
import { Label, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * CATEGORY SELECTOR - ACCORDION STYLE
 * Each parent category can expand/collapse independently
 * Better UX with visual hierarchy
 */

// Helper to get icon component from string name - Hoisted
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  const Icon = LucideIcons[iconName];
  return Icon || null;
};

const CategorySelector = memo(({ value, onChange, error }) => {
  const { categories, loading, fetchCategories } = useCategoryStore();
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Auto-expand parent of selected category
  useEffect(() => {
    if (value && categories.length > 0) {
      const selected = categories.find((c) => c.id === value);
      if (selected?.parentId) {
        setExpandedCategories((prev) => new Set([...prev, selected.parentId]));
      }
    }
  }, [value, categories]);

  const rootCategories = categories.filter((c) => !c.parentId);
  const getChildren = useCallback(
    (parentId) => categories.filter((c) => c.parentId === parentId),
    [categories]
  );

  const toggleExpand = useCallback((categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleCategoryClick = useCallback(
    (category) => {
      const children = getChildren(category.id);

      if (children.length > 0) {
        // Has children - toggle expansion
        toggleExpand(category.id);
      } else {
        // Leaf category - select it
        onChange(category.id);
      }
    },
    [onChange, toggleExpand, categories]
  );

  const renderCategory = (category, isChild = false) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = value === category.id;
    const IconComponent = category.icon
      ? getIconComponent(category.icon)
      : null;

    return (
      <div key={category.id} className={cn("space-y-2", isChild && "ml-4")}>
        {/* Category Card */}
        <div
          onClick={() => handleCategoryClick(category)}
          className={cn(
            "group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
            isSelected
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-slate-200 bg-white hover:border-primary/40 hover:shadow-md hover:bg-primary/5",
            isChild && "border-dashed"
          )}
          style={{
            borderTopColor:
              !isChild && category.color ? category.color : undefined,
            borderTopWidth: !isChild ? "3px" : undefined,
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <div className="flex-shrink-0 text-slate-400 group-hover:text-primary transition-colors">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          )}

          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              isSelected
                ? "bg-primary/20 scale-110"
                : "bg-slate-50 group-hover:bg-white group-hover:scale-105",
              !hasChildren && "ml-8"
            )}
            style={{ color: category.color || "hsl(204 85% 36%)" }}
          >
            {IconComponent ? (
              <IconComponent className="h-6 w-6" />
            ) : (
              <span className="text-2xl">🏷️</span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "font-semibold truncate",
                  isSelected
                    ? "text-primary"
                    : "text-slate-800 group-hover:text-primary"
                )}
              >
                {category.name}
              </h3>
              {isSelected && (
                <div className="flex-shrink-0 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            {category.description && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {category.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {hasChildren && (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-600 text-xs"
              >
                {children.length} mục con
              </Badge>
            )}
            <div className="text-xs text-slate-400">
              Cấp {category.level || 1}
            </div>
          </div>
        </div>

        {/* Children (Accordion Content) */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
            {children.map((child) => renderCategory(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Danh mục <span className="text-red-500">*</span>
        </Label>
        <button
          onClick={() => setExpandedCategories(new Set())}
          className="text-xs text-slate-500 hover:text-primary underline transition-colors"
        >
          Thu gọn tất cả
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8 bg-slate-50 rounded-xl border border-dashed">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card
          className={cn(
            "p-4 transition-all duration-300 max-h-[500px] overflow-y-auto",
            error && "border-red-500 ring-2 ring-red-100"
          )}
        >
          <div className="space-y-3">
            {rootCategories.length > 0 ? (
              rootCategories.map((category) => renderCategory(category))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p>Không có danh mục nào</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"></span>
          {error}
        </p>
      )}
    </div>
  );
});

CategorySelector.displayName = "CategorySelector";

export default CategorySelector;
