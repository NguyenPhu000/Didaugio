import { memo } from "react";
import { Search, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const variantConfig = {
  default: {
    icon: Inbox,
    iconBg: "bg-zinc-50 dark:bg-zinc-900",
    iconColor: "text-zinc-300 dark:text-zinc-600",
  },
  search: {
    icon: Search,
    iconBg: "bg-blue-50 dark:bg-blue-950/50",
    iconColor: "text-blue-300 dark:text-blue-600",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-rose-50 dark:bg-rose-950/50",
    iconColor: "text-rose-300 dark:text-rose-600",
  },
};

/**
 * EmptyState — Reusable empty state with variant styles.
 *
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} [props.icon] - Override icon (takes precedence over variant)
 * @param {string} props.title - Main message
 * @param {string} [props.description] - Supporting description
 * @param {string} [props.actionLabel] - CTA button label
 * @param {() => void} [props.onAction] - CTA click handler
 * @param {'default'|'search'|'error'} [props.variant='default'] - Visual variant
 * @param {string} [props.className] - Additional classes
 */
export const EmptyState = memo(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className,
}) => {
  const cfg = variantConfig[variant] || variantConfig.default;
  const IconComponent = icon || cfg.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      <div className={cn("rounded-2xl p-5", cfg.iconBg)}>
        <IconComponent className={cn("h-9 w-9", cfg.iconColor)} />
      </div>
      <div className="max-w-xs space-y-1.5">
        <p className="text-sm font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
          {title}
        </p>
        {description && (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
});
EmptyState.displayName = "EmptyState";
