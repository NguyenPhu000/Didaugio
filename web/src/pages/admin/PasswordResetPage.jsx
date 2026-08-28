import { useState, useEffect, useCallback } from "react";
import {
  Key,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
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
import { passwordResetService } from "@/apis";
import { formatDate } from "@/utils/dateUtils";
import { getTableSerialNumber } from "@/utils/tableSerial";

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
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Fetch resets
  const fetchResets = useCallback(async () => {
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
        setTotalItems(response.pagination?.total || response.data?.length || 0);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách reset mật khẩu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await passwordResetService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchResets();
    fetchStats();
  }, [fetchResets, fetchStats]);

  // Get status info
  const getStatusInfo = (reset) => {
    const now = new Date();
    const expiresAt = new Date(reset.expiresAt);

    if (reset.usedAt) {
      return {
        label: "Đã sử dụng",
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
      label: "Chờ sử dụng",
      color: "text-amber-700 bg-amber-50 border border-amber-200",
      icon: <Clock className="w-3.5 h-3.5" />,
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
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bảo mật & Quản lý Xác thực
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Reset Mật khẩu
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Quản lý và giám sát các yêu cầu đặt lại mật khẩu của người dùng hệ thống.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => fetchResets()}
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
          icon={Key}
        />
        <TimStatsCard
          title="CHỜ SỬ DỤNG"
          value={stats.pending}
          icon={Clock}
          textColor="text-amber-600"
        />
        <TimStatsCard
          title="ĐÃ SỬ DỤNG"
          value={stats.used}
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
          <option value="pending">Chờ sử dụng</option>
          <option value="used">Đã sử dụng</option>
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

          if (resets.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Key className="h-12 w-12 text-slate-300 mb-4" />
                <div className="font-semibold text-slate-500 text-sm">
                  Không tìm thấy yêu cầu đặt lại mật khẩu nào
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
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4">Hết hạn</th>
                    <th className="p-4">Còn lại</th>
                    <th className="p-4">Đã dùng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {resets.map((reset, index) => {
                    const statusInfo = getStatusInfo(reset);
                    return (
                      <tr
                        key={reset.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-4 font-mono text-slate-400">
                          {getTableSerialNumber(
                            totalItems || resets.length,
                            index,
                            currentPage,
                            itemsPerPage,
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">
                            {reset.email}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-600">
                            {reset.user?.email || "—"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-slate-600 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {reset.ipAddress}
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
                          {formatDate(reset.createdAt)}
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {formatDate(reset.expiresAt)}
                        </td>
                        <td className="p-4">
                          {!reset.usedAt && (
                            <span
                              className={`text-xs font-semibold ${new Date(reset.expiresAt) > new Date() ? "text-amber-600" : "text-rose-600"}`}
                            >
                              {getTimeRemaining(reset.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {reset.usedAt ? formatDate(reset.usedAt) : "—"}
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
            <div>Hiển thị {resets.length} kết quả</div>
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

export default PasswordResetPage;
