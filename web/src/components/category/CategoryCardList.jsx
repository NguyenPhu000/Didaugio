import { Loader2, Grid3x3, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CategoryCard from "./CategoryCard";
import { CategoryCardListSkeleton } from "./CategoryCardSkeleton";

/**
 * CATEGORY CARD LIST
 * Grid layout hiển thị categories dạng cards
 */
export default function CategoryCardList({
  categories,
  loading,
  error,
  onEdit,
  onDelete,
  onAddChild,
  onViewDetails,
}) {
  if (loading) {
    return <CategoryCardListSkeleton count={8} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Không tìm thấy danh mục nào
        </h3>
        <p className="text-sm text-muted-foreground">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {categories.map((category) => (
        <CategoryCard
          key={`category-card-${category.id}`}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
