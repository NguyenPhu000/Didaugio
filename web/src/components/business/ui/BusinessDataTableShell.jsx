import { memo } from "react";
import { Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { BusinessEmptyState } from "./BusinessEmptyState";

/**
 * BusinessDataTableShell — Consistent wrapper for data tables.
 * Handles loading, empty, and error states with card container.
 *
 * @param {object} props
 * @param {string} [props.title] - Card header title
 * @param {string} [props.description] - Card header description
 * @param {React.ReactNode} [props.action] - Header action buttons
 * @param {boolean} [props.loading=false] - Show loading skeleton
 * @param {boolean} [props.empty=false] - Show empty state
 * @param {import('lucide-react').LucideIcon} [props.emptyIcon] - Empty state icon
 * @param {string} [props.emptyMessage='Không có dữ liệu'] - Empty state message
 * @param {React.ReactNode} [props.emptyAction] - Empty state action button
 * @param {boolean} [props.isError=false] - Show error state
 * @param {string|Error} [props.error] - Error message or object
 * @param {() => void} [props.onRetry] - Retry callback for error state
 * @param {number} [props.columns=4] - Number of skeleton columns
 * @param {number} [props.skeletonRows=5] - Number of skeleton rows
 * @param {React.ReactNode} [props.children] - Table content
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.noPadding=false] - Remove card padding
 */
export const BusinessDataTableShell = memo(({
  title,
  description,
  action,
  loading = false,
  empty = false,
  emptyIcon = Inbox,
  emptyMessage = "Không có dữ liệu",
  emptyAction,
  isError = false,
  error,
  onRetry,
  columns = 4,
  skeletonRows = 5,
  children,
  className,
  noPadding = false,
}) => (
  <Card className={cn(
    "rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none",
    className,
  )}>
    {(title || action) && (
      <div className="px-5 py-4 border-b border-zinc-200/60 flex items-center justify-between">
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    )}
    <CardContent className={cn(noPadding && "p-0", !noPadding && "p-0", "overflow-hidden")}>
      {loading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={cn(
                    "h-4 rounded bg-zinc-100 dark:bg-zinc-900",
                    j === 0 ? "w-1/4" : j === columns - 1 ? "w-1/6" : "w-1/5",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="py-12">
          <BusinessEmptyState
            icon={AlertTriangle}
            message={typeof error === "string" ? error : error?.message || "Đã xảy ra lỗi khi tải dữ liệu"}
            action={onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Thử lại
              </Button>
            )}
          />
        </div>
      ) : empty ? (
        <div className="py-12">
          <BusinessEmptyState
            icon={emptyIcon}
            message={emptyMessage}
            action={emptyAction}
          />
        </div>
      ) : (
        children
      )}
    </CardContent>
  </Card>
));
BusinessDataTableShell.displayName = "BusinessDataTableShell";
