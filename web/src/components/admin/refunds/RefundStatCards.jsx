import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "./refundConstants";

function StatCard({ title, value, icon: Icon, tone = "default", subtitle }) {
  const toneMap = {
    danger: { iconBg: "bg-rose-50 dark:bg-rose-950/30 text-rose-500" },
    warning: { iconBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-500" },
    success: { iconBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" },
    default: { iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" },
  };
  const config = toneMap[tone] || toneMap.default;

  return (
    <Card className="relative overflow-hidden rounded-[26px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-2xl shrink-0", config.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const RefundStatCards = memo(({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Chờ xử lý"
        value={stats.pendingCount}
        subtitle={formatCurrency(stats.pendingAmount)}
        icon={Clock}
        tone="warning"
      />
      <StatCard
        title="Đã hoàn một phần"
        value={stats.partiallyCount}
        subtitle={formatCurrency(stats.partiallyAmount)}
        icon={RefreshCw}
        tone="default"
      />
      <StatCard
        title="Đã hoàn thành công"
        value={stats.fullyCount}
        subtitle={formatCurrency(stats.fullyAmount)}
        icon={Check}
        tone="success"
      />
      <StatCard
        title="Đã từ chối"
        value={stats.rejectedCount}
        subtitle={formatCurrency(stats.rejectedAmount)}
        icon={AlertTriangle}
        tone="danger"
      />
    </div>
  );
});

RefundStatCards.displayName = "RefundStatCards";
export default RefundStatCards;
