import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { UserCog } from "lucide-react";

export const UserBulkActionsBar = memo(
  ({ selectedCount, onOpenBulkRole, onClearSelection }) => {
    const { t } = useTranslation();
    if (selectedCount === 0) return null;

    return (
      <div className="bg-slate-950 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>
            {t("users.bulk.selected", {
              count: selectedCount,
              defaultValue: `Đã chọn ${selectedCount} người dùng`,
            })}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-950 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            onClick={onOpenBulkRole}
          >
            <UserCog className="h-3.5 w-3.5 text-slate-300" />
            {t("users.bulk.assignRole", "Gán vai trò")}
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            onClick={onClearSelection}
          >
            {t("users.bulk.clearSelection", "Bỏ chọn")}
          </button>
        </div>
      </div>
    );
  }
);

UserBulkActionsBar.displayName = "UserBulkActionsBar";
export default UserBulkActionsBar;
