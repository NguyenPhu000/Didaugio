import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  AlertCircle,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { exportToCsv, fetchAllPages, formatCsvDate, slugifyFilename } from "@/utils/csvExport";
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
import { loginHistoryService } from "@/apis";
import { formatDate } from "@/utils/dateUtils";
import { useAuthStore } from "@/stores/authStore";
import TimStatsCard from "@/components/admin/TimStatsCard";

const LoginHistoryPage = () => {
  const { user: currentUser } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revoked: 0,
    expired: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
      };
      const response = await loginHistoryService.getAll(params);
      if (response.success) {
        setSessions(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử đăng nhập");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await loginHistoryService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [fetchSessions, fetchStats]);

  // View detail
  const handleViewDetail = async (session) => {
    try {
      const response = await loginHistoryService.getById(session.id);
      if (response.success) {
        setSelectedSession(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      toast.error("Lỗi khi tải chi tiết session");
      console.error(error);
    }
  };

  // Revoke session
  const handleRevoke = async (sessionId) => {
    if (!window.confirm("Bạn có chắc muốn vô hiệu hóa session này?")) return;

    try {
      const response = await loginHistoryService.revoke(sessionId);
      if (response.success) {
        toast.success("Đã vô hiệu hóa session");
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error("Lỗi khi vô hiệu hóa session");
      console.error(error);
    }
  };

  // Revoke all except current
  const handleRevokeAll = async (userId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn đăng xuất tất cả thiết bị khác? (Giữ lại session hiện tại)",
      )
    )
      return;

    try {
      // Lấy currentSessionId từ localStorage (nếu có lưu)
      const currentSessionId = loginHistoryService.getCurrentSessionId();
      const response = await loginHistoryService.revokeAll(
        userId,
        currentSessionId,
      );
      if (response.success) {
        toast.success(response.message || "Đã đăng xuất tất cả thiết bị khác");
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi khi đăng xuất tất cả thiết bị",
      );
      console.error(error);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      toast.loading("Đang xuất dữ liệu...", { id: "csv-export" });
      const allData = await fetchAllPages(loginHistoryService.getAll, {
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      });

      const getStatusLabel = (s) => {
        const status = s.status || "active";
        if (status === "revoked" || !s.isActive) return "Đã vô hiệu";
        if (status === "expired") return "Hết hạn";
        return "Đang hoạt động";
      };

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          { key: (row) => row.user?.profile?.fullName || "N/A", label: "Người dùng" },
          { key: (row) => row.user?.email || "", label: "Email" },
          { key: "deviceName", label: "Thiết bị" },
          { key: "ipAddress", label: "IP" },
          { key: getStatusLabel, label: "Trạng thái" },
          { key: (row) => formatCsvDate(row.createdAt), label: "Đăng nhập" },
          { key: (row) => formatCsvDate(row.lastUsedAt), label: "Dùng gần nhất" },
          { key: (row) => formatCsvDate(row.expiresAt), label: "Hết hạn" },
        ],
        data: allData,
        filename: slugifyFilename("lich_su_dang_nhap"),
      });

      toast.success(`Đã xuất ${allData.length} bản ghi`, { id: "csv-export" });
    } catch {
      toast.error("Lỗi khi xuất dữ liệu", { id: "csv-export" });
    }
  };

  // Get status info (sử dụng status computed từ backend)
  const getStatusInfo = (session) => {
    // Backend đã compute status: active, revoked, expired
    const status = session.status || "active";

    if (status === "revoked" || !session.isActive) {
      return {
        label: "Đã vô hiệu",
        color: "text-gray-600 bg-gray-100",
        icon: <Ban className="w-4 h-4" />,
      };
    }
    if (status === "expired") {
      return {
        label: "Hết hạn",
        color: "text-red-600 bg-red-100",
        icon: <XCircle className="w-4 h-4" />,
      };
    }
    return {
      label: "Đang hoạt động",
      color: "text-green-600 bg-green-100",
      icon: <CheckCircle className="w-4 h-4" />,
    };
  };

  // Get device icon
  const getDeviceIcon = (deviceName) => {
    if (!deviceName) return <Monitor className="w-4 h-4" />;
    const lower = deviceName.toLowerCase();
    if (
      lower.includes("mobile") ||
      lower.includes("android") ||
      lower.includes("iphone")
    ) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  // Truncate device name
  const truncateDevice = (name) => {
    if (!name) return "Unknown";
    return name.length > 50 ? `${name.substring(0, 50)}...` : name;
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
              <h1 className="tim-title">LỊCH SỚ ĐĂNG NHẬP</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // LOGIN HISTORY
                </span>
                <p className="tim-meta">QUẢN LÝ SESSIONS VÀ THIẾT BỊ</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="h-12 rounded-none border border-black hover:bg-black hover:text-white px-4 font-mono text-xs uppercase font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={() => fetchSessions()}
              disabled={loading}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title="TỔNG SESSION"
            value={stats.total}
            icon={Monitor}
            serial="LGN-001"
          />
          <TimStatsCard
            title="ĐANG HOẠT ĐỘNG"
            value={stats.active}
            icon={CheckCircle}
            serial="LGN-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title="ĐÃ VÔ HIỆU"
            value={stats.revoked}
            icon={Ban}
            serial="LGN-003"
            textColor="text-gray-500"
          />
          <TimStatsCard
            title="HẾT HẠN"
            value={stats.expired}
            icon={XCircle}
            serial="LGN-004"
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
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50"
              >
                <option value="all">TẤT CẢ TRẠNG THÁI</option>
                <option value="active">ĐANG HOẠT ĐỘNG</option>
                <option value="inactive">ĐÃ VÔ HIỆU</option>
              </select>
              {currentUser && (
                <Button
                  variant="outline"
                  onClick={() => handleRevokeAll(currentUser.id)}
                  className="h-10 rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  ĐĂNG XUẤT TẤT CẢ
                </Button>
              )}
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

            if (sessions.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20">
                  <Monitor className="h-12 w-12 text-gray-300 mb-4" />
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
                      <th className="p-4 border-r border-black/20">THIẾT BỊ</th>
                      <th className="p-4 border-r border-black/20">
                        IP ADDRESS
                      </th>
                      <th className="p-4 border-r border-black/20">
                        TRẠNG THÁI
                      </th>
                      <th className="p-4 border-r border-black/20">
                        ĐĂNG NHẬP
                      </th>
                      <th className="p-4 border-r border-black/20">
                        DÙNG GẦN NHẤT
                      </th>
                      <th className="p-4 border-r border-black/20">HẾT HẠN</th>
                      <th className="p-4 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {sessions.map((session) => {
                      const statusInfo = getStatusInfo(session);
                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-yellow-50 group transition-colors"
                        >
                          <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                            #{session.id}
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div>
                              <div className="font-bold uppercase text-sm">
                                {session.user?.profile?.fullName || "N/A"}
                              </div>
                              <div className="text-gray-500 text-xs font-mono">
                                {session.user?.email || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(session.deviceName)}
                              <span className="truncate max-w-[200px] text-sm">
                                {truncateDevice(session.deviceName)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <span className="font-mono text-sm">
                              {session.ipAddress}
                            </span>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-none border border-black text-[10px] font-bold uppercase font-mono ${statusInfo.color}`}
                            >
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <span className="font-mono text-sm text-gray-500">
                              {formatDate(session.createdAt)}
                            </span>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <span className="font-mono text-sm text-gray-500">
                              {formatDate(session.lastUsedAt)}
                            </span>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <span className="font-mono text-sm text-gray-500">
                              {formatDate(session.expiresAt)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetail(session)}
                                className="rounded-none border border-transparent hover:border-black hover:bg-white h-8"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {session.isActive && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRevoke(session.id)}
                                  className="rounded-none border border-transparent hover:border-red-600 hover:bg-red-50 text-red-600 hover:text-red-700 h-8"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50 font-mono text-xs uppercase">
              <div>HIỂN THỊ {sessions.length} KẾT QUẢ</div>
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

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Session #{selectedSession?.id}</DialogTitle>
            </DialogHeader>
            {selectedSession && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      User
                    </label>
                    <p className="mt-1">
                      {selectedSession.user?.profile?.fullName || "N/A"}
                      <br />
                      <span className="text-sm text-gray-500">
                        {selectedSession.user?.email}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Trạng thái
                    </label>
                    <p className="mt-1">
                      {(() => {
                        const statusInfo = getStatusInfo(selectedSession);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">
                      Thiết bị
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      {getDeviceIcon(selectedSession.deviceName)}
                      <p className="break-all">{selectedSession.deviceName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      IP Address
                    </label>
                    <p className="mt-1 font-mono">
                      {selectedSession.ipAddress}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Device ID
                    </label>
                    <p className="mt-1 font-mono">
                      {selectedSession.deviceId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Đăng nhập lúc
                    </label>
                    <p className="mt-1">
                      {formatDate(selectedSession.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Sử dụng lần cuối
                    </label>
                    <p className="mt-1">
                      {formatDate(selectedSession.lastUsedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Hết hạn lúc
                    </label>
                    <p className="mt-1">
                      {formatDate(selectedSession.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Refresh Token
                    </label>
                    <p className="mt-1 font-mono text-xs truncate">
                      {selectedSession.refreshToken}
                    </p>
                  </div>
                </div>

                {selectedSession.isActive && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRevoke(selectedSession.id);
                        setShowDetailModal(false);
                      }}
                      className="w-full"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Vô hiệu hóa Session
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoginHistoryPage;
