import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { centroid as turfCentroid } from "@turf/turf";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";
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
import {
  Search,
  MapIcon,
  ListIcon,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);

const DistrictRow = ({ name, count, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 border-b border-gray-100 text-left transition-colors cursor-pointer ${
      active ? "bg-black text-white" : "hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 flex-shrink-0"
        style={{ backgroundColor: active ? "#fff" : color }}
      />
      <span
        className={`text-xs font-bold uppercase ${active ? "text-white" : "text-gray-700"}`}
      >
        {name}
      </span>
    </div>
    <span
      className={`text-[10px] font-mono px-1.5 py-0.5 ${active ? "bg-white text-black" : "bg-gray-100 text-gray-500"}`}
    >
      {count}
    </span>
  </button>
);

const PlaceCard = ({ place, onFly }) => (
  <div
    onClick={() => onFly(place)}
    className="flex gap-2 px-3 py-2.5 border-b border-gray-100 hover:bg-yellow-50 cursor-pointer group"
  >
    <div className="w-10 h-10 flex-shrink-0 bg-gray-100 overflow-hidden">
      {place.images?.[0]?.url ? (
        <img
          src={place.images[0].url}
          className="w-full h-full object-cover"
          alt=""
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <MapPin className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold uppercase truncate group-hover:text-black">
        {place.name}
      </p>
      <p className="text-[10px] text-gray-400 font-mono truncate">
        {place.address || "—"}
      </p>
    </div>
  </div>
);

const MapPageContent = () => {
  const {
    flyTo,
    selectArea,
    selectedDistrict,
    resetSelection,
    setFilteredPlaces,
  } = useMapContext();
  const { districts, wards, canThoMask, loading } = useMapData();
  const { places, fetchPlaces } = usePlaceStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState("map");
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    // Only load system-pinned places onto the map
    fetchPlaces({ limit: 100, status: "approved", isFeatured: true });
    if (!categories.length) fetchCategories();
  }, [fetchPlaces, fetchCategories]);

  const districtIds = useMemo(() => {
    if (!districts?.features) return [];
    return [...districts.features]
      .sort((a, b) => a.properties.id - b.properties.id)
      .map((f) => f.properties.id);
  }, [districts]);

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
      } catch {}
    });
    return map;
  }, [districts]);

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.categoryId?.toString() === selectedCategory,
      );
    }
    return result;
  }, [places, searchQuery, selectedCategory]);

  // Sync filtered places into MapContext so PlaceMarkers can render them
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
    const coords = districtCentroids[d.id];
    if (coords) flyTo(coords, 13);
  };

  const handlePlaceFly = (place) => {
    flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 16);
    setSelectedPlaceDetail(place);
    setIsDetailOpen(true);
  };

  const districtPlaces = useMemo(() => {
    if (!selectedDistrictId) return [];
    return filteredPlaces.filter((p) => p.districtId === selectedDistrictId);
  }, [filteredPlaces, selectedDistrictId]);

  const displayPlaces = selectedDistrictId
    ? districtPlaces
    : filteredPlaces.slice(0, 60);

  return (
    <>
      <div className="h-[calc(100vh-2rem)] bg-[#F4F4F4] relative overflow-hidden font-sans p-4">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none" />
        <div className="h-full border border-black bg-white flex flex-col shadow-hard relative z-10">
          {/* Header */}
          <div className="h-14 border-b border-black flex items-center justify-between px-5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2">
                <MapIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-black uppercase tracking-tight">
                  BẢN ĐỒ SỐ
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                    CẦN THƠ • 9 QUẬN/HUYỆN
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-sm mx-6 flex">
              <div className="h-9 w-9 bg-gray-100 border border-black border-r-0 flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="TÌM KIẾM ĐỊA ĐIỂM..."
                className="h-9 flex-1 border border-black px-3 font-mono text-xs uppercase focus:outline-none focus:bg-yellow-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="h-9 w-9 border border-black border-l-0 flex items-center justify-center hover:bg-black hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("map")}
                className={`h-9 w-9 border border-black flex items-center justify-center ${viewMode === "map" ? "bg-primary" : "hover:bg-gray-100"}`}
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`h-9 w-9 border border-black flex items-center justify-center ${viewMode === "list" ? "bg-primary" : "hover:bg-gray-100"}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="h-9 w-9 border border-black flex items-center justify-center hover:bg-black hover:text-white"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            {sidebarOpen && (
              <div className="w-64 border-r border-black flex-shrink-0 flex flex-col overflow-hidden bg-white">
                <div className="px-3 py-2 border-b border-gray-100 flex gap-3 bg-gray-50">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-black">{places.length}</div>
                    <div className="text-[9px] font-mono text-gray-400 uppercase">
                      Địa điểm
                    </div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="flex-1 text-center">
                    <div className="text-lg font-black">
                      {filteredPlaces.length}
                    </div>
                    <div className="text-[9px] font-mono text-gray-400 uppercase">
                      Hiển thị
                    </div>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="flex-1 text-center">
                    <div className="text-lg font-black">
                      {districtList.length}
                    </div>
                    <div className="text-[9px] font-mono text-gray-400 uppercase">
                      Khu vực
                    </div>
                  </div>
                </div>

                <div className="p-2 border-b border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-colors ${selectedCategory === "all" ? "bg-black text-white border-black" : "border-gray-300 text-gray-500 hover:border-black"}`}
                    >
                      Tất cả
                    </button>
                    {categories.slice(0, 8).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === cat.id.toString()
                              ? "all"
                              : cat.id.toString(),
                          )
                        }
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase border transition-colors ${selectedCategory === cat.id.toString() ? "bg-primary text-black border-primary" : "border-gray-300 text-gray-500 hover:border-black"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-b border-black">
                  <div className="px-3 py-1.5 bg-black text-white flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Quận / Huyện
                    </span>
                    {selectedDistrictId && (
                      <button
                        onClick={resetSelection}
                        className="text-[9px] text-gray-400 hover:text-white uppercase"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  {districtList.map((d) => (
                    <DistrictRow
                      key={d.id}
                      name={d.name}
                      count={d.count}
                      color={
                        DISTRICT_COLORS[d.colorIdx % DISTRICT_COLORS.length]
                          ?.line || "#6b7280"
                      }
                      active={selectedDistrictId === d.id}
                      onClick={() => handleDistrictClick(d)}
                    />
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-gray-900 text-white flex items-center justify-between sticky top-0">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {selectedDistrictId
                        ? selectedDistrict?.properties?.name
                        : "Địa điểm"}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">
                      {displayPlaces.length}
                    </span>
                  </div>
                  {displayPlaces.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 font-mono uppercase">
                      Không có dữ liệu
                    </div>
                  ) : (
                    displayPlaces.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        onFly={handlePlaceFly}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Map or List */}
            {viewMode === "map" ? (
              <div className="flex-1 relative">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-2" />
                      <span className="text-xs font-mono uppercase text-gray-500">
                        Đang tải bản đồ...
                      </span>
                    </div>
                  </div>
                ) : (
                  <MapBase>
                    <BoundaryLayer
                      mask={canThoMask}
                      districts={districts}
                      wards={wards}
                      onSelect={(f, t) => selectArea(f, t)}
                    />
                    <PlaceMarkers />
                    {districts && <DistrictLabels districts={districts} />}
                    <MapControls />
                  </MapBase>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceFly(place)}
                      className="border border-black bg-white group hover:shadow-hard transition-all cursor-pointer"
                    >
                      <div className="h-28 overflow-hidden relative">
                        {place.images?.[0]?.url ? (
                          <img
                            src={place.images[0].url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <MapPin className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        <span className="absolute top-2 right-2 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 uppercase">
                          {place.category?.name || "—"}
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-black uppercase truncate">
                          {place.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {place.address || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-7 bg-black border-t border-white/20 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex gap-4 text-[9px] font-mono text-gray-400 uppercase">
              <span>
                HIỂN THỊ: {filteredPlaces.length} / {places.length}
              </span>
              {selectedDistrictId && (
                <span className="text-primary">
                  ◈ {selectedDistrict?.properties?.name}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-gray-500 uppercase">
              CẦN THƠ — 9 QUẬN/HUYỆN
            </span>
          </div>
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
