import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import PlanBadge from "./PlanBadge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/utils/formatters";
import { formatDate } from "@/components/business/dashboardWidgetHelpers";
import { STATUS_LABELS } from "./subscriptionConstants";

function UsageMeter({ label, used, limit }) {
  const isUnlimited = limit === null || limit === undefined || limit === -1;
  const percent = isUnlimited
    ? 0
    : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/80 dark:bg-muted/40 border border-slate-100 dark:border-border/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {label}
        </span>
        <span className="font-mono text-slate-500">
          {used} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              percent >= 90
                ? "bg-rose-500"
                : percent >= 70
                ? "bg-amber-500"
                : "bg-emerald-500"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export const CurrentPlanCard = memo(
  ({ plan, sub, usage, isCanceled }) => {
    const { t } = useTranslation();

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Info Card */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PlanBadge planSlug={plan.slug} />
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {plan.name || "Gói Tiêu Chuẩn"}
              </span>
            </div>
            <span className="text-2xl font-black text-slate-950 dark:text-white">
              {formatMoney(
                sub.billingCycle === "yearly"
                  ? plan.priceYearly ?? plan.priceMonthly
                  : plan.priceMonthly
              )}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                /
                {sub.billingCycle === "yearly"
                  ? t("subscription.plans.yearly")
                  : t("subscription.plans.monthly")}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-border/60">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40">
              <p className="text-slate-400">{t("common.status")}</p>
              <p className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                {t(STATUS_LABELS[sub.status] || "common.statusUnknown")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40">
              <p className="text-slate-400">{t("subscription.expiresAt")}</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {formatDate(sub.currentPeriodEnd)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40">
              <p className="text-slate-400">{t("subscription.billingCycle")}</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {t(
                  sub.billingCycle === "yearly"
                    ? "subscription.plans.yearly"
                    : "subscription.plans.monthly"
                )}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-muted/40">
              <p className="text-slate-400">{t("subscription.startDate")}</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {formatDate(sub.createdAt)}
              </p>
            </div>
          </div>

          {isCanceled && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-xs text-destructive font-bold">
                {t("subscription.canceledNotice")}
              </p>
              {sub.cancelReason && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("subscription.cancelReason")}: {sub.cancelReason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Resource Usage Meters */}
        <div className="p-6 sm:p-7 rounded-[32px] bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {t("subscription.usage")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Tài nguyên và định mức đang được sử dụng
            </p>
          </div>

          <div className="space-y-2.5">
            <UsageMeter
              label={t("subscription.usageItems.places")}
              used={usage.places ?? 0}
              limit={plan.maxPlaces}
            />
            <UsageMeter
              label={t("subscription.usageItems.bookingsPerMonth")}
              used={usage.bookings ?? 0}
              limit={plan.maxBookingsPerMonth}
            />
            <UsageMeter
              label={t("subscription.usageItems.staff")}
              used={usage.staff ?? 0}
              limit={plan.maxStaff}
            />
            <UsageMeter
              label={t("subscription.usageItems.services")}
              used={usage.services ?? 0}
              limit={plan.maxServices}
            />
          </div>
        </div>
      </div>
    );
  }
);

CurrentPlanCard.displayName = "CurrentPlanCard";
export default CurrentPlanCard;
