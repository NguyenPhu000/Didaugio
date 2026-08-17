import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Grid as GridIcon, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const PlaceFilterBar = memo(
  ({
    localSearch,
    handleSearch,
    onSearchKey,
    handleClearSearch,
    filters,
    handleFilterChange,
    lockStatusFilter,
    categories,
    viewMode,
    setViewMode,
  }) => {
    const { t } = useTranslation();

    return (
      <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            placeholder={t("places.searchPlaceholder")}
            value={localSearch}
            onChange={handleSearch}
            onKeyDown={onSearchKey}
            className="w-full h-10 pl-10 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 text-xs font-bold"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns & View Mode */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-1 sm:flex-initial">
            <Select
              value={filters.status || "all"}
              onValueChange={(val) => handleFilterChange("status", val)}
              disabled={lockStatusFilter}
            >
              <SelectTrigger className="h-10 px-3 sm:px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full sm:w-[140px]">
                <SelectValue placeholder={t("places.statusFilters.placeholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">{t("places.statusFilters.all")}</SelectItem>
                <SelectItem value="pending">{t("places.statusFilters.pending")}</SelectItem>
                <SelectItem value="approved">{t("places.statusFilters.approved")}</SelectItem>
                <SelectItem value="draft">{t("places.statusFilters.draft")}</SelectItem>
                <SelectItem value="rejected">{t("places.statusFilters.rejected")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.categoryId || "all"}
              onValueChange={(val) => handleFilterChange("categoryId", val)}
            >
              <SelectTrigger className="h-10 px-3 sm:px-4 rounded-xl border border-black/[0.05] bg-[#F8F7F3] text-xs font-semibold text-slate-800 w-full sm:w-[160px]">
                <SelectValue placeholder={t("places.categoryFilter.placeholder")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/[0.06] shadow-md">
                <SelectItem value="all">{t("places.categoryFilter.all")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg text-xs transition-all",
                viewMode === "grid"
                  ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-950"
              )}
              title="Dạng lưới thẻ"
            >
              <GridIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg text-xs transition-all",
                viewMode === "list"
                  ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  : "text-slate-500 hover:text-slate-950"
              )}
              title="Dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    );
  }
);

PlaceFilterBar.displayName = "PlaceFilterBar";
export default PlaceFilterBar;
