import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Eye } from "lucide-react";
import auditLogService from "@/apis/auditLogService";
import { formatDateTime } from "@/utils/dateUtils";
import { getTableSerialNumber } from "@/utils/tableSerial";
import { getRoleDisplay } from "./auditLogsConstants";

export const AuditLogTableView = memo(
  ({
    loading,
    logs,
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    hasActiveFilters,
    clearFilters,
    handleViewDetail,
  }) => {
    const { t } = useTranslation();

    if (!loading && logs.length === 0) {
      return (
        <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="py-20 text-center text-slate-400 p-6">
            <FileText className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              {t("auditLogs.noData")}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#F8F7F3] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              >
                {t("auditLogs.clearFilters")}
              </button>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-black/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 w-[60px] hidden sm:table-cell">STT</th>
                <th className="p-4 min-w-[200px]">{t("auditLogs.performer")}</th>
                <th className="p-4 w-[110px] hidden md:table-cell">
                  {t("auditLogs.role")}
                </th>
                <th className="p-4 w-[130px]">{t("auditLogs.actionCol")}</th>
                <th className="p-4 w-[140px] hidden sm:table-cell">
                  {t("auditLogs.object")}
                </th>
                <th className="p-4">{t("auditLogs.description")}</th>
                <th className="p-4 w-[120px] hidden lg:table-cell">
                  {t("auditLogs.ip")}
                </th>
                <th className="p-4 w-[140px] hidden md:table-cell">
                  {t("auditLogs.time")}
                </th>
                <th className="p-4 text-center w-[70px]">
                  {t("auditLogs.details")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4 hidden sm:table-cell"><div className="h-4 w-6 bg-slate-200 rounded" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-28 bg-slate-200 rounded" />
                          <div className="h-2.5 w-20 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell"><div className="h-5 w-16 bg-slate-200 rounded-full" /></td>
                    <td className="p-4"><div className="h-5 w-20 bg-slate-200 rounded-full" /></td>
                    <td className="p-4 hidden sm:table-cell"><div className="h-5 w-20 bg-slate-200 rounded-md" /></td>
                    <td className="p-4"><div className="h-3.5 w-36 bg-slate-200 rounded" /></td>
                    <td className="p-4 hidden lg:table-cell"><div className="h-3.5 w-20 bg-slate-200 rounded" /></td>
                    <td className="p-4 hidden md:table-cell"><div className="h-3.5 w-24 bg-slate-200 rounded" /></td>
                    <td className="p-4 text-center"><div className="h-8 w-8 bg-slate-200 rounded-full mx-auto" /></td>
                  </tr>
                ))
              ) : (
                logs.map((log, index) => (
                <tr
                  key={log.id}
                  className="hover:bg-[#FAF9F5] group transition-colors"
                >
                  <td className="p-4 font-mono text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                    #{getTableSerialNumber(
                      totalItems || logs.length,
                      index,
                      currentPage,
                      itemsPerPage
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                        {(
                          log.user?.profile?.fullName ||
                          log.user?.email ||
                          "N/A"
                        )
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {log.user?.profile?.fullName ||
                            log.user?.email ||
                            "N/A"}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono truncate">
                          {log.user?.email || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8F7F3] text-slate-700 border border-black/[0.04]">
                      {getRoleDisplay(log)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${auditLogService.getActionColor(log.action)}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <div>
                      <div className="font-semibold text-xs text-slate-800">
                        {auditLogService.getTableLabel(log.tableName)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.tableName} #{log.recordId}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-600 line-clamp-2">
                      {log.description || "—"}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {log.ipAddress || "—"}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleViewDetail(log)}
                      className="h-8 w-8 rounded-full bg-[#F8F7F3] hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center mx-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs">
            <span className="font-mono text-slate-500 tabular-nums">
              {t("auditLogs.page", {
                page: currentPage,
                totalPages,
                count: logs.length,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                {t("common.previous")}
              </button>
              <span className="px-3 font-mono font-bold text-slate-950 tabular-nums">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                {t("common.nextPage")}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }
);

AuditLogTableView.displayName = "AuditLogTableView";
export default AuditLogTableView;
