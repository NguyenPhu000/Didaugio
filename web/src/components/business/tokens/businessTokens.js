import { cn } from "@/lib/utils";

/**
 * Business portal token presets — white-first, black-accent, shadcn-aligned.
 * Standardizes how the business portal composes Tailwind utility classes
 * without replacing shadcn tokens.
 */
export const BUSINESS_TOKENS = {
  bg: "bg-white",
  surface: "bg-zinc-50",
  textMain: "text-zinc-950 font-medium tracking-tight",
  textSub: "text-zinc-500 text-sm",
  border: "border-zinc-200/80",
  card: "rounded-xl border border-zinc-200/80 bg-white shadow-sm",
  cardHover: "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.995] transition-all duration-200",
  iconBox: (color) =>
    cn("rounded-xl p-3 flex items-center justify-center shrink-0", {
      emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
      slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      primary: "bg-zinc-950 text-white dark:bg-zinc-800",
    }[color] || "bg-muted text-muted-foreground"),
  sectionHeader:
    "px-5 py-4 border-b border-zinc-200/60 flex items-center justify-between",
  buttonPrimary:
    "bg-zinc-950 text-white hover:bg-zinc-900 h-9 px-4 rounded-lg text-sm font-medium transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700",
  buttonSecondary:
    "bg-white text-zinc-950 border border-zinc-200 hover:bg-zinc-50 h-9 px-4 rounded-lg text-sm font-medium transition-colors dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
  badgeSuccess:
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50",
  badgeWarning:
    "bg-amber-50 text-amber-700 border-amber-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50",
  badgeDanger:
    "bg-rose-50 text-rose-700 border-rose-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50",
  badgeInfo:
    "bg-blue-50 text-blue-700 border-blue-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/50",
  badgeNeutral:
    "bg-zinc-100 text-zinc-600 border-zinc-200/60 text-[11px] font-semibold px-2.5 py-0.5 rounded-full dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/50",
  filterBar:
    "flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
  filterBarSearch:
    "flex flex-1 items-center gap-2 max-w-sm w-full",
  filterBarActions:
    "flex flex-wrap items-center gap-2 w-full justify-end sm:w-auto",
  inputBusiness:
    "h-9 border-zinc-200 bg-transparent text-zinc-950 placeholder:text-zinc-400 focus-visible:ring-zinc-950 focus-visible:border-zinc-400 rounded-lg text-sm",
};

/** Sparkline bar colors keyed by color name */
export const SPARKLINE_BARS = {
  emerald: "bg-emerald-500/80",
  teal: "bg-teal-500/80",
  blue: "bg-blue-500/80",
  amber: "bg-amber-500/80",
  rose: "bg-rose-500/80",
  violet: "bg-violet-500/80",
  primary: "bg-zinc-400",
  slate: "bg-slate-400/80",
  orange: "bg-orange-500/80",
  purple: "bg-purple-500/80",
};
