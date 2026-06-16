import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * Thẻ thống kê kiểu nhẹ nhàng chuẩn Shadcn — thay thế cho kiểu T.I.M Neo-brutalist cũ.
 */
export default function TimStatsCard({
  title,
  value,
  icon: Icon,
  serial,
  color = "bg-white",
  textColor = "text-black",
}) {
  // Ánh xạ các màu cũ của Neo-brutalist sang style pastel nhạt tinh tế của Shadcn
  let iconBgClass = "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  if (textColor.includes("emerald") || textColor.includes("success")) {
    iconBgClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-500";
  } else if (textColor.includes("amber") || textColor.includes("warning")) {
    iconBgClass = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500";
  } else if (textColor.includes("red") || textColor.includes("rose") || textColor.includes("danger") || textColor.includes("destructive")) {
    iconBgClass = "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-500";
  } else if (textColor.includes("blue") || textColor.includes("sky") || textColor.includes("info")) {
    iconBgClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-500";
  } else if (color.includes("yellow") || color.includes("yellow-50")) {
    iconBgClass = "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-500";
  } else if (color.includes("red-50")) {
    iconBgClass = "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-500";
  } else if (Icon) {
    iconBgClass = "bg-primary/10 text-primary";
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
              {serial && (
                <span className="text-[9px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {serial}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl shrink-0", iconBgClass)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
