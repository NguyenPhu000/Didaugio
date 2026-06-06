import { Loader2 } from "lucide-react";
import { useCategoryTree } from "@/hooks/queries/useCategoryQueries";
import CategoryTreeItem from "./CategoryTreeItem";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * CATEGORY TREE
 * Hiển thị full category tree
 */

export default function CategoryTree({
  onEdit,
  onDelete,
  onAddChild,
  onSelect,
}) {
  const { data: categoryTree = [], isLoading, error } = useCategoryTree();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!categoryTree || categoryTree.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Không tìm thấy danh mục nào</p>
        <p className="text-sm">Tạo danh mục đầu tiên để bắt đầu</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categoryTree.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
