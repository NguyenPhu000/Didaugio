// MAP: LoginHistoryPage
// ├── UI: @/components/admin/login-history/{LoginHistoryTableView, LoginHistoryDetailModal}
// └── API: @/apis/loginHistoryService

import { useState, useEffect, useCallback } from "react";
import {
  Monitor,
  RefreshCw,
  Ban,
  CheckCircle,
  XCircle,
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
import { Button } from "@/components/ui";
import { loginHistoryService } from "@/apis";
import { useAuthStore } from "@/stores/authStore";
import TimStatsCard from "@/components/admin/TimStatsCard";

// Extracted Sub-Components
import LoginHistoryTableView from "@/components/admin/login-history/LoginHistoryTableView";
import LoginHistoryDetailModal from "@/components/admin/login-history/LoginHistoryDetailModal";

const LoginHistoryPage = () => {
  const { t } = useTranslation();
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
  const [totalItems, setTotalItems] = useState(0);
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
        setTotalItems(response.pagination?.total || response.data?.length || 0);
      }
    } catch (error) {
      toast.error(t("loginHistory.loadingError"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, t]);

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
      toast.error(t("loginHistory.detailError"));
      console.error(error);
    }
  };

  // Revoke session
  const handleRevoke = async (sessionId) => {
    if (!window.confirm(t("loginHistory.confirmRevoke"))) return;

    try {
      const response = await loginHistoryService.revoke(sessionId);
      if (response.success) {
        toast.success(t("loginHistory.sessionDeactivated"));
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error(t("loginHistory.revokeError"));
      console.error(error);
    }
  };

  // Revoke all except current
  const handleRevokeAll = async (userId) => {
    if (!window.confirm(t("loginHistory.confirmRevokeAll"))) return;

    try {
      const currentSessionId = loginHistoryService.getCurrentSessionId();
      const response = await loginHistoryService.revokeAll(
        userId,
        currentSessionId
      );
      if (response.success) {
        toast.success(response.message || t("loginHistory.loggedOutAll"));
        fetchSessions();
        fetchStats();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || t("loginHistory.logoutAllError")
      );
      console.error(error);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      toast.loading(t("loginHistory.exporting"), { id: "csv-export" });
      const allData = await fetchAllPages(loginHistoryService.getAll, {
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
      });

      const getStatusLabel = (s) => {
        const status = s.status || "active";
        if (status === "revoked" || !s.isActive)
          return t("loginHistory.revoked");
        if (status === "expired") return t("loginHistory.expired");
        return t("loginHistory.active");
      };

      exportToCsv({
        columns: [
          { key: "id", label: "ID" },
          {
            key: (row) => row.user?.profile?.fullName || "N/A",
            label: t("loginHistory.user"),
          },
          { key: (row) => row.user?.email || "", label: "Email" },
          { key: "deviceName", label: t("loginHistory.device") },
          { key: "ipAddress", label: "IP" },
          { key: getStatusLabel, label: t("loginHistory.status") },
          {
            key: (row) => formatCsvDate(row.createdAt),
            label: t("loginHistory.loggedIn"),
          },
          {
            key: (row) => formatCsvDate(row.lastUsedAt),
            label: t("loginHistory.lastUsed"),
          },
          {
            key: (row) => formatCsvDate(row.expiresAt),
            label: t("loginHistory.expiresAt"),
          },
        ],
        data: allData,
        filename: slugifyFilename("lich_su_dang_nhap"),
      });

      toast.success(
        t("loginHistory.exportSuccess", { count: allData.length }),
        { id: "csv-export" }
      );
    } catch {
      toast.error(t("loginHistory.exportError"), { id: "csv-export" });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-transparent relative font-sans">
      {/* Enhanced grid background with dots */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-6 gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="accent-bar h-16 shrink-0" />
            <div>
              <h1 className="tim-title">{t("loginHistory.title")}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="tim-system bg-black text-white px-2 py-1 shrink-0">
                  {t("loginHistory.system")}
                </span>
                <p className="tim-meta">{t("loginHistory.subtitle")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={handleExportCsv}
              variant="outline"
              className="flex-1 sm:flex-initial justify-center h-12 rounded-none border border-black hover:bg-black hover:text-white px-4 font-mono text-xs uppercase font-bold cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={() => fetchSessions()}
              disabled={loading}
              variant="outline"
              className="h-12 w-12 rounded-none border border-black hover:bg-black hover:text-white cursor-pointer shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TimStatsCard
            title={t("loginHistory.totalSessions")}
            value={stats.total}
            icon={Monitor}
            serial="LGN-001"
          />
          <TimStatsCard
            title={t("loginHistory.active")}
            value={stats.active}
            icon={CheckCircle}
            serial="LGN-002"
            textColor="text-emerald-600"
          />
          <TimStatsCard
            title={t("loginHistory.revoked")}
            value={stats.revoked}
            icon={Ban}
            serial="LGN-003"
            textColor="text-gray-500"
          />
          <TimStatsCard
            title={t("loginHistory.expired")}
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
            <span className="tim-meta">{t("common.filter").toUpperCase()}</span>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-4 border border-black rounded-none bg-white tim-body uppercase focus:outline-none focus:bg-yellow-50 cursor-pointer"
              >
                <option value="all">{t("loginHistory.allStatuses")}</option>
                <option value="active">{t("loginHistory.activeStatus")}</option>
                <option value="inactive">
                  {t("loginHistory.inactiveStatus")}
                </option>
              </select>
              {currentUser && (
                <Button
                  variant="outline"
                  onClick={() => handleRevokeAll(currentUser.id)}
                  className="h-10 rounded-none border border-black hover:bg-black hover:text-white uppercase text-xs font-bold cursor-pointer"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t("loginHistory.logoutAll")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <LoginHistoryTableView
          loading={loading}
          sessions={sessions}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
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
    </div>
  );
};

export default LoginHistoryPage;
