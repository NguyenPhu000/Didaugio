import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
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
  List,
  MapPin,
  X,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Eye,
  Navigation,
  BarChart3,
  Filter,
  RefreshCw,
  Layers,
} from "lucide-react";

const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);

// ── Category icon map (matches PlaceMarkers config) ─────────────────────────
import {
  Utensils,
  Hotel,
  TreePine,
  ShoppingBag,
  Landmark,
  Coffee,
  Tent,
  Leaf,
} from "lucide-react";

const CAT_ICONS = {
  1: Utensils,
  2: Hotel,
  3: Landmark,
  4: ShoppingBag,
  5: TreePine,
  6: Coffee,
  7: Tent,
  8: Leaf,
  13: Utensils,
};
const CatIcon = ({ id, className }) => {
  const Icon = CAT_ICONS[id] || MapPin;
  return <Icon className={className} />;
};

const PRICE_BADGE = {
  FREE: { label: "Miễn phí", cls: "bg-green-100 text-green-700" },
  BUDGET: { label: "Bình dân", cls: "bg-blue-100 text-blue-700" },
  MODERATE: { label: "Trung bình", cls: "bg-amber-100 text-amber-700" },
  EXPENSIVE: { label: "Cao cấp", cls: "bg-orange-100 text-orange-700" },
  LUXURY: { label: "Sang trọng", cls: "bg-purple-100 text-purple-700" },
};

