import { useState, useEffect, useCallback } from "react";
import FileText from "lucide-react/dist/esm/icons/file-text";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Eye from "lucide-react/dist/esm/icons/eye";
import Filter from "lucide-react/dist/esm/icons/filter";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import toast from "react-hot-toast";
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
import TimStatsCard from "@/components/admin/TimStatsCard";

const AuditLogsPage = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        action: actionFilter === "all" ? undefined : actionFilter,
        tableName: tableFilter === "all" ? undefined : tableFilter,
      };
      const response = await auditLogService.getAll(params);
      if (response.success) {
        setLogs(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);

        // Calculate stats from current logs
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
      toast.error("Lỗi khi tải audit logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter, tableFilter]);

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
      toast.error("Lỗi khi tải chi tiết log");
      console.error(error);
    }
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      UPDATE_ROLE: "bg-orange-100 text-orange-700",
      UPDATE_PERMISSIONS: "bg-purple-100 text-purple-700",
      ASSIGN_TAGS: "bg-cyan-100 text-cyan-700",
    };
    return colors[action] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen p-8 bg-background relative">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none"></div>

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-black pb-6">
          <div className="flex items-center gap-6">
            <div className="accent-bar h-16"></div>
            <div>
              <h1 className="tim-title">AUDIT LOGS</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // AUDIT TRACKING
                </span>
                <p className="tim-meta">LỊCH SỚ HOẠT ĐỘNG QUẢN TRỊ VIÊN</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => fetchLogs()}
            disabled={loading}
            variant="outline"
            className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Thống kê nhanh (theo trang hiện tại) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title="TỔNG GHI NHẬN"
            value={stats.total}
            icon={FileText}
            serial="AUD-001"
          />
          <TimStatsCard
            title="TẠO MỚI"
            value={stats.create}
            icon={CheckCircle}
            serial="AUD-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="CẬP NHẬT"
            value={stats.update}
            icon={Edit}
            serial="AUD-003"
            textColor="text-blue-600"
          />
          <TimStatsCard
            title="XÓA"
            value={stats.delete}
            icon={Trash2}
            serial="AUD-004"
            color="bg-yellow-50"
            textColor="text-red-600"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-black p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="tim-meta">BỘ LỌC DỮ LIỆU</span>
            <div className="flex gap-2">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50"
              >
                <option value="all">TẤT CẢ HÀNH ĐỘNG</option>
                {auditLogService.getActionTypes().map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              <select
                value={tableFilter}
                onChange={(e) => {
                  setTableFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50"
              >
                <option value="all">TẤT CẢ BẢNG</option>
                {auditLogService.getTableNames().map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
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
                    LOADING DATA...
                  </span>
                </div>
              );
            }

            if (logs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <div className="font-bold uppercase text-gray-400">
                    KHÔNG TÌM THẤY DỮ LIỆU
                  </div>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white tim-table-header">
                      <th className="p-4 border-r border-black/20 w-[60px]">
                        ID
                      </th>
                      <th className="p-4 border-r border-black/20">USER</th>
                      <th className="p-4 border-r border-black/20">
                        HÀNH ĐỘNG
                      </th>
                      <th className="p-4 border-r border-black/20">BẢNG</th>
                      <th className="p-4 border-r border-black/20">
                        RECORD ID
                      </th>
                      <th className="p-4 border-r border-black/20">MÔ TẢ</th>
                      <th className="p-4 border-r border-black/20">
                        THỜI GIAN
                      </th>
                      <th className="p-4 text-center">CHI TIẾT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-yellow-50 group transition-colors"
                      >
                        <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                          #{log.id}
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <div>
                            <div className="font-bold uppercase text-sm">
                              {log.user?.profile?.fullName || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs font-mono">
                              {log.user?.email || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <span
                            className={`px-2.5 py-1 rounded-none border border-black text-[10px] font-bold uppercase font-mono ${getActionColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <span className="font-mono text-sm font-medium">
                            {log.tableName}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <span className="font-mono text-sm text-gray-600">
                            {log.recordId}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <span className="text-sm text-gray-600">
                            {log.description || "—"}
                          </span>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <span className="font-mono text-sm text-gray-500">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(log)}
                            className="rounded-none border border-transparent hover:border-black hover:bg-white h-8"
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
              <div>HIỂN THỊ {logs.length} KẾT QUẢ</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-none border-black h-8 hover:bg-black hover:text-white"
                >
                  TRƯỚC
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
                  SAU
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal - T.I.M Style */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-none border-2 border-black">
            <DialogHeader className="border-b-2 border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="accent-bar h-12"></div>
                <div>
                  <DialogTitle className="tim-title text-2xl">
                    LOG DETAIL
                  </DialogTitle>
                  <div className="tim-meta mt-1">
                    AUDIT LOG #{selectedLog?.id}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-6 pt-4">
                {/* Main Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-black p-4">
                    <label className="tim-meta block mb-2">HÀNH ĐỘNG</label>
                    <span
                      className={`px-3 py-1.5 rounded-none border border-black text-xs font-bold uppercase font-mono inline-block ${getActionColor(selectedLog.action)}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-black p-4">
                    <label className="tim-meta block mb-2">BẢNG</label>
                    <div className="font-mono font-bold uppercase text-sm">
                      {selectedLog.tableName}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-black p-4">
                    <label className="tim-meta block mb-2">RECORD ID</label>
                    <div className="font-mono text-sm">
                      {selectedLog.recordId}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-black p-4">
                    <label className="tim-meta block mb-2">THỜI GIAN</label>
                    <div className="font-mono text-sm">
                      {formatDateTime(selectedLog.createdAt)}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-white border-l-4 border-l-[#F3E600] border border-black p-4">
                  <label className="tim-meta block mb-2">NGƯỜI THỰC HIỆN</label>
                  <div className="flex items-center gap-4">
                    <div className="bg-black text-white px-3 py-2 rounded-none">
                      <span className="font-mono text-xs uppercase">
                        {(
                          selectedLog.user?.profile?.fullName || "N/A"
                        ).substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-sm">
                        {selectedLog.user?.profile?.fullName || "N/A"}
                      </div>
                      <div className="font-mono text-xs text-gray-500">
                        {selectedLog.user?.email || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedLog.description && (
                  <div className="bg-gray-50 border border-black p-4">
                    <label className="tim-meta block mb-2">MÔ TẢ</label>
                    <div className="text-sm">{selectedLog.description}</div>
                  </div>
                )}

                {/* Data Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.oldData && (
                    <div className="bg-white border border-black">
                      <div className="bg-black text-white p-3 border-b border-black">
                        <span className="tim-meta text-white">DỮ LIỆU CŨ</span>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.oldData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.newData && (
                    <div className="bg-white border border-black">
                      <div className="bg-black text-white p-3 border-b border-black">
                        <span className="tim-meta text-white">DỮ LIỆU MỚI</span>
                      </div>
                      <div className="p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.newData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t border-black">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    className="rounded-none border border-black bg-white text-black hover:bg-black hover:text-white h-10 px-8 font-bold uppercase"
                  >
                    ĐÓNG
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
