import { memo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const getStatusMap = (t) => ({
  active: {
    label: t("common.statusActive"),
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: t("common.statusInactive"),
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  draft: {
    label: t("common.draft"),
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  expired: {
    label: t("common.statusExpired"),
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  pending: {
    label: t("common.pendingApproval"),
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  processing: {
    label: t("common.processing"),
    bg: "bg-blue-50 dark:bg-blue-950/50",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  success: {
    label: t("common.success"),
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  failed: {
    label: t("common.failed"),
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  reviewing: {
    label: t("common.reviewing"),
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  approved: {
    label: t("common.statusApproved"),
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: t("common.statusRejected"),
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  cancelled: {
    label: t("common.statusCancelled"),
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
});

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
};

/**
 * StatusBadge — Auto-maps status strings to colored badges.
 *
 * @param {object} props
 * @param {string} props.status - Status key (e.g. 'active', 'pending', 'expired')
 * @param {'sm'|'md'} [props.size='md'] - Badge size
 * @param {'auto'|object} [props.variant='auto'] - 'auto' uses built-in map; object maps status → { label, bg, text, dot }
 * @param {string} [props.className] - Additional classes
 */
export const StatusBadge = memo(({
  status,
  size = "md",
  variant = "auto",
  className,
}) => {
  const { t } = useTranslation();
  const STATUS_MAP = getStatusMap(t);
  const colorMap = variant === "auto" ? STATUS_MAP : variant;
  const config = colorMap[status];

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          SIZE_CLASSES[size],
          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
          className,
        )}
      >
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        SIZE_CLASSES[size],
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label || status}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";
