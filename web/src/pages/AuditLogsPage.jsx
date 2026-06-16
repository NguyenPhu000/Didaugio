import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import FileText from "lucide-react/dist/esm/icons/file-text";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Eye from "lucide-react/dist/esm/icons/eye";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Shield from "lucide-react/dist/esm/icons/shield";
import Globe from "lucide-react/dist/esm/icons/globe";
import Monitor from "lucide-react/dist/esm/icons/monitor";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import X from "lucide-react/dist/esm/icons/x";
import Download from "lucide-react/dist/esm/icons/download";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import auditLogService from "@/apis/auditLogService";
import { formatDateTime } from "@/utils/dateUtils";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
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

        const allLogs = response.data || [];
        setStats({
          total: response.pagination?.total || allLogs.length,
          create: allLogs.filter((l) => l.action === "CREATE").length,
          update: allLogs.filter(
            (l) =>
              l.action === "UPDATE" ||
              l.action === "UPDATE_ROLE" ||
              l.action === "UPDATE_PERMISSIONS",
          ).length,
          delete: allLogs.filter((l) => l.action === "DELETE").length,
        });
      }
    } catch (error) {
      toast.error(t("auditLogs.loadingError"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, tableFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // View detail
  const handleViewDetail = async (log) => {
    try {
      const response = await auditLogService.getById(log.id);
      if (response.success) {
        setSelectedLog(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error(t("auditLogs.detailError"));
      console.error(error);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      toast.loading(t("auditLogs.exporting"), { id: "csv-export" });
      const allData = await fetchAllPages(auditLogService.getAll, {
        action: actionFilter === "all" ? undefined : actionFilter,
        tableName: tableFilter === "all" ? undefined : tableFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          { key: (row) => row.user?.profile?.fullName || "N/A", label: t("auditLogs.performer") },
          { key: (row) => row.user?.email || "", label: "Email" },
          { key: (row) => row.user?.role?.displayName || row.user?.role?.name || "", label: t("auditLogs.role") },
          { key: "action", label: t("auditLogs.action") },
          { key: "tableName", label: t("auditLogs.object") },
          { key: "recordId", label: "Record ID" },
          { key: "description", label: t("auditLogs.description") },
          { key: "ipAddress", label: "IP" },
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
    <div className="min-h-screen p-8 bg-background relative">
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16 shrink-0"></div>
            <div>
              <h1 className="tim-title">AUDIT LOGS</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0">
                  SYSTEM // AUDIT TRACKING
                </span>
                <p className="tim-meta">{t("auditLogs.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="flex-1 sm:flex-none h-12 rounded-none border border-black hover:bg-black hover:text-white px-4 font-mono text-xs uppercase font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={() => fetchLogs()}
              disabled={loading}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("auditLogs.totalRecords")}
            value={stats.total}
            icon={FileText}
            serial="AUD-001"
          />
          <TimStatsCard
            title={t("auditLogs.created")}
            value={stats.create}
            icon={CheckCircle}
            serial="AUD-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title={t("auditLogs.updated")}
            value={stats.update}
            icon={Edit}
            serial="AUD-003"
            textColor="text-blue-600"
          />
          <TimStatsCard
            title={t("auditLogs.deleted")}
            value={stats.delete}
            icon={Trash2}
            serial="AUD-004"
            color="bg-yellow-50"
            textColor="text-red-600"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-black p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
            <span className="tim-meta">{t("common.filter").toUpperCase()}</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-none border border-red-300 text-red-600 hover:bg-red-50 h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                {t("auditLogs.clearFilters")}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-3 w-full">
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-[10px] font-mono uppercase text-gray-500">
                {t("auditLogs.action")}
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50 w-full lg:min-w-[180px]"
              >
                <option value="all">{t("auditLogs.allActions")}</option>
                {auditLogService.getActionTypes().map((action) => (
                  <option key={action} value={action}>
                    {auditLogService.getActionLabel(action)} ({action})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-[10px] font-mono uppercase text-gray-500">
                {t("auditLogs.dataTable")}
              </label>
              <select
                value={tableFilter}
                onChange={(e) => {
                  setTableFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50 w-full lg:min-w-[180px]"
              >
                <option value="all">{t("auditLogs.allTables")}</option>
                {auditLogService.getTableNames().map((table) => (
                  <option key={table} value={table}>
                    {auditLogService.getTableLabel(table)} ({table})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-[10px] font-mono uppercase text-gray-500">
                {t("auditLogs.fromDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 border border-black rounded-none bg-white font-mono text-sm focus:outline-none focus:bg-yellow-50 w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-[10px] font-mono uppercase text-gray-500">
                {t("auditLogs.toDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 border border-black rounded-none bg-white font-mono text-sm focus:outline-none focus:bg-yellow-50 w-full"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {(() => {
            if (loading) {
              return (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="font-mono text-xs uppercase text-gray-500">
                    {t("auditLogs.loadingData")}
                  </span>
                </div>
              );
            }

            if (logs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <div className="font-bold uppercase text-gray-400">
                    {t("auditLogs.noData")}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-3 rounded-none border border-black hover:bg-black hover:text-white"
                    >
                      {t("auditLogs.clearFilters")}
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white tim-table-header">
                      <th className="p-3 border-r border-black/20 w-[50px] hidden sm:table-cell">
                        ID
                      </th>
                      <th className="p-3 border-r border-black/20 min-w-[200px]">
                        {t("auditLogs.performer").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20 w-[100px] hidden md:table-cell">
                        {t("auditLogs.role").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20 w-[130px]">
                        {t("auditLogs.actionCol").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20 w-[120px] hidden sm:table-cell">
                        {t("auditLogs.object").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20">
                        {t("auditLogs.description").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20 w-[90px] hidden lg:table-cell">
                        {t("auditLogs.ip").toUpperCase()}
                      </th>
                      <th className="p-3 border-r border-black/20 w-[140px] hidden md:table-cell">
                        {t("auditLogs.time").toUpperCase()}
                      </th>
                      <th className="p-3 text-center w-[60px]">{t("auditLogs.details").toUpperCase()}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-yellow-50/50 group transition-colors"
                      >
                        <td className="p-3 font-mono text-sm text-gray-400 border-r border-black/5 hidden sm:table-cell">
                          #{log.id}
                        </td>
                        <td className="p-3 border-r border-black/5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                              {(log.user?.profile?.fullName || "N/A")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">
                                {log.user?.profile?.fullName || "N/A"}
                              </div>
                              <div className="text-gray-500 text-[11px] font-mono truncate">
                                {log.user?.email || "N/A"}
                              </div>
                              {/* Thông tin phụ hiển thị trên mobile */}
                              <div className="md:hidden mt-1 flex flex-wrap gap-1.5 items-center">
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono border ${auditLogService.getRoleColor(log.user?.role?.name)}`}>
                                  {getRoleDisplay(log)}
                                </span>
                                <span className="font-mono text-[9px] text-gray-400">
                                  {formatDateTime(log.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/5 hidden md:table-cell">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border ${auditLogService.getRoleColor(log.user?.role?.name)}`}
                          >
                            {getRoleDisplay(log)}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/5">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border ${auditLogService.getActionColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                          {/* Đối tượng nhỏ hiển thị trên mobile */}
                          <div className="sm:hidden mt-1 text-[10px] text-gray-400 font-mono">
                            {log.tableName} #{log.recordId}
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/5 hidden sm:table-cell">
                          <div>
                            <div className="font-mono text-xs font-medium">
                              {auditLogService.getTableLabel(log.tableName)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {log.tableName} #{log.recordId}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/5">
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {log.description || "—"}
                          </span>
                          {/* IP hiển thị trên mobile */}
                          <div className="lg:hidden mt-1 text-[10px] font-mono text-gray-400">
                            IP: {log.ipAddress || "—"}
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/5 hidden lg:table-cell">
                          <span className="font-mono text-[11px] text-gray-500">
                            {log.ipAddress || "—"}
                          </span>
                        </td>
                        <td className="p-3 border-r border-black/5 hidden md:table-cell">
                          <span className="font-mono text-[11px] text-gray-500">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(log)}
                            className="rounded-none border border-transparent hover:border-black hover:bg-white h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
            <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50 font-mono text-xs uppercase">
              <div>
                {t("auditLogs.page", { page: currentPage, totalPages, count: logs.length })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white px-2"
                >
                  &laquo;
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  {t("common.previous")}
                </Button>
                <span className="flex items-center px-4 font-bold">
                  {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  {t("common.nextPage")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white px-2"
                >
                  &raquo;
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-none border-2 border-black">
            <DialogHeader className="border-b-2 border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="accent-bar h-12"></div>
                <div>
                  <DialogTitle className="tim-title text-2xl">
                    {t("auditLogs.detailTitle")}
                  </DialogTitle>
                  <div className="tim-meta mt-1">
                    AUDIT LOG #{selectedLog?.id}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-5 pt-4">
                {/* Action & Table Info */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 border border-black p-3">
                    <label className="tim-meta block mb-2">{t("auditLogs.actionCol").toUpperCase()}</label>
                    <span
                      className={`px-3 py-1.5 rounded-none border text-xs font-bold uppercase font-mono inline-block ${auditLogService.getActionColor(selectedLog.action)}`}
                    >
                      {auditLogService.getActionLabel(selectedLog.action)} (
                      {selectedLog.action})
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-black p-3">
                    <label className="tim-meta block mb-2">{t("auditLogs.object").toUpperCase()}</label>
                    <div className="font-mono font-bold text-sm">
                      {auditLogService.getTableLabel(selectedLog.tableName)}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {selectedLog.tableName} #{selectedLog.recordId}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-black p-3">
                    <label className="tim-meta block mb-2">{t("auditLogs.time").toUpperCase()}</label>
                    <div className="font-mono text-sm">
                      {formatDateTime(selectedLog.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedLog.description && (
                  <div className="bg-yellow-50 border-l-4 border-l-[#F3E600] border border-black p-4">
                    <label className="tim-meta block mb-2">
                      {t("auditLogs.description").toUpperCase()}
                    </label>
                    <div className="text-sm font-medium">
                      {selectedLog.description}
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="bg-white border-l-4 border-l-[#F3E600] border border-black p-4">
                  <label className="tim-meta block mb-3">
                    {t("auditLogs.performer").toUpperCase()}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="bg-black text-white w-12 h-12 flex items-center justify-center rounded-none">
                      <span className="font-mono text-sm uppercase font-bold">
                        {(selectedLog.user?.profile?.fullName || "N/A")
                          .substring(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold uppercase text-sm">
                        {selectedLog.user?.profile?.fullName || "N/A"}
                      </div>
                      <div className="font-mono text-xs text-gray-500">
                        {selectedLog.user?.email || "N/A"}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase font-mono border inline-flex items-center gap-1 ${auditLogService.getRoleColor(selectedLog.user?.role?.name)}`}
                        >
                          <Shield className="w-3 h-3" />
                          {getRoleDisplay(selectedLog)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-black p-3">
                    <label className="tim-meta block mb-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {t("auditLogs.ipAddress")}
                    </label>
                    <div className="font-mono text-sm">
                      {selectedLog.ipAddress || t("auditLogs.notDefined")}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-black p-3">
                    <label className="tim-meta block mb-2 flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> {t("auditLogs.device")}
                    </label>
                    <div className="font-mono text-xs text-gray-600 break-all line-clamp-2">
                      {selectedLog.userAgent || t("auditLogs.notDefined")}
                    </div>
                  </div>
                </div>

                {/* Data Comparison */}
                {(selectedLog.oldData || selectedLog.newData) && (
                  <div>
                    <label className="tim-meta block mb-3">
                      {t("auditLogs.dataChanges")}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedLog.oldData && (
                        <div className="bg-white border border-black">
                          <div className="bg-red-600 text-white p-2 border-b border-black">
                            <span className="tim-meta text-white flex items-center gap-1">
                              <X className="w-3 h-3" /> {t("auditLogs.oldData")}
                            </span>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700">
                              {typeof selectedLog.oldData === "string"
                                ? selectedLog.oldData
                                : JSON.stringify(selectedLog.oldData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {selectedLog.newData && (
                        <div className="bg-white border border-black">
                          <div className="bg-emerald-600 text-white p-2 border-b border-black">
                            <span className="tim-meta text-white flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {t("auditLogs.newData")}
                            </span>
                          </div>
                          <div className="p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700">
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
                <div className="flex justify-end pt-4 border-t border-black">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    className="rounded-none border border-black bg-white text-black hover:bg-black hover:text-white h-10 px-8 font-bold uppercase"
                  >
                    {t("auditLogs.close")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AuditLogsPage;
