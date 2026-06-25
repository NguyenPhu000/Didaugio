import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MapProvider,
  useMapContext,
  MapBase,
  BoundaryLayer,
  PlaceMarkers,
  MapControls,
} from "@/modules/map";
import DistrictLabels from "@/modules/map/components/DistrictLabels";
import WardLabels from "@/modules/map/components/WardLabels";
import PlaceCard from "@/pages/admin/map/PlaceCard";
import FilterPanel from "@/pages/admin/map/FilterPanel";
import {
  Search,
  MapPin,
  LayoutGrid,
  LayoutList,
  Plus,
  X,
  Edit2,
  RefreshCw,
  Map as MapIcon,
  CheckCircle2,
  Clock,
  Eye,
  Star,
  MapPinOff,
  Loader2,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  Navigation2,
} from "lucide-react";
import { getMyPlaces } from "@/apis/businessApi";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PlaceDetailDialog = lazy(() => import("@/components/place/PlaceDetailDialog"));

// ─── Status Config ───────────────────────────────────────────────────────────────

const useStatusConfig = () => {
  const { t } = useTranslation();
  return {
    approved: { label: t("business.places.approved"), bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-200" },
    pending: { label: t("business.places.pending"), bg: "bg-amber-500", text: "text-white", ring: "ring-amber-200" },
    draft: { label: t("business.places.draft"), bg: "bg-slate-400", text: "text-white", ring: "ring-slate-200" },
    rejected: { label: t("places.statusFilters.rejected"), bg: "bg-red-500", text: "text-white", ring: "ring-red-200" },
  };
};

// ─── Image Helper ────────────────────────────────────────────────────────────────

const getImageSrc = (place) => {
  if (!place) return null;
  if (place.thumbnail) return place.thumbnail;
  if (place.images?.length > 0) {
    const first = place.images[0];
    if (typeof first === "string") return first;
    if (first?.secureUrl) return first.secureUrl;
    if (first?.thumbnailUrl) return first.thumbnailUrl;
    if (first?.url) return first.url;
    if (first?.imageData) return first.imageData;
  }
  return null;
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-zinc-200/80">
    <div className={cn("p-2 rounded-lg", color)}>
      <Icon className="h-4 w-4 text-white" aria-hidden="true" />
    </div>
    <div>
      <p className="text-xl font-bold text-zinc-950 tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  </div>
);

// ─── Place Card Grid ────────────────────────────────────────────────────────────

const PlaceCardGrid = ({ place, onView, onEdit, onFly, statusConfig }) => {
  const { t } = useTranslation();
  const config = statusConfig[place.status] || statusConfig.draft;
  const imgSrc = getImageSrc(place);
  const rating = Number(place.ratingAvg ?? 0);

  return (
    <article
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 focus-within:ring-2 focus-within:ring-gray-400 transition-all duration-200"
      onClick={() => onView(place)}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add("bg-gray-200");
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <MapPinOff className="h-10 w-10 text-gray-300" aria-hidden="true" />
          </div>
        )}
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm",
              config.bg,
              config.text
            )}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {config.label}
          </span>
        </div>
        {/* Featured Badge */}
        {place.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            {t("business.places.featured")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate line-clamp-1">
          {place.name || t("business.places.noName")}
        </h3>
        {place.address && (
          <p className="text-xs text-gray-500 mt-1 truncate">{place.address}</p>
        )}
        {place.category?.name && (
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">
            {place.category.name}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
          {rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          )}
          {place.viewCount != null && (
            <span className="tabular-nums">{place.viewCount.toLocaleString()} {t("business.places.views")}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(place); }}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFly(place); }}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t("business.places.map")}
          </button>
        </div>
      </div>
    </article>
  );
};

// ─── Place Row ─────────────────────────────────────────────────────────────────

