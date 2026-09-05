export const STATUS_LABELS = {
  active: "subscription.status.active",
  trialing: "subscription.status.trialing",
  past_due: "subscription.status.past_due",
  canceled: "subscription.status.canceled",
  unpaid: "subscription.status.unpaid",
  incomplete: "subscription.status.incomplete",
};

export const INVOICE_STATUS_STYLES = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  overdue:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  canceled:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
};

export const INVOICE_STATUS_KEYS = {
  paid: "subscription.invoice.status.paid",
  pending: "subscription.invoice.status.pending",
  overdue: "subscription.invoice.status.overdue",
  canceled: "subscription.invoice.status.canceled",
};
