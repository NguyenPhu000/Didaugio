import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import useCategoryStore from "@/stores/categoryStore";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * CATEGORY SELECTOR
 * Component để chọn category (hỗ trợ hierarchical)
 */

const CategorySelector = ({ value, onChange, error }) => {
  const { categories, loading, fetchCategories } = useCategoryStore();

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  // Build category tree for display
  const buildCategoryTree = () => {
    const categoryMap = new Map();
    const roots = [];

    // Create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const categoryTree = buildCategoryTree();

  // Flatten tree for select options with indentation
  const flattenCategories = (tree, level = 0) => {
    const result = [];
    tree.forEach((category) => {
      result.push({ ...category, level });
      if (category.children && category.children.length > 0) {
        result.push(...flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categoryTree);

  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        Danh mục <span className="text-red-500">*</span>
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
        disabled={loading}
      >
        <SelectTrigger
          className={cn(
            "w-full",
            error && "border-red-500"
          )}
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải...
            </div>
          ) : (
            <SelectValue placeholder="Chọn danh mục" />
          )}
        </SelectTrigger>
        <SelectContent>
          {flatCategories.map((category) => (
            <SelectItem
              key={category.id}
              value={category.id.toString()}
              style={{ paddingLeft: `${category.level * 16 + 8}px` }}
            >
              <div className="flex items-center">
                {category.icon && (
                  <span className="mr-2" style={{ color: category.color }}>
                    {category.icon}
                  </span>
                )}
                {category.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CategorySelector;
