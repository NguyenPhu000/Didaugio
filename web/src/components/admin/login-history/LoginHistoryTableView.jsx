import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Eye, Ban } from "lucide-react";
import { formatDateTime } from "@/utils/dateUtils";
import { getTableSerialNumber } from "@/utils/tableSerial";
import {
  getStatusInfo,
  getDeviceIcon,
  truncateDevice,
} from "./loginHistoryConstants";

export const LoginHistoryTableView = memo(
  ({
    loading,
    sessions,
    totalItems,
    currentPage,
    itemsPerPage,
    totalPages,
    setCurrentPage,
    hasActiveFilters,
    clearFilters,
    handleViewDetail,
    handleRevoke,
  }) => {
    const { t } = useTranslation();

    if (loading) {
      return (
        <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-slate-950 border-t-slate-300 rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500">
              {t("loginHistory.loadingData") || "Đang tải lịch sử đăng nhập..."}
            </span>
          </div>
        </section>
      );
    }

    if (sessions.length === 0) {
      return (
        <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="py-20 text-center text-slate-400 p-6">
            <Monitor className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
            <p className="font-bold text-slate-800 text-sm">
              {t("loginHistory.noData") || "Không tìm thấy phiên đăng nhập nào"}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-[#F8F7F3] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              >
                {t("auditLogs.clearFilters") || "Xóa bộ lọc"}
              </button>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-black/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4 w-[60px] hidden sm:table-cell">STT</th>
                <th className="p-4 min-w-[200px]">{t("loginHistory.user") || "Người dùng"}</th>
                <th className="p-4 min-w-[180px]">{t("loginHistory.device") || "Thiết bị"}</th>
                <th className="p-4 w-[130px] hidden lg:table-cell">IP Address</th>
                <th className="p-4 w-[130px]">{t("loginHistory.status") || "Trạng thái"}</th>
                <th className="p-4 w-[150px] hidden md:table-cell">{t("loginHistory.loggedIn") || "Đăng nhập lúc"}</th>
                <th className="p-4 w-[150px] hidden xl:table-cell">{t("loginHistory.lastUsed") || "Sử dụng gần nhất"}</th>
                <th className="p-4 text-center w-[100px]">{t("common.actions") || "Thao tác"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {sessions.map((session, index) => {
                const statusInfo = getStatusInfo(session, t);
                const userFullName = session.user?.profile?.fullName || session.user?.email || "N/A";
                const userEmail = session.user?.email || "N/A";
                const initials = userFullName.substring(0, 2).toUpperCase();

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-[#FAF9F5] group transition-colors"
                  >
                    <td className="p-4 font-mono text-xs text-slate-400 hidden sm:table-cell tabular-nums">
                      #{getTableSerialNumber(
                        totalItems || sessions.length,
                        index,
                        currentPage,
                        itemsPerPage
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {userFullName}
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono truncate">
                            {userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.deviceName)}
                        <span className="text-xs font-medium text-slate-800 truncate max-w-[220px]" title={session.deviceName}>
                          {truncateDevice(session.deviceName)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="font-mono text-xs text-slate-600 tabular-nums">
                        {session.ipAddress || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatDateTime(session.createdAt)}
                      </span>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {formatDateTime(session.lastUsedAt)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(session)}
                          className="h-8 w-8 rounded-full bg-[#F8F7F3] hover:bg-slate-950 hover:text-white text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                          title={t("loginHistory.viewDetail") || "Xem chi tiết"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {session.isActive && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(session.id)}
                            className="h-8 w-8 rounded-full bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                            title={t("loginHistory.deactivateSession") || "Thu hồi phiên"}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs">
            <span className="font-mono text-slate-500 tabular-nums">
              {t("auditLogs.page", {
                page: currentPage,
                totalPages,
                count: sessions.length,
              }) || `Trang ${currentPage} / ${totalPages} (${totalItems || sessions.length} kết quả)`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                {t("common.previous") || "Trước"}
              </button>
              <span className="px-3 font-mono font-bold text-slate-950 tabular-nums">
                {currentPage}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-3 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-semibold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                {t("common.nextPage") || "Sau"}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-lg border border-black/[0.05] bg-white text-slate-700 disabled:opacity-40 text-xs font-mono font-bold hover:bg-[#F4F2EC] transition-all cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }
);

LoginHistoryTableView.displayName = "LoginHistoryTableView";
export default LoginHistoryTableView;
