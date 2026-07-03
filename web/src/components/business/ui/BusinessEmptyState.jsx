import { memo } from "react";
import { AlertCircle } from "lucide-react";

/**
 * BusinessEmptyState — standardized empty state for list pages.
 */
export const BusinessEmptyState = memo(({
  icon: Icon = AlertCircle,
  message,
  action,
  className,
}) => (
  <div className={`flex flex-col items-center justify-center gap-4 px-6 py-16 text-center ${className || ""}`}>
    <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900">
      <Icon className="h-9 w-9 text-zinc-300 dark:text-zinc-600" />
    </div>
    <p className="max-w-xs text-sm font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
      {message}
    </p>
    {action && <div className="mt-2">{action}</div>}
  </div>
));
BusinessEmptyState.displayName = "BusinessEmptyState";

/**
 * BusinessLoadingState — standardized loading state.
 */
export const BusinessLoadingState = memo(({ message = "Đang tải dữ liệu..." }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-950 dark:border-zinc-800 dark:border-t-zinc-400" />
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
  </div>
));
BusinessLoadingState.displayName = "BusinessLoadingState";
