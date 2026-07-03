import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  down: {
    icon: TrendingDown,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/50",
  },
  neutral: {
    icon: Minus,
    color: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-50 dark:bg-zinc-900",
  },
};

/**
 * MetricCard — Reusable stat card with trend indicator.
 *
 * @param {object} props
 * @param {string} props.title - Metric label
 * @param {string|number} props.value - Formatted metric value
 * @param {number} [props.change] - Percentage change value
 * @param {string} [props.changeLabel] - Custom label for the change (e.g. "vs last month")
 * @param {import('lucide-react').LucideIcon} [props.icon] - Icon component
 * @param {'up'|'down'|'neutral'} [props.trend='neutral'] - Trend direction
 * @param {boolean} [props.loading] - Show skeleton state
 */
export const MetricCard = memo(({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend = "neutral",
  loading,
}) => {
  if (loading) return <MetricCardSkeleton />;

  const trendCfg = trendConfig[trend] || trendConfig.neutral;
  const TrendIcon = trendCfg.icon;
  const isPositive = change !== undefined && change !== null;
  const formattedChange = isPositive
    ? `${change > 0 ? "+" : ""}${change}%`
    : null;

  return (
    <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {title}
            </p>
            <p className="truncate text-[28px] font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-100">
              {value}
            </p>
            {formattedChange && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                    trendCfg.bg,
                    trendCfg.color,
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {formattedChange}
                </span>
                {changeLabel && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <Icon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
MetricCard.displayName = "MetricCard";

function MetricCardSkeleton() {
  return (
    <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