// ── Place card in sidebar ────────────────────────────────────────────────────
const PlaceCard = ({ place, onClick }) => {
  const price = PRICE_BADGE[place.priceRange];
  const rating = Number(place.averageRating ?? place.ratingAvg ?? 0);
  const imgSrc = place.thumbnail || place.images?.[0]?.url;

  return (
    <button
      onClick={() => onClick(place)}
      className="w-full text-left flex gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {imgSrc ? (
          <img src={imgSrc} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">
          {place.name}
        </p>
        {place.address && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <Navigation className="h-2.5 w-2.5 shrink-0" />
            {place.address}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {rating > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-600">
                {rating.toFixed(1)}
              </span>
            </span>
          )}
          {price && (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${price.cls}`}
            >
              {price.label}
            </span>
          )}
          {place.isFeatured && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              ★ NỔI BẬT
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 self-center group-hover:text-gray-600 transition-colors shrink-0" />
    </button>
  );
};

// ── District row ─────────────────────────────────────────────────────────────
const DistrictRow = ({ name, count, total, color, active, onClick }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 text-left transition-all ${
        active ? "bg-gray-900 text-white" : "hover:bg-gray-50"
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: active ? "#facc15" : color }}
      />
      <span
        className={`flex-1 text-[12px] font-bold uppercase tracking-wide truncate ${active ? "text-white" : "text-gray-700"}`}
      >
        {name}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: active ? "#facc15" : color,
            }}
          />
        </div>
        <span
          className={`text-[11px] font-mono w-5 text-right ${active ? "text-yellow-400" : "text-gray-500"}`}
        >
          {count}
        </span>
      </div>
    </button>
  );
};

// ── Main page content ────────────────────────────────────────────────────────
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
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [viewMode, setViewMode] = useState("map"); // "map" | "list"
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelTab, setPanelTab] = useState("places"); // "places" | "districts" | "filters"
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchPlaces({ limit: 500, status: "approved" });
    if (!categories.length) fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen API
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
    const m = {};
    districts.features.forEach((f) => {
      try {
        if (f.geometry?.type === "Point") {
          m[f.properties.id] = {
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          };
        } else if (f.geometry) {
          const c = turfCentroid(f);
          m[f.properties.id] = {
            lat: c.geometry.coordinates[1],
            lng: c.geometry.coordinates[0],
          };
        }
      } catch {}
    });
    return m;
  }, [districts]);

  const filteredPlaces = useMemo(() => {
    let r = places;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== "all")
      r = r.filter((p) => p.categoryId?.toString() === selectedCategory);
    if (selectedPrice !== "all")
      r = r.filter((p) => p.priceRange === selectedPrice);
    if (onlyFeatured) r = r.filter((p) => p.isFeatured);
    return r;
  }, [places, searchQuery, selectedCategory, selectedPrice, onlyFeatured]);

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
    return filteredPlaces.slice(0, 80);
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
        {/* ── Header ── */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-lg">
              <MapIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-tight text-gray-900">
                Bản Đồ Số
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  Cần Thơ • 9 Quận/Huyện
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm địa điểm..."
                className="w-full h-9 border border-gray-200 rounded-lg pl-9 pr-8 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Xoá lọc
              </button>
            )}
            <button
              onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${viewMode === "list" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-100"}`}
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
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden shadow-sm">
              {/* Stats bar */}
              <div className="grid grid-cols-3 border-b border-gray-100">
                {[
                  { label: "Địa điểm", value: places.length, icon: MapPin },
                  {
                    label: "Hiển thị",
                    value: filteredPlaces.length,
                    icon: Eye,
                  },
                  {
                    label: "Khu vực",
                    value: districtList.length,
                    icon: BarChart3,
                  },
                ].map(({ label, value, icon: Icon }) => (
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

              {/* Tab bar */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {[
                  { id: "places", label: "Địa điểm", icon: MapPin },
                  { id: "districts", label: "Quận", icon: BarChart3 },
                  { id: "filters", label: "Lọc", icon: Filter },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPanelTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 ${
                      panelTab === id
                        ? "border-gray-900 text-gray-900 bg-white"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {id === "filters" && hasActiveFilters && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Panel: Places */}
              {panelTab === "places" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      {selectedDistrictId
                        ? selectedDistrict?.properties?.name
                        : "Tất cả địa điểm"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400">
                        {displayPlaces.length}
                      </span>
                      {selectedDistrictId && (
                        <button
                          onClick={resetSelection}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold"
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
                          Không có địa điểm
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

              {/* Panel: Districts */}
              {panelTab === "districts" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      9 Quận / Huyện
                    </span>
                    {selectedDistrictId && (
                      <button
                        onClick={resetSelection}
                        className="text-[10px] text-red-500 font-bold flex items-center gap-1 hover:text-red-700"
                      >
                        <X className="h-3 w-3" /> Bỏ chọn
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
                    {/* Summary */}
                    <div className="mt-2 mx-4 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
                        Phân bố địa điểm
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

              {/* Panel: Filters */}
              {panelTab === "filters" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Category filter */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Danh mục
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] font-bold transition-all ${
                          selectedCategory === "all"
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" /> Tất cả
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            setSelectedCategory(
                              selectedCategory === cat.id.toString()
                                ? "all"
                                : cat.id.toString(),
                            )
                          }
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left text-[11px] font-bold transition-all ${
                            selectedCategory === cat.id.toString()
                              ? "bg-gray-900 text-white border-gray-900"
                              : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          <CatIcon
                            id={cat.id}
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-auto text-[9px] opacity-60 font-mono">
                            {
                              places.filter((p) => p.categoryId === cat.id)
                                .length
                            }
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price filter */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Mức giá
                    </p>
                    <div className="space-y-1">
                      {[
                        { value: "all", label: "Tất cả mức giá" },
                        { value: "FREE", label: "Miễn phí" },
                        { value: "BUDGET", label: "Bình dân" },
                        { value: "MODERATE", label: "Trung bình" },
                        { value: "EXPENSIVE", label: "Cao cấp" },
                        { value: "LUXURY", label: "Sang trọng" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setSelectedPrice(value)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${
                            selectedPrice === value
                              ? "bg-gray-900 text-white border-gray-900"
                              : "border-gray-200 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {label}
                          {value !== "all" && (
                            <span
                              className={`text-[10px] font-mono ${selectedPrice === value ? "text-gray-400" : "text-gray-400"}`}
                            >
                              {
                                places.filter((p) => p.priceRange === value)
                                  .length
                              }
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Featured toggle */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                      Khác
                    </p>
                    <button
                      onClick={() => setOnlyFeatured((v) => !v)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all ${
                        onlyFeatured
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <Star
                        className={`h-4 w-4 ${onlyFeatured ? "fill-amber-400 text-amber-400" : "text-gray-400"}`}
                      />
                      Chỉ hiện nổi bật
                      <span className="ml-auto text-[10px] font-mono text-gray-400">
                        {places.filter((p) => p.isFeatured).length}
                      </span>
                    </button>
                  </div>

                  {/* Reset */}
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-[12px] font-bold hover:bg-red-100 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Xoá tất cả bộ lọc
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Map / List area */}
          {viewMode === "map" ? (
            <div className="flex-1 relative overflow-hidden">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      Đang tải bản đồ...
                    </p>
                  </div>
                </div>
              ) : (
                <MapBase className="w-full h-full">
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

              {/* Map overlay info pill */}
              <div className="absolute bottom-10 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-medium text-gray-600 shadow-sm pointer-events-none">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>
                  <strong className="text-gray-900">
                    {filteredPlaces.length}
                  </strong>{" "}
                  địa điểm
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
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {displayPlaces.map((place) => {
                  const imgSrc = place.thumbnail || place.images?.[0]?.url;
                  const rating = Number(
                    place.averageRating ?? place.ratingAvg ?? 0,
                  );
                  const price = PRICE_BADGE[place.priceRange];
                  return (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceFly(place)}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
                    >
                      <div className="h-36 overflow-hidden relative bg-gray-100">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-10 w-10 text-gray-200" />
                          </div>
                        )}
                        {place.category?.name && (
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {place.category.name}
                          </span>
                        )}
                        {place.isFeatured && (
                          <span className="absolute top-2 right-2 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[13px] font-bold text-gray-900 truncate">
                          {place.name}
                        </p>
                        {place.address && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {place.address}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {rating > 0 ? (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-[11px] font-bold text-amber-600">
                                {rating.toFixed(1)}
                              </span>
                            </span>
                          ) : (
                            <span />
                          )}
                          {price && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${price.cls}`}
                            >
                              {price.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Status bar ── */}
        <div className="h-7 bg-gray-900 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
            <span>
              HIỂN THỊ:{" "}
              <span className="text-white">{filteredPlaces.length}</span> /{" "}
              {places.length}
            </span>
            {hasActiveFilters && (
              <span className="text-yellow-400">● BỘ LỌC ĐANG BẬT</span>
            )}
            {selectedDistrictId && (
              <span className="text-yellow-400">
                ◈ {selectedDistrict?.properties?.name}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            CẦN THƠ — 9 QUẬN/HUYỆN
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
