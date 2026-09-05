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
import TimStatsCard from "@/components/admin/TimStatsCard";
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
        color: "text-emerald-700 bg-emerald-50 border border-emerald-200",
        icon: <CheckCircle className="w-3.5 h-3.5" />,
      };
    }
    if (expiresAt < now) {
      return {
        label: "Hết hạn",
        color: "text-rose-700 bg-rose-50 border border-rose-200",
        icon: <XCircle className="w-3.5 h-3.5" />,
      };
    }
    return {
      label: "Chờ xác thực",
      color: "text-amber-700 bg-amber-50 border border-amber-200",
      icon: <Clock className="w-3.5 h-3.5" />,
    };
  };

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bảo mật & Quản lý Xác thực
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Xác thực Email
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Theo dõi và quản lý trạng thái kích hoạt tài khoản người dùng qua email.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => fetchVerifications()}
            disabled={loading}
            variant="outline"
            className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 text-slate-700 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimStatsCard
          title="TỔNG SỐ"
          value={stats.total}
          icon={Mail}
        />
        <TimStatsCard
          title="CHỜ XÁC THỰC"
          value={stats.pending}
          icon={Clock}
          textColor="text-amber-600"
        />
        <TimStatsCard
          title="ĐÃ XÁC THỰC"
          value={stats.verified}
          icon={CheckCircle}
          textColor="text-emerald-600"
        />
        <TimStatsCard
          title="HẾT HẠN"
          value={stats.expired}
          icon={XCircle}
          textColor="text-rose-600"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Bộ lọc dữ liệu
        </span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto h-10 px-4 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác thực</option>
          <option value="verified">Đã xác thực</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {(() => {
          if (loading) {
            return (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-2"></div>
                <span className="text-xs font-semibold text-slate-500">
                  Đang tải dữ liệu...
                </span>
              </div>
            );
          }

          if (verifications.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Mail className="h-12 w-12 text-slate-300 mb-4" />
                <div className="font-semibold text-slate-500 text-sm">
                  Không tìm thấy dữ liệu xác thực nào
                </div>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                    <th className="p-4 w-[50px]">STT</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Tài khoản</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4">Hết hạn</th>
                    <th className="p-4">Ngày xác thực</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {verifications.map((verification, index) => {
                    const statusInfo = getStatusInfo(verification);
                    return (
                      <tr
                        key={verification.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-4 font-mono text-slate-400">
                          {getTableSerialNumber(
                            totalItems || verifications.length,
                            index,
                            currentPage,
                            itemsPerPage,
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">
                            {verification.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-600">
                            {verification.user?.email || "—"}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {formatDate(verification.createdAt)}
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {formatDate(verification.expiresAt)}
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {verification.verifiedAt
                            ? formatDate(verification.verifiedAt)
                            : "—"}
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
                                className="rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold h-8 px-3"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Gửi lại
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleManualVerify(
                                    verification.userId,
                                    verification.email,
                                  )
                                }
                                className="rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold h-8 px-3"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Xác thực
                              </Button>
                            </div>
                          ) : (
                            <span className="text-emerald-600 text-xs font-semibold">
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
          );
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs font-medium text-slate-600">
            <div>Hiển thị {verifications.length} kết quả</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border-slate-200 h-8"
              >
                Trước
              </Button>
              <span className="flex items-center px-3 font-semibold text-slate-900">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-xl border-slate-200 h-8"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
