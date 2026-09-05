import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Eye, BarChart3, Filter, X } from "lucide-react";
import PlaceCard from "./PlaceCard";
import DistrictRow from "./DistrictRow";
import FilterPanel from "./FilterPanel";
import { DISTRICT_COLORS } from "@/modules/map";

export const MapSidebar = memo(
  ({
    sidebarOpen,
    places,
    filteredPlaces,
    districtList,
    panelTab,
    setPanelTab,
    hasActiveFilters,
    selectedDistrictId,
    selectedDistrict,
    displayPlaces,
    resetSelection,
    handlePlaceFly,
    handleDistrictClick,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedPrice,
    setSelectedPrice,
    onlyFeatured,
    setOnlyFeatured,
    resetFilters,
  }) => {
    const { t } = useTranslation();

    if (!sidebarOpen) return null;

    return (
      <div className="w-80 bg-white border-r border-black/[0.04] flex flex-col flex-shrink-0 overflow-hidden shadow-2xs">
        {/* Stat Tiles Strip */}
        <div className="grid grid-cols-3 border-b border-black/[0.04] bg-[#FAF9F5]">
          {[
            {
              label: t("admin.map.places"),
              value: places.length,
              icon: MapPin,
            },
            {
              label: t("admin.map.showing"),
              value: filteredPlaces.length,
              icon: Eye,
            },
            {
              label: t("admin.map.areas"),
              value: districtList.length,
              icon: BarChart3,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="py-3 text-center border-r border-black/[0.04] last:border-r-0"
            >
              <div className="text-base font-black text-slate-950 font-mono tabular-nums">
                {value}
              </div>
              <div className="text-[9px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Panel Tabs */}
        <div className="flex border-b border-black/[0.04] bg-[#F8F7F3] p-1 gap-1">
          {[
            { id: "places", label: t("admin.map.places"), icon: MapPin },
            { id: "districts", label: t("admin.map.districts"), icon: BarChart3 },
            { id: "filters", label: t("admin.map.filters"), icon: Filter },
          ].map(({ id, label, icon: _Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setPanelTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                panelTab === id
                  ? "bg-white text-slate-950 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <_Icon className="h-3 w-3" />
              {label}
              {id === "filters" && hasActiveFilters && (
                <span
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                  aria-label={t("admin.map.ariaLabels.filterActive")}
                />
              )}
            </button>
          ))}
        </div>

        {/* Places panel */}
        {panelTab === "places" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2 bg-[#FAF9F5] border-b border-black/[0.04] flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide truncate">
                {selectedDistrictId
                  ? selectedDistrict?.properties?.name
                  : t("admin.map.allPlaces")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 tabular-nums">
                  {displayPlaces.length}
                </span>
                {selectedDistrictId && (
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    aria-label={t("admin.map.deselectArea")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {displayPlaces.length === 0 ? (
                <div className="py-12 text-center">
                  <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs text-slate-400 font-medium">
                    {t("admin.map.noPlaces")}
                  </p>
                </div>
              ) : (
                displayPlaces.map((p) => (
                  <PlaceCard
                    key={p.id}
                    place={p}
                    onClick={handlePlaceFly}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Districts panel */}
        {panelTab === "districts" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2 bg-[#FAF9F5] border-b border-black/[0.04] flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                {districtList.length} {t("admin.map.districts")}
              </span>
              {selectedDistrictId && (
                <button
                  type="button"
                  onClick={resetSelection}
                  className="text-[10px] text-rose-500 font-bold flex items-center gap-1 hover:text-rose-700 cursor-pointer"
                >
                  <X className="h-3 w-3" /> {t("admin.map.deselect")}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {districtList.map((d) => (
                <DistrictRow
                  key={d.id}
                  name={d.name}
                  count={d.count}
                  total={filteredPlaces.length}
                  color={
                    DISTRICT_COLORS[d.colorIdx % DISTRICT_COLORS.length]?.line ||
                    "#6b7280"
                  }
                  active={selectedDistrictId === d.id}
                  onClick={() => handleDistrictClick(d)}
                />
              ))}
              <div className="mt-3 mx-4 mb-4 p-3 bg-[#FAF9F5] rounded-2xl border border-black/[0.04]">
                <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("admin.map.placeDistribution")}
                </p>
                {districtList
                  .filter((d) => d.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 mb-1.5"
                    >
                      <span className="text-xs font-semibold text-slate-700 w-24 truncate">
                        {d.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-[#F4F2EC] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${
                              filteredPlaces.length > 0
                                ? (d.count / filteredPlaces.length) * 100
                                : 0
                            }%`,
                            backgroundColor:
                              DISTRICT_COLORS[
                                d.colorIdx % DISTRICT_COLORS.length
                              ]?.line,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-4 text-right tabular-nums">
                        {d.count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters panel */}
        {panelTab === "filters" && (
          <FilterPanel
            categories={categories}
            places={places}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPrice={selectedPrice}
            setSelectedPrice={setSelectedPrice}
            onlyFeatured={onlyFeatured}
            setOnlyFeatured={setOnlyFeatured}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />
        )}
      </div>
    );
  }
);

MapSidebar.displayName = "MapSidebar";
export default MapSidebar;
