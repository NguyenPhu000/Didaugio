// MAP: MapPage
// ├── UI: @/components/admin/map/{MapHeaderToolbar, MapRoutingBar, MapSidebar, MapCanvasView}
// └── API: @/hooks/queries/usePlaceQueries, @/hooks/queries/useCategoryQueries, @/modules/map

import { useState, useEffect, useMemo, useCallback, useDeferredValue, lazy, Suspense, useRef } from "react";
import { useTranslation } from "react-i18next";
import turfCentroid from "@turf/centroid";
import { usePlaces } from "@/hooks/queries/usePlaceQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { MapProvider, useMapContext, useMapData } from "@/modules/map";

// Extracted Sub-Components
import MapHeaderToolbar from "@/components/admin/map/MapHeaderToolbar";
import MapRoutingBar from "@/components/admin/map/MapRoutingBar";
import MapSidebar from "@/components/admin/map/MapSidebar";
import MapCanvasView from "@/components/admin/map/MapCanvasView";

const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog")
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
          p.address?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all")
      result = result.filter(
        (p) => p.categoryId?.toString() === selectedCategory
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
        <MapHeaderToolbar
          districtCount={districtList.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          hasActiveFilters={hasActiveFilters}
          resetFilters={resetFilters}
          routingMode={routingMode}
          setRoutingMode={setRoutingMode}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          fullscreen={fullscreen}
          toggleFullscreen={toggleFullscreen}
        />

        {/* Routing bar */}
        <MapRoutingBar
          routingMode={routingMode}
          routing={routing}
          setRoutingMode={setRoutingMode}
        />

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <MapSidebar
            sidebarOpen={sidebarOpen}
            places={places}
            filteredPlaces={filteredPlaces}
            districtList={districtList}
            panelTab={panelTab}
            setPanelTab={setPanelTab}
            hasActiveFilters={hasActiveFilters}
            selectedDistrictId={selectedDistrictId}
            selectedDistrict={selectedDistrict}
            displayPlaces={displayPlaces}
            resetSelection={resetSelection}
            handlePlaceFly={handlePlaceFly}
            handleDistrictClick={handleDistrictClick}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPrice={selectedPrice}
            setSelectedPrice={setSelectedPrice}
            onlyFeatured={onlyFeatured}
            setOnlyFeatured={setOnlyFeatured}
            resetFilters={resetFilters}
          />

          {/* Map / List View */}
          <MapCanvasView
            viewMode={viewMode}
            loading={loading}
            error={error}
            retry={retry}
            selectArea={selectArea}
            canThoMask={canThoMask}
            districts={districts}
            wards={wards}
            filteredPlaces={filteredPlaces}
            selectedDistrictId={selectedDistrictId}
            selectedDistrict={selectedDistrict}
            displayPlaces={displayPlaces}
            handlePlaceFly={handlePlaceFly}
          />
        </div>

        {/* Status bar */}
        <div className="h-7 bg-slate-950 flex items-center justify-between px-5 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10.5px] font-mono text-slate-400">
            <span>
              {t("admin.map.statusBar.showing", {
                shown: filteredPlaces.length,
                total: places.length,
              })}
            </span>
            {hasActiveFilters && (
              <span className="text-[#F3E600] font-bold">
                {t("admin.map.statusBar.filtersActive")}
              </span>
            )}
            {selectedDistrictId && (
              <span className="text-[#F3E600] font-bold">
                ◈ {selectedDistrict?.properties?.name}
              </span>
            )}
          </div>
          <span className="text-[10.5px] font-mono text-slate-400">
            {t("admin.map.statusBar.canTho", {
              count: districtList.length || 9,
            })}
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
