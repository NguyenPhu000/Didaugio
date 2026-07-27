import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function CmsTypeTabs({ activeTab, contentTypes, getContentCount, onChange }) {
  const { t } = useTranslation();
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{contentTypes.map((type) => { const Icon = type.icon; const isActive = activeTab === type.id; return <button key={type.id} type="button" onClick={() => onChange(type.id)} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all", isActive ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm" : "border-border bg-card hover:bg-muted/50")}><div className={cn("shrink-0 rounded-lg p-2 text-white", type.color)}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-semibold">{type.label}</p><p className="text-xs text-muted-foreground">{t("admin.cms.items", { count: getContentCount(type.id) })}</p></div></button>; })}</div>;
}
