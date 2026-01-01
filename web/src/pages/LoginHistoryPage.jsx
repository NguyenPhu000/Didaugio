import { useState, useEffect } from "react";
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
} from "lucide-react";
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
import { loginHistoryService } from "@/services";
import { useAuthStore } from "@/stores/authStore";

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
  const fetchSessions = async () => {
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
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await loginHistoryService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, [currentPage, statusFilter]);

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
        "Bạn có chắc muốn đăng xuất tất cả thiết bị khác? (Giữ lại session hiện tại)"
      )
    )
      return;

    try {
      const currentSessionId = loginHistoryService.getCurrentSessionId();
      const response = await loginHistoryService.revokeAll(
        userId,
        currentSessionId
      );
      if (response.success) {
        toast.success("Đã đăng xuất tất cả thiết bị khác");
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error("Lỗi khi đăng xuất tất cả");
      console.error(error);
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

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // Truncate device name
  const truncateDevice = (name) => {
    if (!name) return "Unknown";
    return name.length > 50 ? name.substring(0, 50) + "..." : name;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-8 h-8 text-cyan-600" />
          <div>
            <h1 className="text-2xl font-bold">Lịch Sử Đăng Nhập</h1>
            <p className="text-gray-500">Quản lý sessions và thiết bị</p>
          </div>
        </div>
        <Button onClick={() => fetchSessions()} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Tổng số</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Đang hoạt động</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Đã vô hiệu</p>
              <p className="text-3xl font-bold text-gray-600">
                {stats.revoked}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Hết hạn</p>
              <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Danh sách Sessions</CardTitle>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã vô hiệu</option>
              </select>
              {currentUser && (
                <Button
                  variant="outline"
                  onClick={() => handleRevokeAll(currentUser.id)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Đăng xuất tất cả
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-12 h-12 mx-auto text-gray-300" />
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
                      Thiết bị
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Đăng nhập
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Sử dụng gần nhất
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hết hạn
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const statusInfo = getStatusInfo(session);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{session.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-medium">
                              {session.user?.profile?.fullName || "N/A"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {session.user?.email || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceName)}
                            <span className="truncate max-w-[200px]">
                              {truncateDevice(session.deviceName)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {session.ipAddress}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(session.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(session.lastUsedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(session.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(session)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {session.isActive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRevoke(session.id)}
                                className="text-red-600 hover:text-red-700"
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
                  <p className="mt-1 font-mono">{selectedSession.ipAddress}</p>
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
  );
};

export default LoginHistoryPage;
