import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, RefreshCw, ChevronDown } from "lucide-react";

export const CategoryHeaderFilters = memo(
  ({
    handleRefresh,
    handleAddRoot,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedRootFilter,
    setSelectedRootFilter,
    filterStatus,
    setFilterStatus,
    categoryTree,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="space-y-6">
        {/* Editorial Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-black/[0.04]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phân loại & Danh mục Địa điểm
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              {t("categories.title")}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t("categories.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              className="h-10 w-10 rounded-full bg-white text-slate-900 hover:bg-slate-50 shadow-sm border border-slate-200 transition-all flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
              title="Đồng bộ lại"
            >
              <RefreshCw
                className={`h-4 w-4 text-slate-800 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={handleAddRoot}
              className="flex-1 sm:flex-initial h-10 px-5 rounded-full bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-white" />
              <span>{t("categories.createRoot")}</span>
            </button>
          </div>
        </header>

        {/* Search & Filters */}
        <section className="bg-white rounded-2xl border border-black/[0.04] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t("categories.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F8F7F3] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all border border-transparent focus:border-[#F3E600]/50"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <select
                value={selectedRootFilter}
                onChange={(e) => setSelectedRootFilter(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-semibold text-slate-800 border border-black/[0.05] appearance-none focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="all">
                  {t("categories.filters.allCategories")}
                </option>
                {(categoryTree || []).map((root) => (
                  <option key={root.id} value={root.id}>
                    {root.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-44">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 pl-3 pr-8 bg-[#F8F7F3] rounded-xl text-xs font-semibold text-slate-800 border border-black/[0.05] appearance-none focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="all">
                  {t("categories.filters.allStatuses")}
                </option>
                <option value="active">{t("categories.filters.active")}</option>
                <option value="hidden">{t("categories.filters.hidden")}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </section>
      </div>
    );
  }
);

CategoryHeaderFilters.displayName = "CategoryHeaderFilters";
export default CategoryHeaderFilters;
