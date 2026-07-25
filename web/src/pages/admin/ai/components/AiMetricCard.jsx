import { Card, CardContent } from "@/components/ui/Card";

export default function AiMetricCard({
  label,
  value,
  detail,
  icon: Icon,
}) {
  return (
    <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-3 break-words font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
              {value}
            </p>
          </div>
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center border border-black/20 bg-primary/15 dark:border-white/20">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          )}
        </div>
        {detail && (
          <p className="mt-3 border-t border-black/10 pt-2 font-mono text-[11px] text-muted-foreground dark:border-white/10">
            {detail}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
