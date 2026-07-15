import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({ title, value, icon: Icon, tone = "default", subtitle }) {
  const tones = {
    danger: "bg-rose-50 text-rose-500 dark:bg-rose-950/30",
    warning: "bg-amber-50 text-amber-500 dark:bg-amber-950/30",
    success: "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30",
    default: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <Card className="relative overflow-hidden"><CardContent className="p-6"><div className="flex items-center justify-between gap-4"><div className="min-w-0 space-y-1.5"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>{subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}</div>{Icon ? <div className={cn("shrink-0 rounded-xl p-3", tones[tone] || tones.default)}><Icon className="h-5 w-5" /></div> : null}</div></CardContent></Card>
  );
}
