import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CmsFilterBar({
  activeTab,
  search,
  selectedType,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onClear,
}) {
  const { t } = useTranslation();
  const hasFilter = search || statusFilter !== "all";

  return (
    <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          placeholder={t("admin.cms.searchPlaceholder", {
            type: selectedType?.label?.toLowerCase() || "",
          })}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
        />
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-[160px]">
            <SelectValue placeholder={t("admin.cms.statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
            <SelectItem value="all">{t("admin.cms.allStatuses")}</SelectItem>
            {activeTab === "events" ? (
              <>
                <SelectItem value="active">{t("admin.cms.activeStatus")}</SelectItem>
                <SelectItem value="inactive">{t("admin.cms.inactiveStatus")}</SelectItem>
                <SelectItem value="completed">{t("admin.cms.completedStatus")}</SelectItem>
              </>
            ) : activeTab === "trips" ? (
              <SelectItem value="planned">{t("admin.cms.planned")}</SelectItem>
            ) : (
              <>
                <SelectItem value="active">{t("admin.cms.active")}</SelectItem>
                <SelectItem value="inactive">{t("admin.cms.hidden")}</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        {hasFilter && (
          <button
            type="button"
            onClick={onClear}
            className="h-10 px-3.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-950 hover:bg-[#F4F2EC] transition-all flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t("admin.cms.clearFilter")}</span>
          </button>
        )}
      </div>
    </section>
  );
}
