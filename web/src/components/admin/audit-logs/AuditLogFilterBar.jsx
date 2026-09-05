import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import auditLogService from "@/apis/auditLogService";

export const AuditLogFilterBar = memo(
  ({
    hasActiveFilters,
    clearFilters,
    actionFilter,
    setActionFilter,
    tableFilter,
    setTableFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    setCurrentPage,
  }) => {
    const { t } = useTranslation();

    return (
      <section className="bg-white rounded-2xl border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("common.filter")}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              {t("auditLogs.clearFilters")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("auditLogs.action")}
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600]"
            >
              <option value="all">{t("auditLogs.allActions")}</option>
              {auditLogService.getActionTypes().map((action) => (
                <option key={action} value={action}>
                  {auditLogService.getActionLabel(action)} ({action})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("auditLogs.dataTable")}
            </label>
            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600]"
            >
              <option value="all">{t("auditLogs.allTables")}</option>
              {auditLogService.getTableNames().map((table) => (
                <option key={table} value={table}>
                  {auditLogService.getTableLabel(table)} ({table})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("auditLogs.fromDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("auditLogs.toDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-mono font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600]"
            />
          </div>
        </div>
      </section>
    );
  }
);

AuditLogFilterBar.displayName = "AuditLogFilterBar";
export default AuditLogFilterBar;
