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

export const DESIGN = {
  card: "rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 dark:bg-zinc-950/70 dark:backdrop-blur-md",
  cardHover: "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995]",
  tabUnderlineTrigger:
    "h-9 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary",
  sectionHeader:
    "px-5 py-4 border-b border-border/60 flex items-center justify-between",
  iconBox: (color) =>
    cn(
      "rounded-xl p-3 flex items-center justify-center shrink-0",
      {
        emerald:
          "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
        teal: "bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        amber:
          "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
        violet:
          "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
        primary: "bg-primary/10 text-primary dark:bg-primary/20",
      }[color] || "bg-muted text-muted-foreground",
    ),
};
