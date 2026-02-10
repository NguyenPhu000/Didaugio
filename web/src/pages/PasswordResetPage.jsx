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
              <h1 className="tim-title">RESET MẬT KHẨU</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1">
                  SYSTEM // PASSWORD RESET
                </span>
                <p className="tim-meta">QUẢN LÝ YÊU CẦU ĐẶT LẠI MẬT KHẨU</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => fetchResets()}
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
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-4xl font-black tracking-tighter">
              {stats.total}
            </div>
          </div>
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all border-l-4 border-l-[#F3E600]">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">CHỜ SỆ DỤNG</span>
              <Clock className="h-5 w-5 text-[#F3E600]" />
            </div>
            <div className="text-4xl font-black tracking-tighter text-[#F3E600]">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white border border-black p-6 shadow-sm hover:shadow-hard transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="tim-meta">ĐÃ SỆ DỤNG</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-4xl font-black tracking-tighter text-green-600">
              {stats.used}
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
              <option value="pending">CHỜ SỆ DỤNG</option>
              <option value="used">ĐÃ SỆ DỤNG</option>
              <option value="expired">HẾT HẠN</option>
            </select>
          </div>
        </div>
        {/* Data Table */}
        <div className="bg-white border border-black shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="font-mono text-xs uppercase text-gray-500">
                LOADING DATA...
              </span>
            </div>
          ) : resets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Key className="h-12 w-12 text-gray-300 mb-4" />
              <div className="font-bold uppercase text-gray-400">
                KHÔNG TÌM THẤY DỮ LIỆU
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black text-white tim-table-header">
                    <th className="p-4 border-r border-black/20 w-[60px]">
                      ID
                    </th>
                    <th className="p-4 border-r border-black/20">EMAIL</th>
                    <th className="p-4 border-r border-black/20">USER</th>
                    <th className="p-4 border-r border-black/20">IP ADDRESS</th>
                    <th className="p-4 border-r border-black/20">TRẠNG THÁI</th>
                    <th className="p-4 border-r border-black/20">NGÀY TẠO</th>
                    <th className="p-4 border-r border-black/20">HẾT HẠN</th>
                    <th className="p-4 border-r border-black/20">CÒN LẠI</th>
                    <th className="p-4">ĐÃ DÙNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {resets.map((reset) => {
                    const statusInfo = getStatusInfo(reset);
                    return (
                      <tr
                        key={reset.id}
                        className="hover:bg-yellow-50 group transition-colors"
                      >
                        <td className="p-4 font-mono text-sm text-gray-400 border-r border-black/5">
                          #{reset.id}
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <div className="font-mono text-sm font-medium">
                            {reset.email}
                          </div>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <div className="font-mono text-sm text-gray-600">
                            {reset.user?.email || "—"}
                          </div>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <div className="flex items-center gap-1 font-mono text-sm text-gray-600">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {reset.ipAddress}
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
                            {formatDate(reset.createdAt)}
                          </div>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          <div className="font-mono text-sm text-gray-500">
                            {formatDate(reset.expiresAt)}
                          </div>
                        </td>
                        <td className="p-4 border-r border-black/5">
                          {!reset.usedAt && (
                            <span
                              className={`font-mono text-sm font-bold ${new Date(reset.expiresAt) > new Date() ? "text-[#F3E600]" : "text-red-600"}`}
                            >
                              {getTimeRemaining(reset.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-sm text-gray-500">
                            {reset.usedAt ? formatDate(reset.usedAt) : "—"}
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
            <div className="flex items-center justify-between p-4 border-t border-black bg-gray-50 font-mono text-xs uppercase">
              <div>HIỂN THỊ {resets.length} KẾT QUẢ</div>
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

export default PasswordResetPage;
