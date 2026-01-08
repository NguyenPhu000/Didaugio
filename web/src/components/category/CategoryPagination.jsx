import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CATEGORY PAGINATION
 * Pagination component cho category list
 */
export default function CategoryPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between py-4 px-2">
      <div className="text-sm text-muted-foreground">
        Hiển thị{" "}
        <span className="font-medium">
          {Math.min((currentPage - 1) * 12 + 1, totalItems)}
        </span>{" "}
        -{" "}
        <span className="font-medium">
          {Math.min(currentPage * 12, totalItems)}
        </span>{" "}
        trong tổng số <span className="font-medium">{totalItems}</span> danh mục
      </div>

      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-3 py-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-10"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Tiếp
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
