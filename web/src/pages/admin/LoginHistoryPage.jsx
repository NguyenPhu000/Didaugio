// MAP: LoginHistoryPage
// ├── UI: @/components/admin/login-history/{LoginHistoryFilterBar, LoginHistoryTableView, LoginHistoryDetailModal}
// └── API: @/apis/loginHistoryService

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  RefreshCw,
  CheckCircle,
  XCircle,
  Ban,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  exportToCsv,
  fetchAllPages,
  formatCsvDate,
  slugifyFilename,
} from "@/utils/csvExport";
import { loginHistoryService } from "@/apis";
import { useAuthStore } from "@/stores/authStore";
import TimStatsCard from "@/components/admin/TimStatsCard";

// Extracted Sub-Components
import LoginHistoryFilterBar from "@/components/admin/login-history/LoginHistoryFilterBar";
import LoginHistoryTableView from "@/components/admin/login-history/LoginHistoryTableView";
import LoginHistoryDetailModal from "@/components/admin/login-history/LoginHistoryDetailModal";

/** Chuyển statusFilter UI sang giá trị API: undefined | true | false */
const resolveStatusFilter = (filter) =>
  filter === "all" ? undefined : filter === "active";

const LoginHistoryPage = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        isActive: resolveStatusFilter(statusFilter),
        search: searchQuery.trim() || undefined,
      };
      const response = await loginHistoryService.getAll(params);
      if (response.success) {
        setSessions(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || response.data?.length || 0);
      }
    } catch (error) {
      toast.error(t("loginHistory.loadingError") || "Lỗi tải lịch sử đăng nhập");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, searchQuery, t]);

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
      } else {
        setSelectedSession(session);
        setShowDetailModal(true);
      }
    } catch {
      setSelectedSession(session);
      setShowDetailModal(true);
    }
  };

  // Revoke single session
  const handleRevoke = async (sessionId) => {
    try {
      const response = await loginHistoryService.revoke(sessionId);
      if (response.success) {
        toast.success(
          t("loginHistory.revokeSuccess") || "Đã thu hồi phiên đăng nhập thành công"
        );
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error(
        t("loginHistory.revokeError") || "Không thể thu hồi phiên đăng nhập"
      );
      console.error(error);
    }
  };

  // Revoke all other sessions for current user
  const handleRevokeAllOther = async () => {
    if (!currentUser?.id) return;
    if (
      !window.confirm(
        "Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác không?"
      )
    ) {
      return;
    }

    try {
      setIsRevokingAll(true);
      const currentSessionId = loginHistoryService.getCurrentSessionId();
      const response = await loginHistoryService.revokeAll(
        currentUser.id,
        currentSessionId
      );
      if (response.success) {
        toast.success(
          "Đã đăng xuất khỏi tất cả các thiết bị khác thành công"
        );
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error("Không thể đăng xuất các thiết bị khác");
      console.error(error);
    } finally {
      setIsRevokingAll(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      toast.loading("Đang chuẩn bị dữ liệu xuất CSV...", { id: "csv-export" });

      const allData = await fetchAllPages(async (page) => {
        const res = await loginHistoryService.getAll({
          page,
          limit: 100,
          isActive: resolveStatusFilter(statusFilter),
          search: searchQuery.trim() || undefined,
        });
        return {
          data: res.data || [],
          pagination: res.pagination,
        };
      }, 100);

      if (!allData || allData.length === 0) {
        toast.error("Không có dữ liệu để xuất CSV", { id: "csv-export" });
        return;
      }

      exportToCsv({
        columns: [
          { key: "id", label: "Session ID" },
          {
            key: (row) =>
              row.user?.profile?.fullName || row.user?.email || "N/A",
            label: "Người dùng",
          },
          { key: (row) => row.user?.email || "N/A", label: "Email" },
          { key: (row) => row.deviceName || "N/A", label: "Thiết bị" },
          { key: (row) => row.ipAddress || "N/A", label: "IP Address" },
          {
            key: (row) =>
              row.status === "active" || row.isActive
                ? "Đang hoạt động"
                : "Đã thu hồi / Hết hạn",
            label: "Trạng thái",
          },
          {
            key: (row) => formatCsvDate(row.createdAt),
            label: "Thời gian đăng nhập",
          },
          {
            key: (row) => formatCsvDate(row.lastUsedAt),
            label: "Sử dụng gần nhất",
          },
          {
            key: (row) => formatCsvDate(row.expiresAt),
            label: "Thời điểm hết hạn",
          },
        ],
        data: allData,
        filename: slugifyFilename("lich_su_dang_nhap"),
      });

      toast.success(`Đã xuất thành công ${allData.length} dòng dữ liệu`, {
        id: "csv-export",
      });
    } catch {
      toast.error("Xuất CSV thất bại", { id: "csv-export" });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || searchQuery.trim() !== "";

  return (
    <div className="space-y-6 text-slate-900 antialiased max-w-[1560px] mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.04]">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nhật ký Đăng nhập Hệ thống
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Lịch sử Đăng nhập
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Theo dõi tất cả các phiên đăng nhập, thiết bị, địa chỉ IP và trạng thái phiên làm việc
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial justify-center h-10 px-4 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] font-mono text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>CSV EXPORT</span>
          </button>
          <button
            type="button"
            onClick={() => {
              fetchSessions();
              fetchStats();
            }}
            disabled={loading}
            className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-[#F4F2EC] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.04] transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 text-slate-800 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimStatsCard
          title="TỔNG SỐ PHIÊN"
          value={stats.total}
          icon={Monitor}
        />
        <TimStatsCard
          title="ĐANG HOẠT ĐỘNG"
          value={stats.active}
          icon={CheckCircle}
          textColor="text-emerald-600"
        />
        <TimStatsCard
          title="ĐÃ THU HỒI"
          value={stats.revoked}
          icon={Ban}
          textColor="text-slate-500"
        />
        <TimStatsCard
          title="HẾT HẠN"
          value={stats.expired}
          icon={XCircle}
          textColor="text-rose-600"
        />
      </section>

      {/* Filter Bar */}
      <LoginHistoryFilterBar
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleRevokeAllOther={handleRevokeAllOther}
        isRevokingAll={isRevokingAll}
        setCurrentPage={setCurrentPage}
      />

      {/* Table View */}
      <LoginHistoryTableView
        loading={loading}
        sessions={sessions}
        totalItems={totalItems}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        handleViewDetail={handleViewDetail}
        handleRevoke={handleRevoke}
      />

      {/* Detail Modal */}
      <LoginHistoryDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        selectedSession={selectedSession}
        handleRevoke={handleRevoke}
      />
    </div>
  );
};

export default LoginHistoryPage;
