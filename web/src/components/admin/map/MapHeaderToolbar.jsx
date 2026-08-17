import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  MapIcon,
  Search,
  X,
  RefreshCw,
  Route,
  List,
  Layers,
  Minimize2,
  Maximize2,
} from "lucide-react";

export const MapHeaderToolbar = memo(
  ({
    districtCount,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    resetFilters,
    routingMode,
    setRoutingMode,
    viewMode,
    setViewMode,
    sidebarOpen,
    setSidebarOpen,
    fullscreen,
    toggleFullscreen,
  }) => {
    const { t } = useTranslation();

    return (
      <div className="min-h-14 py-2.5 sm:py-0 sm:h-14 bg-[#FAF9F5] border-b border-black/[0.04] flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-5 gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 bg-slate-950 text-[#F3E600] flex items-center justify-center rounded-xl shadow-2xs shrink-0">
            <MapIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-tight text-slate-950">
              {t("admin.map.title")}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#F3E600] rounded-full shadow-[0_0_6px_#F3E600]" />
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                {t("admin.map.cityDistricts", { count: districtCount || 9 })}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full sm:flex-1 sm:max-w-md order-3 sm:order-2 sm:mx-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("admin.map.searchPlaceholder")}
              className="w-full h-9 pl-9 pr-8 bg-white rounded-xl text-xs font-medium text-slate-900 border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#F3E600] placeholder:text-slate-400 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label={t("admin.map.ariaLabels.clearSearch")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 order-2 sm:order-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors mr-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> {t("admin.map.clearFilters")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRoutingMode((v) => !v)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
              routingMode
                ? "bg-slate-950 text-[#F3E600]"
                : "bg-white border border-black/[0.05] text-slate-700 hover:bg-[#F4F2EC]"
            }`}
            title={t("admin.map.routing")}
            aria-label={t("admin.map.ariaLabels.routingMode")}
          >
            <Route className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
              viewMode === "list"
                ? "bg-slate-950 text-white"
                : "bg-white border border-black/[0.05] text-slate-700 hover:bg-[#F4F2EC]"
            }`}
            aria-label={
              viewMode === "map"
                ? t("admin.map.ariaLabels.toList")
                : t("admin.map.ariaLabels.toMap")
            }
          >
            {viewMode === "map" ? (
              <List className="h-3.5 w-3.5" />
            ) : (
              <MapIcon className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
              sidebarOpen
                ? "bg-slate-950 text-white"
                : "bg-white border border-black/[0.05] text-slate-700 hover:bg-[#F4F2EC]"
            }`}
            aria-label={t("admin.map.ariaLabels.toggleSidebar")}
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full bg-white border border-black/[0.05] text-slate-700 flex items-center justify-center hover:bg-[#F4F2EC] transition-all shadow-2xs cursor-pointer"
            aria-label={
              fullscreen
                ? t("admin.map.ariaLabels.exitFullscreen")
                : t("admin.map.ariaLabels.enterFullscreen")
            }
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

MapHeaderToolbar.displayName = "MapHeaderToolbar";
export default MapHeaderToolbar;
