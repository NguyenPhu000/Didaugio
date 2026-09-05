import { Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AiEmptyState({
  icon: Icon = Inbox,
  eyebrow = "AI Operations",
  title,
  description,
  actionLabel,
  onAction,
  isError = false,
  variant = "surface",
}) {
  const content = (
    <div
      className={
        variant === "inline"
          ? "flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center"
          : "flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center"
      }
    >
        <div className="mb-4 flex size-11 items-center justify-center border border-black/25 bg-muted dark:border-white/25">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-bold uppercase tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            type="button"
            variant="outline"
            onClick={onAction}
            className="mt-5 rounded-none border-black dark:border-white"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {actionLabel}
          </Button>
        )}
    </div>
  );

  if (variant === "inline") {
    return (
      <div role={isError ? "alert" : undefined} className="min-w-0">
        {content}
      </div>
    );
  }

  return (
    <Card
      className="rounded-none border-black/20 shadow-none dark:border-white/20"
      role={isError ? "alert" : undefined}
    >
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}