const PlaceRow = ({ place, onView, onEdit, onFly, statusConfig }) => {
  const { t } = useTranslation();
  const config = statusConfig[place.status] || statusConfig.draft;
  const imgSrc = getImageSrc(place);
  const rating = Number(place.ratingAvg ?? 0);

  return (
    <article
      className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-gray-400"
      onClick={() => onView(place)}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPinOff className="h-6 w-6 text-gray-300" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate line-clamp-1">
          {place.name || t("business.places.noName")}
        </p>
        {place.address && <p className="text-xs text-gray-500 truncate">{place.address}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", config.bg, config.text)}>
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
            {config.label}
          </span>
          {place.isFeatured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />}
          {rating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFly(place); }}
          className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          aria-label={t("business.places.viewOnMap")}
        >
          <MapPin className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(place); }}
          className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          aria-label={t("business.places.editPlace")}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(place); }}
          className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
          aria-label={t("business.places.viewDetails")}
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

// ─── Map View ───────────────────────────────────────────────────────────────────

const MapView = ({ places, onPlaceSelect }) => {
  const { t } = useTranslation();
  const { flyTo, setOnSelectPlace, setPlaces, setFilteredPlaces } = useMapContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelTab, setPanelTab] = useState("places");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync places to map context
  useEffect(() => {
    if (places.length > 0) {
      setPlaces(places);
      setFilteredPlaces(places);
    }
  }, [places, setPlaces, setFilteredPlaces]);

  // Register select handler
  useEffect(() => {
    setOnSelectPlace((place) => {
      onPlaceSelect(place);
      if (place.latitude && place.longitude) {
        flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 16);
      }
    });
    return () => setOnSelectPlace(null);
  }, [setOnSelectPlace, onPlaceSelect, flyTo]);

  // Fly to first place on mount
  useEffect(() => {
    const placeWithCoords = places.find((p) => p.latitude && p.longitude);
    if (placeWithCoords) {
      const timer = setTimeout(() => {
        flyTo({ lat: Number(placeWithCoords.latitude), lng: Number(placeWithCoords.longitude) }, 12);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [places.length]);

  // Fullscreen handlers
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

  // Filtered places
  const filteredPlaces = useMemo(() => {
    let result = places;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId?.toString() === selectedCategory);
    }
    if (selectedPrice !== "all") {
      result = result.filter((p) => p.priceRange === selectedPrice);
    }
    if (onlyFeatured) {
      result = result.filter((p) => p.isFeatured);
    }
    return result;
  }, [places, searchQuery, selectedCategory, selectedPrice, onlyFeatured]);

  useEffect(() => {
    setFilteredPlaces(filteredPlaces);
  }, [filteredPlaces, setFilteredPlaces]);

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedPrice !== "all" || onlyFeatured;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPrice("all");
    setOnlyFeatured(false);
  };

  const handlePlaceFly = (place) => {
    flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 16);
    onPlaceSelect(place);
  };

  const districtCount = useMemo(() => {
    return new Set(places.map((p) => p.districtId).filter(Boolean)).size;
  }, [places]);

  return (
    <div ref={containerRef} className={cn("bg-gray-100 flex flex-col", fullscreen ? "fixed inset-0 z-[9999]" : "h-full")}>
      {/* Mini Header */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 text-white flex items-center justify-center rounded-lg">
            <MapIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{t("business.places.title")}</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-[9px] font-mono text-gray-400 uppercase tabular-nums">
                {filteredPlaces.length} {t("business.places.total")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search")}
              className="w-full h-9 border border-gray-200 rounded-lg pl-9 pr-8 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 bg-gray-50 placeholder:text-gray-400"
              aria-label={t("business.places.searchPlaceholder")}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-gray-600"
                aria-label={t("common.search")}
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
              className="flex items-center gap-1 h-8 px-3 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              {t("business.places.filter")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            aria-label={t("admin.map.ariaLabels.toggleSidebar")}
            aria-expanded={sidebarOpen}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            aria-label={fullscreen ? t("admin.map.ariaLabels.exitFullscreen") : t("admin.map.ariaLabels.enterFullscreen")}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden" aria-label={t("admin.map.ariaLabels.toggleSidebar")}>
            {/* Stats */}
            <div className="grid grid-cols-3 border-b border-gray-100">
              {[
                { label: t("business.places.total"), value: places.length },
                { label: t("business.places.refresh"), value: filteredPlaces.length },
                { label: t("admin.map.districts"), value: districtCount },
              ].map(({ label, value }) => (
                <div key={label} className="py-3 text-center border-r border-gray-100 last:border-r-0">
                  <div className="text-xl font-black text-gray-900 tabular-nums">{value}</div>
                  <div className="text-[9px] font-mono uppercase text-gray-400 tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50" role="tablist">
              {[
                { id: "places", label: t("admin.map.places"), icon: MapPin },
                { id: "filters", label: t("admin.map.filters"), icon: Filter, hasIndicator: hasActiveFilters },
              ].map(({ id, label, icon: TabIcon, hasIndicator }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={panelTab === id}
                  aria-controls={`${id}-panel`}
                  onClick={() => setPanelTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400",
                    panelTab === id
                      ? "border-gray-900 text-gray-900 bg-white"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                  {hasIndicator && (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" aria-label={t("admin.map.ariaLabels.filterActive")} />
                  )}
                </button>
              ))}
            </div>

            {/* Places Panel */}
            {panelTab === "places" && (
              <ScrollArea className="flex-1" aria-label={t("admin.map.places")}>
                <div className="p-2" role="tabpanel" id="places-panel">
                  {filteredPlaces.length === 0 ? (
                    <div className="py-12 text-center">
                      <MapPinOff className="h-8 w-8 text-gray-200 mx-auto mb-2" aria-hidden="true" />
                      <p className="text-xs text-gray-400 font-medium">{t("admin.map.noPlaces")}</p>
                    </div>
                  ) : (
                    filteredPlaces.map((place) => (
                      <PlaceCard key={place.id} place={place} onClick={handlePlaceFly} />
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Filters Panel */}
            {panelTab === "filters" && (
              <div className="flex-1 overflow-y-auto" role="tabpanel" id="filters-panel">
                <FilterPanel
                  categories={[]}
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
              </div>
            )}
          </aside>
        )}

        {/* Map */}
        <main className="flex-1 relative">
          <MapBase className="w-full h-full">
            <BoundaryLayer />
            <PlaceMarkers />
            <DistrictLabels />
            <WardLabels />
            <MapControls />
          </MapBase>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-medium text-gray-600 shadow-sm" aria-live="polite">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            <span><strong className="text-gray-900 tabular-nums">{filteredPlaces.length}</strong> {t("business.places.total")}</span>
          </div>
        </main>
      </div>

      {/* Status bar */}
      <footer className="h-7 bg-gray-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400">
          <span>{t("admin.map.statusBar.showing", { shown: filteredPlaces.length, total: places.length })}</span>
          {hasActiveFilters && <span className="text-yellow-400">{t("admin.map.statusBar.filtersActive")}</span>}
        </div>
        <span className="text-[10px] font-mono text-gray-500">{t("admin.map.statusBar.canTho", { count: districtCount })}</span>
      </footer>
    </div>
  );
};

// ─── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ onAddNew }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center" role="status">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MapPinOff className="h-10 w-10 text-gray-300" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{t("business.places.noPlacesYet")}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-6 max-w-sm">
        {t("business.places.noPlacesDesc")}
      </p>
      <Button onClick={onAddNew} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("business.places.addPlace")}
      </Button>
    </div>
  );
};

// ─── Loading Skeleton ──────────────────────────────────────────────────────────

const LoadingSkeleton = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6" aria-label={t("business.places.loading")} aria-busy="true">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const BusinessPlacePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [places, setPlacesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [viewTab, setViewTab] = useState(searchParams.get("tab") || "grid");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  const statusConfig = useStatusConfig();

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPlaces();
      setPlacesData(res.data || []);
    } catch (err) {
      console.error("[BusinessPlacePage] Fetch error:", err);
      toast.error(t("business.places.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // URL sync
  const updateURL = useCallback((tab, searchVal) => {
    const params = {};
    if (tab && tab !== "grid") params.tab = tab;
    if (searchVal) params.search = searchVal;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const searchVal = searchParams.get("search") || "";
    if (tab) setViewTab(tab);
    if (searchVal) setSearch(searchVal);
  }, []);

  const handleSearch = useCallback((value) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      updateURL(viewTab, value);
    }, 300);
  }, [viewTab, updateURL]);

  const handleTabChange = useCallback((tab) => {
    setViewTab(tab);
    updateURL(tab, search);
  }, [search, updateURL]);

  const filteredPlaces = useMemo(() => {
    if (!search.trim()) return places;
    const q = search.toLowerCase();
    return places.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [places, search]);

  // Stats
  const stats = useMemo(() => ({
    total: places.length,
    approved: places.filter((p) => p.status === "approved").length,
    pending: places.filter((p) => p.status === "pending").length,
    draft: places.filter((p) => p.status === "draft" || !p.status).length,
  }), [places]);

  const handlePlaceView = useCallback((place) => {
    setSelectedPlace(place);
    setDetailOpen(true);
  }, []);

  const handlePlaceEdit = useCallback((place) => {
    navigate(`${BUSINESS_ROUTES.PLACES}/edit/${place.id}`);
  }, [navigate]);

  const handlePlaceFly = useCallback((place) => {
    setViewTab("map");
    updateURL("map", search);
    setTimeout(() => handlePlaceView(place), 100);
  }, [search, updateURL, handlePlaceView]);

  const handleAddNew = useCallback(() => {
    navigate(`${BUSINESS_ROUTES.PLACES}/new`);
  }, [navigate]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    handleSearch(value);
  }, [handleSearch]);

  const TABS = [
    { id: "grid", label: t("business.places.grid"), icon: LayoutGrid },
    { id: "list", label: t("business.places.list"), icon: LayoutList },
    { id: "map", label: t("business.places.map"), icon: MapIcon },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("business.places.title")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("business.places.subtitle")}</p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("business.places.addPlace")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard label={t("business.places.total")} value={stats.total} color="bg-gray-900" icon={MapPin} />
          <StatCard label={t("business.places.approved")} value={stats.approved} color="bg-emerald-500" icon={CheckCircle2} />
          <StatCard label={t("business.places.pending")} value={stats.pending} color="bg-amber-500" icon={Clock} />
          <StatCard label={t("business.places.draft")} value={stats.draft} color="bg-slate-400" icon={Edit2} />
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 shrink-0" role="tablist" aria-label={t("business.places.viewDetails")}>
        <div className="flex items-center gap-1">
          {TABS.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={viewTab === id}
              aria-controls={`${id}-panel`}
              onClick={() => handleTabChange(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400",
                viewTab === id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <TabIcon className="h-4 w-4" aria-hidden="true" />
              {label}
              {id === "grid" && filteredPlaces.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs tabular-nums">{filteredPlaces.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-white px-6 py-3 border-b border-gray-100 shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            placeholder={t("business.places.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder:text-gray-400"
            aria-label={t("business.places.searchPlaceholder")}
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-gray-600"
              aria-label={t("common.search")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-hidden" role="tabpanel" id={`${viewTab}-panel`}>
        {loading ? (
          <LoadingSkeleton />
        ) : filteredPlaces.length === 0 && !search ? (
          <EmptyState onAddNew={handleAddNew} />
        ) : filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center" role="status">
            <Navigation2 className="h-12 w-12 text-gray-300 mb-3" aria-hidden="true" />
            <p className="text-gray-500 font-medium">{t("business.places.noResults")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("business.places.tryDifferentKeywords")}</p>
          </div>
        ) : viewTab === "grid" ? (
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlaces.map((place) => (
                  <PlaceCardGrid
                    key={place.id}
                    place={place}
                    onView={handlePlaceView}
                    onEdit={handlePlaceEdit}
                    onFly={handlePlaceFly}
                    statusConfig={statusConfig}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : viewTab === "list" ? (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-2 max-w-4xl mx-auto">
              {filteredPlaces.map((place) => (
                <PlaceRow
                  key={place.id}
                  place={place}
                  onView={handlePlaceView}
                  onEdit={handlePlaceEdit}
                  onFly={handlePlaceFly}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <MapProvider>
            <MapView
              places={filteredPlaces}
              onPlaceSelect={handlePlaceView}
            />
          </MapProvider>
        )}
      </main>

      {/* Detail Dialog */}
      <Suspense fallback={null}>
        {selectedPlace && (
          <PlaceDetailDialog
            place={selectedPlace}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onEdit={() => { setDetailOpen(false); handlePlaceEdit(selectedPlace); }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default BusinessPlacePage;
