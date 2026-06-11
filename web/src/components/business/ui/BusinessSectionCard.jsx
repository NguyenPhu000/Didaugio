import { memo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * BusinessSectionCard — Card-style section for analytics, forms, detail panels, etc.
 */
export const BusinessSectionCard = memo(({
  title,
  titleIcon: TitleIcon,
  action,
  children,
  className,
  bodyClassName,
  noPadding = false,
}) => (
  <Card className={cn(
    "rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none",
    className,
  )}>
    {title && (
      <div className="px-5 py-4 border-b border-zinc-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {TitleIcon && <TitleIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />}
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{title}</h3>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    )}
    <CardContent className={cn(noPadding && "p-0", !noPadding && "p-5", bodyClassName)}>
      {children}
    </CardContent>
  </Card>
));
BusinessSectionCard.displayName = "BusinessSectionCard";

export function BusinessSectionCardSkeleton({ rows = 4, titleIcon: _TitleIcon }) {
  return (
    <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
      <div className="px-5 py-4 border-b border-zinc-200/60">
        <div className="h-4 w-36 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </div>
      <CardContent className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-1/3 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            <div className="h-4 w-1/4 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
