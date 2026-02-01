import { useState, useEffect } from "react";
import FileText from "lucide-react/dist/esm/icons/file-text";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Eye from "lucide-react/dist/esm/icons/eye";
import Filter from "lucide-react/dist/esm/icons/filter";
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
import { formatDate, formatDateTime } from "@/utils/dateUtils";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch logs
  const fetchLogs = async () => {
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
      }
    } catch (error) {
      toast.error("Lỗi khi tải audit logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, tableFilter]);

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-gray-500">
              Lịch sử hoạt động của Admin, Staff, Business trên trang quản lý
            </p>
          </div>
        </div>
        <Button onClick={() => fetchLogs()} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Danh sách Audit Logs</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Chỉ hiển thị hoạt động của Admin, Super Admin, Staff, Business
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">Tất cả hành động</option>
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
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">Tất cả bảng</option>
                {auditLogService.getTableNames().map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-500 mt-2">Không có dữ liệu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bảng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Record ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mô tả
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{log.id}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">
                            {log.user?.profile?.fullName || "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {log.user?.email || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.tableName}
                      </td>
                      <td className="px-4 py-3 text-sm">{log.recordId}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetail(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Audit Log #{selectedLog?.id}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Hành động
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                        selectedLog.action,
                      )}`}
                    >
                      {selectedLog.action}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Bảng
                  </label>
                  <p className="mt-1 font-mono">{selectedLog.tableName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Record ID
                  </label>
                  <p className="mt-1">{selectedLog.recordId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Thời gian
                  </label>
                  <p className="mt-1">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    User
                  </label>
                  <p className="mt-1">
                    {selectedLog.user?.profile?.fullName || "N/A"} (
                    {selectedLog.user?.email || "N/A"})
                  </p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mô tả
                  </label>
                  <p className="mt-1 text-gray-700">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {selectedLog.oldData && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Dữ liệu cũ
                  </label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Dữ liệu mới
                  </label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;
