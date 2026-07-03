import { cn } from "@/lib/utils";

export const formatVND = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price || 0,
  );

export const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/**
 * DESIGN — business portal design token composition.
 * Now aligned with BUSINESS_TOKENS in components/business/tokens/businessTokens.js
 * Keep here for backward compatibility with existing imports.
 */
export const DESIGN = {
  card: "rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:bg-zinc-950 dark:border-zinc-800 dark:shadow-none",
  cardHover: "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995] transition-all duration-200",
  tabUnderlineTrigger:
    "h-9 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-950 data-[state=active]:bg-transparent data-[state=active]:text-zinc-950 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100",
  sectionHeader:
    "px-5 py-4 border-b border-zinc-200/60 flex items-center justify-between",
  iconBox: (color) =>
    cn(
      "rounded-xl p-3 flex items-center justify-center shrink-0",
      {
        emerald:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
        teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        amber:
          "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
        violet:
          "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
        primary: "bg-zinc-950 text-white dark:bg-zinc-800",
      }[color] || "bg-muted text-muted-foreground",
    ),
};
