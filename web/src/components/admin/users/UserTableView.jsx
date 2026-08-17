import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { UserX } from "lucide-react";
import { getTableSerialNumber } from "@/utils/tableSerial";
import UserRow from "./UserRow";

export const UserTableView = memo(
  ({
    loading,
    users,
    pagination,
    filters,
    selectedIds,
    handleSelectOne,
    handleSelectAll,
    handleDetail,
    handleEdit,
    handleChangePassword,
    handleToggleStatus,
    handleDelete,
    handlePageChange,
    SelectAllIcon,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
            <span className="text-xs font-semibold text-slate-500">
              {t("common.loading")}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] text-slate-500 font-semibold border-b border-black/[0.04]">
                  <th className="p-4 w-[40px]">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center justify-center text-slate-700 cursor-pointer"
                      aria-label="Chọn tất cả"
                    >
                      <SelectAllIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="p-4 w-[60px] hidden sm:table-cell">STT</th>
                  <th className="p-4">{t("users.table.basicInfo")}</th>
                  <th className="p-4 hidden md:table-cell">
                    {t("users.table.contact")}
                  </th>
                  <th className="p-4 whitespace-nowrap">
                    {t("users.table.role")}
                  </th>
                  <th className="p-4 whitespace-nowrap">
                    {t("users.table.connection", "Kết nối")}
                  </th>
                  <th className="p-4 whitespace-nowrap">
                    {t("users.table.account", "Tài khoản")}
                  </th>
                  <th className="p-4 text-right">
                    {t("users.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {users.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    serial={getTableSerialNumber(
                      pagination.total || users.length,
                      index,
                      filters.page,
                      filters.limit
                    )}
                    selected={selectedIds.has(user.id)}
                    onSelect={handleSelectOne}
                    onDetail={handleDetail}
                    onEdit={handleEdit}
                    onChangePassword={handleChangePassword}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                    t={t}
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-20 text-center">
                      <UserX className="h-12 w-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                      <div className="font-bold text-slate-800">
                        {t("common.noData")}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Không tìm thấy tài khoản nào khớp với bộ lọc.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-black/[0.04] bg-[#FAF9F5] text-xs">
            <div className="text-slate-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-slate-900 font-mono tabular-nums">
                {users.length}
              </span>{" "}
              /{" "}
              <span className="font-mono tabular-nums">
                {pagination.total}
              </span>{" "}
              người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page - 1)}
                className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900 cursor-pointer"
              >
                ← Trước
              </button>
              <span className="font-bold text-slate-950 px-2 font-mono tabular-nums">
                {filters.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
                className="rounded-full text-xs font-semibold h-8 px-3.5 bg-white border border-black/[0.05] shadow-2xs hover:bg-[#F5F4F0] disabled:opacity-40 transition-all flex items-center gap-1 text-slate-900 cursor-pointer"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

UserTableView.displayName = "UserTableView";
export default UserTableView;
