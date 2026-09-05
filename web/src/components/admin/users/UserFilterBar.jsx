import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const UserFilterBar = memo(
  ({ filters, handleFilterChange, roleOptions }) => {
    const { t } = useTranslation();

    return (
      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t("users.searchPlaceholder")}
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400 transition-all border border-slate-200 focus:border-slate-400"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto">
          <Select
            value={filters.roleId.toString()}
            onValueChange={(val) => handleFilterChange("roleId", val)}
          >
            <SelectTrigger className="h-10 px-3 sm:px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full sm:w-[150px]">
              <SelectValue placeholder={t("users.table.role")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(val) => handleFilterChange("status", val)}
          >
            <SelectTrigger className="h-10 px-3 sm:px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full sm:w-[140px]">
              <SelectValue placeholder={t("users.table.account", "Tài khoản")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("users.status.active")}</SelectItem>
              <SelectItem value="inactive">{t("users.status.locked")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
    );
  }
);

UserFilterBar.displayName = "UserFilterBar";
export default UserFilterBar;
