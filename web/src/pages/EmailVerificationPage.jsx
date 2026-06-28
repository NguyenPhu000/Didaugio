import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { emailVerificationService } from "@/apis";
import { formatDate } from "@/utils/dateUtils";
import { getTableSerialNumber } from "@/utils/tableSerial";

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
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
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
        setTotalItems(response.pagination?.total || response.data?.length || 0);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách xác thực email");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await emailVerificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, [fetchVerifications, fetchStats]);

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

  // Handle manual verify (Admin)
  const handleManualVerify = async (userId, email) => {
    if (
      !window.confirm(
        `Xác thực thủ công email ${email}?\n\nLưu ý: Chỉ sử dụng khi user không nhận được email hoặc token đã hết hạn.`,
      )
    )
      return;

    try {
      const response = await emailVerificationService.manualVerify(userId);
      if (response.success) {
        toast.success("Đã xác thực email thành công");
        fetchVerifications();
        fetchStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xác thực email");
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
              <h1 className="tim-title">XÁC THỰC EMAIL</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // EMAIL VERIFICATION
                </span>
                <p className="tim-meta">QUẢN LÝ XÁC THỰC EMAIL</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => fetchVerifications()}
            disabled={loading}
            variant="outline"
            className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">TỔNG SỐ</span>
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-4xl font-black tracking-tighter">
              {stats.total}
            </div>
          </div>
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all border-l-4 border-l-[#F3E600]">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">CHỜ XÁC THỰC</span>
              <Clock className="h-5 w-5 text-[#F3E600]" />
            </div>
            <div className="text-4xl font-black tracking-tighter text-[#F3E600]">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">ĐÃ XÁC THỰC</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-4xl font-black tracking-tighter text-green-600">
              {stats.verified}
            </div>
          </div>
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">HẾT HẠN</span>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-4xl font-black tracking-tighter text-red-600">
              {stats.expired}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-black p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="tim-meta">BỘ LỌC DỮ LIỆU</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50"
            >
              <option value="all">TẤT CẢ TRẠNG THÁI</option>
              <option value="pending">CHỜ XÁC THỰC</option>
              <option value="verified">ĐÃ XÁC THỰC</option>
              <option value="expired">HẾT HẠN</option>
            </select>
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

            if (verifications.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20">
                  <Mail className="h-12 w-12 text-gray-300 mb-4" />
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
                        STT
                      </th>
                      <th className="p-4 border-r border-black/20">EMAIL</th>
                      <th className="p-4 border-r border-black/20">USER</th>
                      <th className="p-4 border-r border-black/20">
                        TRẠNG THÁI
                      </th>
                      <th className="p-4 border-r border-black/20">NGÀY TẠO</th>
                      <th className="p-4 border-r border-black/20">HẾT HẠN</th>
                      <th className="p-4 border-r border-black/20">
                        NGÀY XÁC THỰC
                      </th>
                      <th className="p-4 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {verifications.map((verification, index) => {
                      const statusInfo = getStatusInfo(verification);
                      return (
                        <tr
                          key={verification.id}
                          className="hover:bg-yellow-50 group transition-colors"
                        >
                          <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                            {getTableSerialNumber(
                              totalItems || verifications.length,
                              index,
                              currentPage,
                              itemsPerPage,
                            )}
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div className="font-mono text-sm font-medium">
                              {verification.email}
                            </div>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div className="font-mono text-sm text-gray-600">
                              {verification.user?.email || "—"}
                            </div>
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
                            <div className="font-mono text-sm text-gray-500">
                              {formatDate(verification.createdAt)}
                            </div>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div className="font-mono text-sm text-gray-500">
                              {formatDate(verification.expiresAt)}
                            </div>
                          </td>
                          <td className="p-4 border-r border-black/5">
                            <div className="font-mono text-sm text-gray-500">
                              {verification.verifiedAt
                                ? formatDate(verification.verifiedAt)
                                : "—"}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {!verification.verifiedAt ? (
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleResend(
                                      verification.userId,
                                      verification.email,
                                    )
                                  }
                                  className="rounded-none border border-black hover:bg-black hover:text-white uppercase text-[10px] font-bold h-8"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  GỬI
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleManualVerify(
                                      verification.userId,
                                      verification.email,
                                    )
                                  }
                                  className="rounded-none bg-[#F3E600] hover:bg-black text-black hover:text-white border border-black uppercase text-[10px] font-bold h-8"
                                >
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  XÁC THỰC
                                </Button>
                              </div>
                            ) : (
                              <span className="text-green-600 text-xs uppercase font-mono font-bold">
                                ✓ ĐÃ XÁC THỰC
                              </span>
                            )}
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
              <div>HIỂN THỊ {verifications.length} KẾT QUẢ</div>
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
      </div>
    </div>
  );
};

export default EmailVerificationPage;
