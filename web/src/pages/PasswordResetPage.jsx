import { useState, useEffect } from "react";
import {
  Key,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { passwordResetService } from "@/apis";
import { formatDate } from "@/utils/dateUtils";

const PasswordResetPage = () => {
  const [resets, setResets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    used: 0,
    expired: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch resets
  const fetchResets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === "all" ? undefined : statusFilter,
      };
      const response = await passwordResetService.getAll(params);
      if (response.success) {
        setResets(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách reset mật khẩu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await passwordResetService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchResets();
    fetchStats();
  }, [currentPage, statusFilter]);

  // Get status info
  const getStatusInfo = (reset) => {
    const now = new Date();
    const expiresAt = new Date(reset.expiresAt);

    if (reset.usedAt) {
      return {
        label: "Đã sử dụng",
        color: "text-green-600 bg-green-100",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    }
    if (expiresAt < now) {
      return {
        label: "Hết hạn",
        color: "text-red-600 bg-red-100",
        icon: <XCircle className="w-4 h-4" />,
      };
    }
    return {
      label: "Chờ sử dụng",
      color: "text-yellow-600 bg-yellow-100",
      icon: <Clock className="w-4 h-4" />,
    };
  };


  // Calculate time remaining
  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return "Đã hết hạn";

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} phút`;

    const hours = Math.floor(minutes / 60);
    return `${hours} giờ ${minutes % 60} phút`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">Reset Mật Khẩu</h1>
            <p className="text-gray-500">Quản lý yêu cầu reset password</p>
          </div>
        </div>
        <Button onClick={() => fetchResets()} disabled={loading}>
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
              <p className="text-gray-500 text-sm">Chờ sử dụng</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Đã sử dụng</p>
              <p className="text-3xl font-bold text-green-600">{stats.used}</p>
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
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách Password Resets</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ sử dụng</option>
              <option value="used">Đã sử dụng</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : resets.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-gray-300" />
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
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hết hạn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thời gian còn lại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Đã dùng lúc
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resets.map((reset) => {
                    const statusInfo = getStatusInfo(reset);
                    return (
                      <tr key={reset.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{reset.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {reset.email}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {reset.user?.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {reset.ipAddress}
                          </div>
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
                          {formatDate(reset.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(reset.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {!reset.usedAt && (
                            <span
                              className={
                                new Date(reset.expiresAt) > new Date()
                                  ? "text-yellow-600 font-medium"
                                  : "text-red-600"
                              }
                            >
                              {getTimeRemaining(reset.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {reset.usedAt ? formatDate(reset.usedAt) : "-"}
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
    </div>
  );
};

export default PasswordResetPage;
