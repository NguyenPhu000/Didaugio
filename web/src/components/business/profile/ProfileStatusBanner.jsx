import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const getStatusConfig = (t) => ({
  pending: {
    icon: Clock,
    label: t("business.profile.statusPending"),
    description: t("business.profile.statusDescriptionPending"),
    className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  approved: {
    icon: CheckCircle2,
    label: t("business.profile.statusApproved"),
    description: t("business.profile.statusDescriptionApproved"),
    className: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    icon: AlertCircle,
    label: t("business.profile.statusRejected"),
    description: t("business.profile.statusDescriptionRejected"),
    className: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300",
    iconClass: "text-rose-600 dark:text-rose-400",
  },
  suspended: {
    icon: AlertCircle,
    label: t("business.profile.statusSuspended"),
    description: t("business.profile.statusDescriptionSuspended"),
    className: "bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200",
    iconClass: "text-slate-600 dark:text-slate-400",
  },
});

export const ProfileStatusBanner = memo(({ status, reason }) => {
  const { t } = useTranslation();
  if (!status) return null;
  const statusConfig = getStatusConfig(t);
  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 sm:p-5 rounded-[26px] border shadow-xs transition-all",
        cfg.className
      )}
    >
      <StatusIcon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.iconClass)} />
      <div>
        <p className="text-sm font-extrabold">{cfg.label}</p>
        <p className="text-xs opacity-80 mt-0.5">{cfg.description}</p>
        {status === "rejected" && reason && (
          <div className="mt-2 text-xs p-2.5 bg-white/70 dark:bg-card/70 rounded-2xl border border-current/20 font-medium">
            <strong>{t("business.profile.rejectReason")}</strong> {reason}
          </div>
        )}
      </div>
    </div>
  );
});

ProfileStatusBanner.displayName = "ProfileStatusBanner";
export default ProfileStatusBanner;
