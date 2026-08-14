import { useState, useEffect, useMemo, useCallback, useDeferredValue, lazy, Suspense, useRef } from "react";
import { useTranslation } from "react-i18next";
import turfCentroid from "@turf/centroid";
import { usePlaces } from "@/hooks/queries/usePlaceQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import {
  MapProvider,
  useMapContext,
  useMapData,
  BoundaryLayer,
  PlaceMarkers,
  MapControls,
  MapBase,
  DISTRICT_COLORS,
} from "@/modules/map";
import DistrictLabels from "@/modules/map/components/DistrictLabels";
import WardLabels from "@/modules/map/components/WardLabels";
import {
  Search,
  MapIcon,
  List,
  MapPin,
  X,
  Maximize2,
  Minimize2,
  Eye,
  BarChart3,
  Filter,
  RefreshCw,
  Layers,
  AlertTriangle,
  Route,
  Navigation2,
  Flag,
} from "lucide-react";
import PlaceCard from "@/components/admin/map/PlaceCard";
import DistrictRow from "@/components/admin/map/DistrictRow";
import FilterPanel from "@/components/admin/map/FilterPanel";
import MapListView from "@/components/admin/map/MapListView";

const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);

const FETCH_LIMIT = 500;

const MapPageContent = () => {
  const { t } = useTranslation();
  const {
    flyTo,
    selectArea,
    selectedDistrict,
    resetSelection,
    setFilteredPlaces,
    setOnSelectPlace,
    routingMode,
    setRoutingMode,
    routing,
  } = useMapContext();
  const { districts, wards, canThoMask, loading, error, retry } = useMapData();
  const { data: placesRes } = usePlaces({ limit: FETCH_LIMIT, status: "approved" });
  const places = placesRes?.data || placesRes || [];
  const { data: categories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [viewMode, setViewMode] = useState("map");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelTab, setPanelTab] = useState("places");
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setOnSelectPlace((place) => {
      setSelectedPlaceDetail(place);
      setIsDetailOpen(true);
    });
    return () => setOnSelectPlace(null);
  }, [setOnSelectPlace]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const districtCentroids = useMemo(() => {
    if (!districts?.features) return {};
    const map = {};
    districts.features.forEach((f) => {
      try {
        if (f.geometry?.type === "Point") {
          map[f.properties.id] = {
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          };
        } else if (f.geometry) {
          const c = turfCentroid(f);
          map[f.properties.id] = {
            lat: c.geometry.coordinates[1],
            lng: c.geometry.coordinates[0],
          };
        }
      } catch {
        // Ignore malformed GeoJSON features.
      }
    });
    return map;
  }, [districts]);

  const deferredSearch = useDeferredValue(searchQuery);

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== "all")
      result = result.filter(
        (p) => p.categoryId?.toString() === selectedCategory,
      );
    if (selectedPrice !== "all")
      result = result.filter((p) => p.priceRange === selectedPrice);
    if (onlyFeatured) result = result.filter((p) => p.isFeatured);
    return result;
  }, [places, deferredSearch, selectedCategory, selectedPrice, onlyFeatured]);

  useEffect(() => {
    setFilteredPlaces(filteredPlaces);
  }, [filteredPlaces, setFilteredPlaces]);

  const districtList = useMemo(() => {
    if (!districts?.features) return [];
    return districts.features
      .sort((a, b) => a.properties.id - b.properties.id)
      .map((f, idx) => ({
        id: f.properties.id,
        name: f.properties.name,
        feature: f,
        count: filteredPlaces.filter((p) => p.districtId === f.properties.id)
          .length,
        colorIdx: idx,
      }));
  }, [districts, filteredPlaces]);

  const selectedDistrictId = selectedDistrict?.properties?.id;

  const handleDistrictClick = (d) => {
    if (selectedDistrictId === d.id) {
      resetSelection();
      return;
    }
    selectArea(d.feature, "district");
    const c = districtCentroids[d.id];
    if (c) flyTo(c, 12);
  };

  const handlePlaceFly = (place) => {
    flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 16);
    setSelectedPlaceDetail(place);
    setIsDetailOpen(true);
  };

  const displayPlaces = useMemo(() => {
    if (selectedDistrictId)
      return filteredPlaces.filter((p) => p.districtId === selectedDistrictId);
    return filteredPlaces;
  }, [filteredPlaces, selectedDistrictId]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPrice("all");
    setOnlyFeatured(false);
    resetSelection();
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "all" ||
    selectedPrice !== "all" ||
    onlyFeatured ||
    selectedDistrictId;

  return (
    <>
      <div
        ref={containerRef}
        className={`font-sans flex flex-col ${
          fullscreen
            ? "fixed inset-0 z-[9999] bg-white"
            : "h-[calc(100vh-140px)] min-h-[640px] rounded-3xl overflow-hidden border border-black/[0.04] bg-white shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
        }`}
      >
        {/* Header ToolBar */}
        <div className="h-14 bg-[#FAF9F5] border-b border-black/[0.04] flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-950 text-[#F3E600] flex items-center justify-center rounded-xl shadow-2xs">
              <MapIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-tight text-slate-950">
                {t("admin.map.title")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#F3E600] rounded-full shadow-[0_0_6px_#F3E600]" />
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  {t("admin.map.cityDistricts", { count: districtList.length || 9 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6">
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={t("admin.map.ariaLabels.clearSearch")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors mr-1"
              >
                <RefreshCw className="h-3 w-3" /> {t("admin.map.clearFilters")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setRoutingMode((v) => !v)}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs ${
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
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs ${
                viewMode === "list"
                  ? "bg-slate-950 text-white"
                  : "bg-white border border-black/[0.05] text-slate-700 hover:bg-[#F4F2EC]"
              }`}
              aria-label={viewMode === "map" ? t("admin.map.ariaLabels.toList") : t("admin.map.ariaLabels.toMap")}
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
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-2xs ${
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
              className="h-8 w-8 rounded-full bg-white border border-black/[0.05] text-slate-700 flex items-center justify-center hover:bg-[#F4F2EC] transition-all shadow-2xs"
              aria-label={fullscreen ? t("admin.map.ariaLabels.exitFullscreen") : t("admin.map.ariaLabels.enterFullscreen")}
            >
              {fullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Routing bar */}
        {routingMode && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-950 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Navigation2 className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span className="text-xs text-slate-200 font-medium truncate">
                {routing.origin?.name ?? (
                  <span className="text-slate-400 italic">
                    {t("admin.map.selectOrigin")}
                  </span>
                )}
              </span>
            </div>

            <span className="text-[#F3E600] font-mono shrink-0">→</span>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                <Flag className="w-2.5 h-2.5 text-white fill-white" />
              </div>
              <span className="text-xs text-slate-200 font-medium truncate">
                {routing.destination?.name ?? (
                  <span className="text-slate-400 italic">
                    {t("admin.map.selectDestination")}
                  </span>
                )}
              </span>
            </div>

            {routing.routeInfo && (
              <div className="flex items-center gap-2.5 shrink-0 bg-white/[0.1] rounded-full px-3 py-1 border border-white/[0.1]">
                <span className="text-xs font-mono font-bold text-[#F3E600] tabular-nums">
                  {routing.routeInfo.distanceLabel}
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {routing.routeInfo.durationLabel}
                </span>
              </div>
            )}

            {routing.loading && (
              <span className="text-xs text-[#F3E600] italic shrink-0">
                {t("admin.map.findingRoute")}
              </span>
            )}
            {routing.error && (
              <span className="text-xs text-rose-400 shrink-0">
                {routing.error}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                routing.clearRoute();
                setRoutingMode(false);
              }}
              className="shrink-0 text-slate-400 hover:text-white transition-colors"
              aria-label={t("admin.map.closeRouting")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-80 bg-white border-r border-black/[0.04] flex flex-col flex-shrink-0 overflow-hidden shadow-2xs">
              {/* Stat Tiles Strip */}
              <div className="grid grid-cols-3 border-b border-black/[0.04] bg-[#FAF9F5]">
                {[
                  { label: t("admin.map.places"), value: places.length, icon: MapPin },
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      panelTab === id
                        ? "bg-white text-slate-950 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <_Icon className="h-3 w-3" />
                    {label}
                    {id === "filters" && hasActiveFilters && (
                      <span className="w-1.5 h-1.5 bg-[#F3E600] rounded-full shadow-[0_0_4px_#F3E600]" aria-label={t("admin.map.ariaLabels.filterActive")} />
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
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
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
                        className="text-[10px] text-rose-500 font-bold flex items-center gap-1 hover:text-rose-700"
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
                          DISTRICT_COLORS[d.colorIdx % DISTRICT_COLORS.length]
                            ?.line || "#6b7280"
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
                                  width: `${filteredPlaces.length > 0 ? (d.count / filteredPlaces.length) * 100 : 0}%`,
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
          )}

          {/* Map / List area */}
          {viewMode === "map" ? (
            <div className="flex-1 relative overflow-hidden bg-[#F4F2EC]">
              {loading && (
                <div className="w-full h-full flex items-center justify-center bg-[#FAF9F5]">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-slate-950 border-t-[#F3E600] rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">
                      {t("admin.map.loading")}
                    </p>
                  </div>
                </div>
              )}
              {!loading && error && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F5] gap-3">
                  <AlertTriangle className="h-10 w-10 text-rose-400 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-700">
                    {t("admin.map.loadError")}
                  </p>
                  <button
                    type="button"
                    onClick={retry}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-950 rounded-full hover:bg-black transition-colors shadow-2xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("admin.map.retry")}
                  </button>
                </div>
              )}
              {!loading && !error && (
                <MapBase
                  className="w-full h-full"
                  onBoundaryClick={(f, t) => selectArea(f, t)}
                >
                  <BoundaryLayer
                    mask={canThoMask}
                    districts={districts}
                    wards={wards}
                  />
                  <PlaceMarkers />
                  {districts && <DistrictLabels districts={districts} />}
                  {wards && <WardLabels wards={wards} />}
                  <MapControls />
                </MapBase>
              )}

              {/* Floating Pill on Map */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-black/[0.06] rounded-full px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] pointer-events-none">
                <span className="w-2 h-2 bg-[#F3E600] rounded-full shadow-[0_0_6px_#F3E600] animate-pulse" />
                <span>
                  <strong className="text-slate-950 font-bold font-mono tabular-nums">
                    {filteredPlaces.length}
                  </strong>{" "}
                  {t("admin.map.places").toLowerCase()}
                </span>
                {selectedDistrictId && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-950 font-bold">
                      {selectedDistrict?.properties?.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <MapListView places={displayPlaces} onPlaceClick={handlePlaceFly} />
          )}
        </div>

        {/* Status bar */}
        <div className="h-7 bg-slate-950 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10.5px] font-mono text-slate-400">
            <span>
              {t("admin.map.statusBar.showing", { shown: filteredPlaces.length, total: places.length })}
            </span>
            {hasActiveFilters && (
              <span className="text-[#F3E600] font-bold">{t("admin.map.statusBar.filtersActive")}</span>
            )}
            {selectedDistrictId && (
              <span className="text-[#F3E600] font-bold">
                ◈ {selectedDistrict?.properties?.name}
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-mono text-slate-400">
            {t("admin.map.statusBar.canTho", { count: districtList.length || 9 })}
          </span>
        </div>
      </div>

      <Suspense fallback={null}>
        <PlaceDetailDialog
          place={selectedPlaceDetail}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </Suspense>
    </>
  );
};

const MapPage = () => (
  <MapProvider>
    <MapPageContent />
  </MapProvider>
);

export default MapPage;
