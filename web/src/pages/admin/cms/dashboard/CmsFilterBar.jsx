import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CmsFilterBar({ activeTab, search, selectedType, statusFilter, onSearchChange, onStatusChange, onClear }) {
  const { t } = useTranslation();
  const hasFilter = search || statusFilter !== "all";
  return <Card><CardContent className="p-4"><div className="flex flex-wrap items-center gap-4"><div className="relative min-w-[200px] max-w-md flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder={t("admin.cms.searchPlaceholder", { type: selectedType?.label?.toLowerCase() || "" })} value={search} onChange={(event) => onSearchChange(event.target.value)} className="pl-9" /></div><Select value={statusFilter} onValueChange={onStatusChange}><SelectTrigger className="w-40"><SelectValue placeholder={t("admin.cms.statusPlaceholder")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("admin.cms.allStatuses")}</SelectItem>{activeTab === "events" ? <><SelectItem value="active">{t("admin.cms.activeStatus")}</SelectItem><SelectItem value="inactive">{t("admin.cms.inactiveStatus")}</SelectItem><SelectItem value="completed">{t("admin.cms.completedStatus")}</SelectItem></> : activeTab === "trips" ? <SelectItem value="planned">{t("admin.cms.planned")}</SelectItem> : <><SelectItem value="active">{t("admin.cms.active")}</SelectItem><SelectItem value="inactive">{t("admin.cms.hidden")}</SelectItem></>}</SelectContent></Select>{hasFilter ? <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground"><X className="h-3.5 w-3.5" />{t("admin.cms.clearFilter")}</Button> : null}</div></CardContent></Card>;
}
