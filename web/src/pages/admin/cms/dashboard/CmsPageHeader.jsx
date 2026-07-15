import { useTranslation } from "react-i18next";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CmsPageHeader({ activeTab, isRefreshing, onCreate, onRefresh }) {
  const { t } = useTranslation();
  const createLabel = activeTab === "events" ? t("admin.cms.createEventBtn") : activeTab === "trips" ? t("admin.cms.createSampleTrip") : t("common.create");
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("admin.cms.events")}</h1><p className="mt-1 text-muted-foreground">{t("admin.cms.eventsDesc")}</p></div>
      <div className="flex items-center gap-2"><Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing} aria-label={t("common.refresh")}><RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /></Button><Button className={cn("gap-2 text-white font-medium", activeTab === "trips" && "bg-purple-600 hover:bg-purple-700")} onClick={onCreate}><Plus className="h-4 w-4" />{createLabel}</Button></div>
    </div>
  );
}
