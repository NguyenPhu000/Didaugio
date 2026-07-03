import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SPARKLINE_BARS } from "../tokens";

const formatTrendValue = (trend) => {
  if (trend === undefined || trend === null || trend === "") return null;
  if (typeof trend === "number") {
    const sign = trend > 0 ? "+" : "";
    return `${sign}${trend}%`;
  }
  return String(trend);
};

const MiniSparkline = memo(({ data, color = "primary" }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barClass = SPARKLINE_BARS[color] || SPARKLINE_BARS.primary;

  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {data.map((point, index) => {
        const heightPercent = Math.max(18, Math.min(100, Math.round((point / max) * 100)));
        return (
          <div
            key={`${index}-${point}`}
            className={cn("w-2 rounded-full transition-all duration-300", barClass)}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
});
MiniSparkline.displayName = "MiniSparkline";

/**
 * BusinessStatCard — dashboard-style stat card.
 * Reusable across dashboard, revenue, earnings, and booking overview pages.
 */
export const BusinessStatCard = memo(({
  title,
  value,
  icon: Icon,
  iconColor = "primary",
  trend,
  miniChart,
  description,
  href,
  loading,
}) => {
  if (loading) return <BusinessStatCardSkeleton />;

  const trendValue = formatTrendValue(trend);
  const isWrapped = !!href;

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
        <div className={cn(
          "rounded-xl p-3 flex items-center justify-center shrink-0",
          iconColor === "emerald" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
          iconColor === "teal" && "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
          iconColor === "blue" && "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
          iconColor === "amber" && "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
          iconColor === "rose" && "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
          iconColor === "violet" && "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
          iconColor === "primary" && "bg-zinc-950 text-white dark:bg-zinc-800",
          iconColor === "slate" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        )}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {trendValue && (
          <Badge
            variant="secondary"
            className="rounded-lg border border-zinc-200/60 bg-zinc-50 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
          >
            {trendValue}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[32px] font-semibold leading-tight tracking-tighter text-zinc-950 dark:text-zinc-100">
            {value}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          {description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <MiniSparkline data={miniChart} color={iconColor} />

        {href && !isWrapped && (
          <Link
            to={href}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Xem chi tiết <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995] transition-all duration-200 dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
      {cardContent}
    </Card>
  );
});
BusinessStatCard.displayName = "BusinessStatCard";

export function BusinessStatCardSkeleton() {
  return (
    <Card className="rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
        <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        <div className="h-6 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-2 p-5 pt-0">
        <div className="h-8 w-28 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        <div className="flex h-10 items-end gap-1 pt-1">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-full w-2 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
