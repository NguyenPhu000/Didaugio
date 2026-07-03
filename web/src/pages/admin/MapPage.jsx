import { useState, useEffect, useMemo, useCallback, useDeferredValue, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { centroid as turfCentroid } from "@turf/turf";
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
import PlaceCard from "./map/PlaceCard";
import DistrictRow from "./map/DistrictRow";
import FilterPanel from "./map/FilterPanel";
import MapListView from "./map/MapListView";

const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);

const FETCH_LIMIT = 500;

const MapPageContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
        className={`bg-gray-100 font-sans flex flex-col ${fullscreen ? "fixed inset-0 z-[9999]" : "h-screen"}`}
      >
        {/* Header */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-lg">
              <MapIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-tight text-gray-900">
                {t("admin.map.title")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {t("admin.map.cityDistricts", { count: districtList.length || 9 })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("admin.map.searchPlaceholder")}
                className="w-full h-9 border border-gray-200 rounded-lg pl-9 pr-8 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
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
                onClick={resetFilters}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> {t("admin.map.clearFilters")}
              </button>
            )}
            <button
              onClick={() => setRoutingMode((v) => !v)}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${
                routingMode
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 hover:bg-gray-100"
              }`}
              title={t("admin.map.routing")}
              aria-label={t("admin.map.ariaLabels.routingMode")}
            >
              <Route className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${viewMode === "list" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-100"}`}
              aria-label={viewMode === "map" ? t("admin.map.ariaLabels.toList") : t("admin.map.ariaLabels.toMap")}
            >
              {viewMode === "map" ? (
                <List className="h-4 w-4" />
              ) : (
                <MapIcon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={t("admin.map.ariaLabels.toggleSidebar")}
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              aria-label={fullscreen ? t("admin.map.ariaLabels.exitFullscreen") : t("admin.map.ariaLabels.enterFullscreen")}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Routing bar */}
        {routingMode && (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-950 border-b border-blue-800 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Navigation2 className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-[12px] text-blue-100 font-medium truncate">
                {routing.origin?.name ?? (
                  <span className="text-blue-400 italic">
                    {t("admin.map.selectOrigin")}
                  </span>
                )}
              </span>
            </div>

            <span className="text-blue-500 shrink-0">→</span>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <Flag className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-[12px] text-blue-100 font-medium truncate">
                {routing.destination?.name ?? (
                  <span className="text-blue-400 italic">
                    {t("admin.map.selectDestination")}
                  </span>
                )}
              </span>
            </div>

            {routing.routeInfo && (
              <div className="flex items-center gap-3 shrink-0 bg-blue-900/60 rounded-lg px-3 py-1">
                <span className="text-[12px] font-black text-white">
                  {routing.routeInfo.distanceLabel}
                </span>
                <span className="text-[10px] text-blue-300">
                  {routing.routeInfo.durationLabel}
                </span>
              </div>
            )}

            {routing.loading && (
              <span className="text-[11px] text-blue-300 italic shrink-0">
                {t("admin.map.findingRoute")}
              </span>
            )}
            {routing.error && (
              <span className="text-[11px] text-red-400 shrink-0">
                {routing.error}
              </span>
            )}

            <button
              onClick={() => {
                routing.clearRoute();
                setRoutingMode(false);
              }}
              className="shrink-0 text-blue-400 hover:text-white transition-colors"
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
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 border-b border-gray-100">
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
                    className="py-3 text-center border-r border-gray-100 last:border-r-0"
                  >
                    <div className="text-xl font-black text-gray-900">
                      {value}
                    </div>
                    <div className="text-[9px] font-mono uppercase text-gray-400 tracking-wider">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex border-b border-gray-200 bg-gray-50">
                {[
                  { id: "places", label: t("admin.map.places"), icon: MapPin },
                  { id: "districts", label: t("admin.map.districts"), icon: BarChart3 },
                  { id: "filters", label: t("admin.map.filters"), icon: Filter },
                ].map(({ id, label, icon: _Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPanelTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
                      panelTab === id
                        ? "border-gray-900 text-gray-900 bg-white"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <_Icon className="h-3.5 w-3.5" />
                    {label}
                    {id === "filters" && hasActiveFilters && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-label={t("admin.map.ariaLabels.filterActive")} />
                    )}
                  </button>
                ))}
              </div>

              {/* Places panel */}
              {panelTab === "places" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      {selectedDistrictId
                        ? selectedDistrict?.properties?.name
                        : t("admin.map.allPlaces")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400">
                        {displayPlaces.length}
                      </span>
                      {selectedDistrictId && (
                        <button
                          onClick={resetSelection}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold"
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
                        <MapPin className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-medium">
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
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      {districtList.length} {t("admin.map.districts")}
                    </span>
                    {selectedDistrictId && (
                      <button
                        onClick={resetSelection}
                        className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:text-red-700"
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
                    <div className="mt-2 mx-4 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
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
                            <span className="text-[11px] text-gray-600 w-24 truncate">
                              {d.name}
                            </span>
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                            <span className="text-[10px] font-mono text-gray-400 w-4 text-right">
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
            <div className="flex-1 relative overflow-hidden">
              {loading && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      {t("admin.map.loading")}
                    </p>
                  </div>
                </div>
              )}
              {!loading && error && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
                  <AlertTriangle className="h-10 w-10 text-red-400" />
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.map.loadError")}
                  </p>
                  <button
                    onClick={retry}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
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

              <div className="absolute bottom-10 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-medium text-gray-600 shadow-sm pointer-events-none">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>
                  <strong className="text-gray-900">
                    {filteredPlaces.length}
                  </strong>{" "}
                  {t("admin.map.places").toLowerCase()}
                </span>
                {selectedDistrictId && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-700 font-bold">
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
        <div className="h-7 bg-gray-900 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
            <span>
              {t("admin.map.statusBar.showing", { shown: filteredPlaces.length, total: places.length })}
            </span>
            {hasActiveFilters && (
              <span className="text-yellow-400">{t("admin.map.statusBar.filtersActive")}</span>
            )}
            {selectedDistrictId && (
              <span className="text-yellow-400">
                ◈ {selectedDistrict?.properties?.name}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-gray-500">
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
