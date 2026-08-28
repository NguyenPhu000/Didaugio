import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, ShieldAlert } from "lucide-react";

export const LoginHistoryFilterBar = memo(
  ({
    hasActiveFilters,
    clearFilters,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    handleRevokeAllOther,
    isRevokingAll,
    setCurrentPage,
  }) => {
    const { t } = useTranslation();

    return (
      <section className="bg-white rounded-2xl border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("common.filter") || "BỘ LỌC DỮ LIỆU"}
          </span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                {t("auditLogs.clearFilters") || "Xóa bộ lọc"}
              </button>
            )}
            {handleRevokeAllOther && (
              <button
                type="button"
                onClick={handleRevokeAllOther}
                disabled={isRevokingAll}
                className="px-3 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Đăng xuất khỏi tất cả các thiết bị khác trừ phiên hiện tại"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isRevokingAll ? "Đang xử lý..." : "Đăng xuất thiết bị khác"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("loginHistory.status") || "Trạng thái phiên"}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
            >
              <option value="all">{t("common.all") || "Tất cả trạng thái"}</option>
              <option value="active">{t("loginHistory.active") || "Đang hoạt động"}</option>
              <option value="inactive">{t("loginHistory.inactive") || "Đã thu hồi / Hết hạn"}</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1 sm:col-span-1 lg:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500">
              {t("common.search") || "Tìm kiếm theo Người dùng / Email / IP / Thiết bị"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nhập tên người dùng, email, địa chỉ IP hoặc thiết bị..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>
    );
  }
);

LoginHistoryFilterBar.displayName = "LoginHistoryFilterBar";
export default LoginHistoryFilterBar;
