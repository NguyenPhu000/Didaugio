import { useEffect, useState, memo, useCallback } from "react";
import { Loader2, Check, ChevronRight, Layers } from "lucide-react";
import * as LucideIcons from "lucide-react";
import useCategoryStore from "@/stores/categoryStore";
import { Label, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * CATEGORY SELECTOR - TECHNICAL INDUSTRIAL MINIMALISM
 * Sharp borders, high contrast, grid-based layout
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
    [categories],
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
      // Toggle expansion if has children
      const children = getChildren(category.id);
      if (children.length > 0) {
        toggleExpand(category.id);
      } else {
        // Select if leaf node
        onChange(category.id);
      }
    },
    [getChildren, toggleExpand, onChange],
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
      <div
        key={category.id}
        className={cn(
          "space-y-1 transition-all",
          isChild && "ml-6 pl-4 border-l-2 border-dashed border-gray-300",
        )}
      >
        {/* Category Card */}
        <div
          onClick={() => handleCategoryClick(category)}
          className={cn(
            "group relative flex items-center gap-3 p-3 border transition-all duration-150 cursor-pointer select-none",
            isSelected
              ? "border-black bg-black text-white"
              : "border-black bg-white hover:bg-gray-100",
            // If it's a parent and expanded, give it a specific style
            hasChildren &&
              isExpanded &&
              !isSelected &&
              "bg-gray-50 from-gray-50 to-white",
          )}
        >
          {/* Icon Box */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 flex items-center justify-center border transition-colors",
              isSelected
                ? "bg-white text-black border-white"
                : "bg-gray-100 text-gray-800 border-gray-300 group-hover:border-black group-hover:text-black",
            )}
          >
            {IconComponent ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <span className="text-xs font-bold font-mono">
                {category.name[0]}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
            <h4
              className={cn(
                "font-bold uppercase tracking-tight truncate text-sm font-mono leading-none mb-1",
                isSelected ? "text-white" : "text-black",
              )}
            >
              {category.name}
            </h4>
            {/* Metadata line */}
            <div className="flex items-center space-x-2">
              {!isChild && hasChildren && (
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    isSelected ? "text-gray-300" : "text-gray-500",
                  )}
                >
                  [{children.length} MỤC CON]
                </span>
              )}
              {isSelected && (
                <span className="text-[10px] bg-white text-black px-1 font-bold">
                  ĐANG CHỌN
                </span>
              )}
            </div>
          </div>

          {/* Actions/Indicators */}
          <div className="flex items-center pl-2 border-l border-transparent">
            {hasChildren && (
              <div
                className={cn(
                  "p-1 transition-transform duration-200",
                  isExpanded && "rotate-90",
                )}
              >
                <ChevronRight
                  className={cn(
                    "w-4 h-4",
                    isSelected ? "text-white" : "text-black",
                  )}
                />
              </div>
            )}

            {!hasChildren && isSelected && (
              <Check className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        {/* Children Grid */}
        {isExpanded && hasChildren && (
          <div className="grid grid-cols-1 gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
            {children.map((child) => renderCategory(child, true))}
          </div>
        )}
      </div>
    );
  };

  if (loading && categories.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center border border-black bg-gray-50 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
        <div className="text-sm font-mono uppercase tracking-widest animate-pulse">
          Đang tải dữ liệu...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b-4 border-black pb-2 mb-4">
        <Label className="text-lg font-black uppercase tracking-widest text-black flex items-center gap-2">
          <Layers className="w-5 h-5" />
          DANH MỤC
        </Label>
        {value && (
          <div className="hidden sm:block text-[10px] font-mono bg-black text-white px-2 py-1">
            MÃ: {String(value).substring(0, 8)}
            {String(value).length > 8 ? "..." : ""}
          </div>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
        <div className="grid grid-cols-1 gap-3">
          {rootCategories.map((category) => renderCategory(category))}
        </div>
      </div>

      {error && (
        <div className="border border-red-500 bg-red-50 p-2 text-red-600 text-xs font-mono uppercase flex items-center gap-2">
          <span>⚠ LỖI:</span>
          {error}
        </div>
      )}
    </div>
  );
});

CategorySelector.displayName = "CategorySelector";

export default CategorySelector;
