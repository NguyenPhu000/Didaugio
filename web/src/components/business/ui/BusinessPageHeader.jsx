import { cn } from "@/lib/utils";

/**
 * BusinessPageHeader — standardized page header pattern.
 * Each page should have: title, optional description, optional primary action,
 * optional secondary actions, optional status badges/summary chips.
 */
export function BusinessPageHeader({
  title,
  description,
  badge,
  action,
  secondaryActions,
  className,
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            {title}
          </h1>
          {badge !== undefined && badge !== null && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {(action || secondaryActions) && (
        <div className="flex shrink-0 items-center gap-2">
          {secondaryActions}
          {action}
        </div>
      )}
    </div>
  );
}
