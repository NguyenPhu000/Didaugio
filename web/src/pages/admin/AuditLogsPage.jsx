import {
  FileText,
  RefreshCw,
  Eye,
  CheckCircle,
  Edit,
  Trash2,
  Shield,
  Globe,
  Monitor,
  X,
  Download,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import auditLogService from "@/apis/auditLogService";
import { formatDateTime } from "@/utils/dateUtils";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import { getTableSerialNumber } from "@/utils/tableSerial";
import TimStatsCard from "@/components/admin/TimStatsCard";

const AuditLogsPage = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    create: 0,
    update: 0,
    delete: 0,
  });

  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        action: actionFilter === "all" ? undefined : actionFilter,
        tableName: tableFilter === "all" ? undefined : tableFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const response = await auditLogService.getAll(params);
      if (response.success) {
        setLogs(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || response.data?.length || 0);

        const allLogs = response.data || [];
        setStats({
          total: response.pagination?.total || allLogs.length,
          create: allLogs.filter((l) => l.action === "CREATE").length,
          update: allLogs.filter((l) => l.action === "UPDATE").length,
          delete: allLogs.filter((l) => l.action === "DELETE").length,
        });
      }
    } catch {
      toast.error(t("auditLogs.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, tableFilter, startDate, endDate, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Open detail modal
  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      toast.loading(t("auditLogs.exporting"), { id: "csv-export" });

      const allData = await fetchAllPages(async (page) => {
        const res = await auditLogService.getAll({
          page,
          limit: 100,
          action: actionFilter === "all" ? undefined : actionFilter,
          tableName: tableFilter === "all" ? undefined : tableFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        return {
          data: res.data || [],
          pagination: res.pagination,
        };
      }, 100);

      if (!allData || allData.length === 0) {
        toast.error(t("auditLogs.noDataToExport"), { id: "csv-export" });
        return;
      }

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          { key: (row) => row.user?.profile?.fullName || row.user?.email || "N/A", label: t("auditLogs.performer") },
          { key: (row) => getRoleDisplay(row), label: t("auditLogs.role") },
          { key: "action", label: t("auditLogs.actionCol") },
          { key: (row) => auditLogService.getTableLabel(row.tableName), label: t("auditLogs.dataTable") },
          { key: "recordId", label: "Record ID" },
          { key: (row) => row.description || "", label: t("auditLogs.description") },
          { key: (row) => row.ipAddress || "", label: "IP" },
          { key: (row) => formatCsvDate(row.createdAt), label: t("auditLogs.time") },
        ],
        data: allData,
        filename: slugifyFilename("nhat_ky_he_thong"),
      });

      toast.success(t("auditLogs.exportSuccess", { count: allData.length }), { id: "csv-export" });
    } catch {
      toast.error(t("auditLogs.exportError"), { id: "csv-export" });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setActionFilter("all");
    setTableFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    actionFilter !== "all" || tableFilter !== "all" || startDate || endDate;

  // Get role display name
  const getRoleDisplay = (log) => {
    const role = log.user?.role;
    if (role?.displayName) return role.displayName;
    if (role?.name) {
      const names = {
        super_admin: "Super Admin",
        admin: "Admin",
        business: "Business",
        staff: "Staff",
        user: "User",
        guest: "Guest",
      };
      return names[role.name] || role.name;
    }
    return "N/A";
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased selection:bg-[#F3E600] selection:text-slate-950 max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F3E600] shadow-[0_0_6px_#F3E600]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nhật ký Kiểm toán // AUDIT LOGS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Nhật ký Hoạt động Hệ thống
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {t("auditLogs.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-4 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] font-mono text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>CSV EXPORT</span>
          </button>
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 text-slate-800 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimStatsCard
          title={t("auditLogs.totalRecords")}
          value={stats.total}
          icon={FileText}
        />
        <TimStatsCard
          title={t("auditLogs.created")}
          value={stats.create}
          icon={CheckCircle}
        />
        <TimStatsCard
          title={t("auditLogs.updated")}
          value={stats.update}
          icon={Edit}
        />
        <TimStatsCard
          title={t("auditLogs.deleted")}
          value={stats.delete}
          icon={Trash2}
        />
      </section>

      {/* Filter Bar */}
      <section className="bg-white rounded-2xl border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("common.filter")}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
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

      {/* Data Table */}
      <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {(() => {
          if (loading) {
            return (
              <div className="py-24 text-center space-y-3">
                <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
                <span className="text-xs font-semibold text-slate-500">{t("auditLogs.loadingData")}</span>
              </div>
            );
          }

          if (logs.length === 0) {
            return (
              <div className="py-20 text-center text-slate-400 p-6">
                <FileText className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="font-bold text-slate-800 text-sm">{t("auditLogs.noData")}</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#F8F7F3] hover:bg-[#F4F2EC] transition-colors"
                  >
                    {t("auditLogs.clearFilters")}
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-black/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-4 w-[60px] hidden sm:table-cell">STT</th>
                    <th className="p-4 min-w-[200px]">{t("auditLogs.performer")}</th>
                    <th className="p-4 w-[110px] hidden md:table-cell">{t("auditLogs.role")}</th>
                    <th className="p-4 w-[130px]">{t("auditLogs.actionCol")}</th>
                    <th className="p-4 w-[140px] hidden sm:table-cell">{t("auditLogs.object")}</th>
                    <th className="p-4">{t("auditLogs.description")}</th>
                    <th className="p-4 w-[120px] hidden lg:table-cell">{t("auditLogs.ip")}</th>
                    <th className="p-4 w-[140px] hidden md:table-cell">{t("auditLogs.time")}</th>
                    <th className="p-4 text-center w-[70px]">{t("auditLogs.details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {logs.map((log, index) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FAF9F5] group transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                        #{getTableSerialNumber(
                          totalItems || logs.length,
                          index,
                          currentPage,
                          itemsPerPage,
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                            {(log.user?.profile?.fullName || log.user?.email || "N/A")
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {log.user?.profile?.fullName || log.user?.email || "N/A"}
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
                          className="h-8 w-8 rounded-full bg-[#F8F7F3] hover:bg-slate-950 hover:text-white transition-all flex items-center justify-center mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs">
            <span className="font-mono text-slate-500 tabular-nums">
              {t("auditLogs.page", { page: currentPage, totalPages, count: logs.length })}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all"
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all"
              >
                {t("common.previous")}
              </button>
              <span className="px-3 font-mono font-bold text-slate-950 tabular-nums">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all"
              >
                {t("common.nextPage")}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-black/[0.06] p-0 bg-white shadow-xl">
          <DialogHeader className="p-6 border-b border-black/[0.04] bg-[#FAF9F5]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-950 text-[#F3E600] flex items-center justify-center shadow-2xs">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-slate-950">
                  {t("auditLogs.detailTitle")}
                </DialogTitle>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
                  AUDIT LOG #{selectedLog?.id}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="p-6 space-y-5">
              {/* Action & Table Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    {t("auditLogs.actionCol")}
                  </label>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono inline-block ${auditLogService.getActionColor(selectedLog.action)}`}
                  >
                    {auditLogService.getActionLabel(selectedLog.action)} ({selectedLog.action})
                  </span>
                </div>

                <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    {t("auditLogs.object")}
                  </label>
                  <div className="font-mono font-bold text-xs text-slate-900">
                    {auditLogService.getTableLabel(selectedLog.tableName)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedLog.tableName} #{selectedLog.recordId}
                  </div>
                </div>

                <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    {t("auditLogs.time")}
                  </label>
                  <div className="font-mono text-xs text-slate-800 tabular-nums">
                    {formatDateTime(selectedLog.createdAt)}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedLog.description && (
                <div className="bg-[#FFFDE6] rounded-2xl p-4 border border-[#F3E600]/80">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {t("auditLogs.description")}
                  </label>
                  <div className="text-xs font-medium text-slate-900">
                    {selectedLog.description}
                  </div>
                </div>
              )}

              {/* User Info */}
              <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  {t("auditLogs.performer")}
                </label>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 text-white w-10 h-10 flex items-center justify-center rounded-full text-xs font-bold">
                    {(selectedLog.user?.profile?.fullName || selectedLog.user?.email || "N/A")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900">
                      {selectedLog.user?.profile?.fullName || selectedLog.user?.email || "N/A"}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {selectedLog.user?.email || "N/A"}
                    </div>
                    <div className="mt-1">
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#F8F7F3] text-slate-700 border border-black/[0.04] inline-flex items-center gap-1">
                        <Shield className="w-3 h-3 text-slate-400" />
                        {getRoleDisplay(selectedLog)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> {t("auditLogs.ipAddress")}
                  </label>
                  <div className="font-mono text-xs text-slate-800 tabular-nums">
                    {selectedLog.ipAddress || t("auditLogs.notDefined")}
                  </div>
                </div>
                <div className="bg-[#F8F7F3] rounded-2xl p-4 border border-black/[0.03]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5" /> {t("auditLogs.device")}
                  </label>
                  <div className="font-mono text-[11px] text-slate-600 break-all line-clamp-2">
                    {selectedLog.userAgent || t("auditLogs.notDefined")}
                  </div>
                </div>
              </div>

              {/* Data Comparison */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t("auditLogs.dataChanges")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLog.oldData && (
                      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
                        <div className="bg-rose-50 text-rose-700 px-4 py-2 border-b border-rose-100 font-bold text-xs flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5" /> {t("auditLogs.oldData")}
                        </div>
                        <div className="p-4 max-h-60 overflow-y-auto">
                          <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700">
                            {typeof selectedLog.oldData === "string"
                              ? selectedLog.oldData
                              : JSON.stringify(selectedLog.oldData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedLog.newData && (
                      <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 border-b border-emerald-100 font-bold text-xs flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> {t("auditLogs.newData")}
                        </div>
                        <div className="p-4 max-h-60 overflow-y-auto">
                          <pre className="text-[11px] font-mono whitespace-pre-wrap text-slate-700">
                            {typeof selectedLog.newData === "string"
                              ? selectedLog.newData
                              : JSON.stringify(selectedLog.newData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="h-10 px-6 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-black shadow-sm"
                >
                  {t("auditLogs.close")}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
