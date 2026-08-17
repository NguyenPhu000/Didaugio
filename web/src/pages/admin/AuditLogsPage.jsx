// MAP: AuditLogsPage
// ├── UI: @/components/admin/audit-logs/{AuditLogFilterBar, AuditLogTableView, AuditLogDetailModal}
// └── API: @/apis/auditLogService

import {
  FileText,
  RefreshCw,
  CheckCircle,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import auditLogService from "@/apis/auditLogService";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
import TimStatsCard from "@/components/admin/TimStatsCard";

// Extracted Sub-Components
import { getRoleDisplay } from "@/components/admin/audit-logs/auditLogsConstants";
import AuditLogFilterBar from "@/components/admin/audit-logs/AuditLogFilterBar";
import AuditLogTableView from "@/components/admin/audit-logs/AuditLogTableView";
import AuditLogDetailModal from "@/components/admin/audit-logs/AuditLogDetailModal";

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
          {
            key: (row) =>
              row.user?.profile?.fullName || row.user?.email || "N/A",
            label: t("auditLogs.performer"),
          },
          { key: (row) => getRoleDisplay(row), label: t("auditLogs.role") },
          { key: "action", label: t("auditLogs.actionCol") },
          {
            key: (row) => auditLogService.getTableLabel(row.tableName),
            label: t("auditLogs.dataTable"),
          },
          { key: "recordId", label: "Record ID" },
          {
            key: (row) => row.description || "",
            label: t("auditLogs.description"),
          },
          { key: (row) => row.ipAddress || "", label: "IP" },
          {
            key: (row) => formatCsvDate(row.createdAt),
            label: t("auditLogs.time"),
          },
        ],
        data: allData,
        filename: slugifyFilename("nhat_ky_he_thong"),
      });

      toast.success(
        t("auditLogs.exportSuccess", { count: allData.length }),
        { id: "csv-export" }
      );
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

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center h-10 px-4 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] font-mono text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>CSV EXPORT</span>
          </button>
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-800 ${loading ? "animate-spin" : ""}`}
            />
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
      <AuditLogFilterBar
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        tableFilter={tableFilter}
        setTableFilter={setTableFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        setCurrentPage={setCurrentPage}
      />

      {/* Data Table */}
      <AuditLogTableView
        loading={loading}
        logs={logs}
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        handleViewDetail={handleViewDetail}
      />

      {/* Detail Modal */}
      <AuditLogDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        selectedLog={selectedLog}
      />
    </div>
  );
};

export default AuditLogsPage;
