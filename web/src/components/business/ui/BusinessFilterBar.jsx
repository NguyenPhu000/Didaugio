import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * BusinessFilterBar — standardized filter/toolbar pattern for list-heavy pages.
 * Outer shell collapses cleanly on smaller widths instead of relying on brittle nested spacing.
 *
 * Required structure guidance from design spec:
 * - Outer shell: flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between
 * - Search zone: flex flex-1 items-center gap-2 max-w-sm w-full
 * - Filter/action zone: flex flex-wrap items-center gap-2 w-full justify-end sm:w-auto
 */
export function BusinessFilterBar({
  children,
  searchPlaceholder = "Tìm kiếm...",
  onSearch,
  value,
  className,
}) {
  return (
    <div className={cn(
      "flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}>
      {/* Search zone */}
      {onSearch && (
        <div className="flex flex-1 items-center gap-2 max-w-sm w-full">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <Input
            placeholder={searchPlaceholder}
            value={value}
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 border-zinc-200 bg-transparent text-zinc-950 placeholder:text-zinc-400 focus-visible:ring-zinc-400 rounded-lg text-sm"
          />
        </div>
      )}

      {/* Filter / action zone */}
      {children && (
        <div className="flex flex-wrap items-center gap-2 w-full justify-end sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
