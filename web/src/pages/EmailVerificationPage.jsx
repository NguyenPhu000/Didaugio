import { useState, useEffect } from "react";
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { emailVerificationService } from "@/services";

const EmailVerificationPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    expired: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch verifications
  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === "all" ? undefined : statusFilter,
      };
      const response = await emailVerificationService.getAll(params);
      if (response.success) {
        setVerifications(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách xác thực email");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsData = await emailVerificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, [currentPage, statusFilter]);

  // Handle resend email
  const handleResend = async (userId, email) => {
    if (!window.confirm(`Gửi lại email xác thực đến ${email}?`)) return;

    try {
      const response = await emailVerificationService.resend(userId);
      if (response.success) {
        toast.success("Đã gửi lại email xác thực");
        fetchVerifications();
        fetchStats();
      }
    } catch (error) {
      toast.error("Lỗi khi gửi lại email");
      console.error(error);
    }
  };

  // Handle manual verify (admin can verify manually)
  const handleManualVerify = async (verification) => {
    if (
      !window.confirm(
        `Xác thực thủ công email ${verification.email} cho user này?`
      )
    )
      return;

    try {
      // Use the token to verify (admin action)
      const response = await emailVerificationService.verify(
        verification.token
      );
      if (response.success) {
        toast.success("Đã xác thực email thành công");
        fetchVerifications();
        fetchStats();
      }
    } catch (error) {
      toast.error("Lỗi khi xác thực email");
      console.error(error);
    }
  };

  // Get status info
  const getStatusInfo = (verification) => {
    const now = new Date();
    const expiresAt = new Date(verification.expiresAt);

    if (verification.verifiedAt) {
      return {
        label: "Đã xác thực",
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
      label: "Chờ xác thực",
      color: "text-yellow-600 bg-yellow-100",
      icon: <Clock className="w-4 h-4" />,
    };
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Xác Thực Email</h1>
            <p className="text-gray-500">Quản lý email verification tokens</p>
          </div>
        </div>
        <Button onClick={() => fetchVerifications()} disabled={loading}>
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
              <p className="text-gray-500 text-sm">Chờ xác thực</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Đã xác thực</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.verified}
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
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách Email Verifications</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác thực</option>
              <option value="verified">Đã xác thực</option>
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
          ) : verifications.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto text-gray-300" />
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
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hết hạn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ngày xác thực
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {verifications.map((verification) => {
                    const statusInfo = getStatusInfo(verification);
                    return (
                      <tr key={verification.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{verification.id}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {verification.email}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {verification.user?.email || "-"}
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
                          {formatDate(verification.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(verification.expiresAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {verification.verifiedAt
                            ? formatDate(verification.verifiedAt)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!verification.verifiedAt ? (
                            <div className="flex gap-2 justify-center">
                              {new Date(verification.expiresAt) > new Date() && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleResend(
                                      verification.userId,
                                      verification.email
                                    )
                                  }
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Gửi lại
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleManualVerify(verification)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Xác thực
                              </Button>
                            </div>
                          ) : (
                            <span className="text-green-600 text-sm">
                              ✓ Đã xác thực
                            </span>
                          )}
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

export default EmailVerificationPage;
