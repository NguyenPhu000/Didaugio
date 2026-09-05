import { useTranslation } from "react-i18next";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function EventStatusBadge({ status }) {
  const { t } = useTranslation();
  const config = {
    active: { label: t("admin.cms.ongoing"), class: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: <CheckCircle className="h-3 w-3" /> },
    inactive: { label: t("admin.cms.hiddenTemp"), class: "border-slate-200 bg-slate-50 text-slate-500", icon: <EyeOff className="h-3 w-3" /> },
    completed: { label: t("admin.cms.ended"), class: "border-blue-200 bg-blue-50 text-blue-600", icon: <CheckCircle className="h-3 w-3" /> },
  };
  const current = config[status] || config.inactive;
  return <Badge variant="outline" className={cn("gap-1 text-xs", current.class)}>{current.icon} {current.label}</Badge>;
}

export function StatusBadge({ active }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn("gap-1", active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
      {active ? <><Eye className="h-3 w-3" /> {t("admin.cms.active")}</> : <><EyeOff className="h-3 w-3" /> {t("admin.cms.hidden")}</>}
    </Badge>
  );
}
