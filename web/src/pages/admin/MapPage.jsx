import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import usePlaceStore from "@/stores/placeStore";
import useCategoryStore from "@/stores/categoryStore";

// Dynamic import for heavy component
const PlaceDetailDialog = lazy(
  () => import("@/components/place/PlaceDetailDialog"),
);
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  Search,
  Filter,
  MapIcon,
  ListIcon,
  Heart,
  Target,
  Maximize,
  Compass,
} from "lucide-react";
import {
  CAN_THO_CENTER,
  MAP_CONFIGS,
  DEFAULT_MAP_STYLE,
  MapGL,
  NavigationControl,
  Marker,
  Popup,
} from "@/modules/map";

/**
 * MAP PAGE - T.I.M STYLE OVERHAUL (VIETNAMESE + REAL MAP)
 */

const MapPage = () => {
  const { places, fetchPlaces } = usePlaceStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [viewState, setViewState] = useState({
    latitude: CAN_THO_CENTER.lat,
    longitude: CAN_THO_CENTER.lng,
    zoom: 12,
  });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("map");
  const mapRef = useRef(null);

  useEffect(() => {
    fetchPlaces({ limit: 100, status: "approved" });
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [fetchPlaces, fetchCategories, categories.length]);

  const filteredPlaces = useMemo(() => {
    let filtered = places;
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (p) => p.categoryId?.toString() === selectedCategory,
      );
    }
    return filtered;
  }, [places, searchQuery, selectedCategory]);

  return (
    <div className="h-[calc(100vh-2rem)] bg-[#F4F4F4] relative overflow-hidden font-sans p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid-20 opacity-30 pointer-events-none"></div>

      {/* Main Container - Industrial Frame */}
      <div className="h-full border border-black bg-white flex flex-col shadow-hard relative z-10">
        {/* Top Control Bar */}
        <div className="h-16 border-b border-black flex items-center justify-between px-6 bg-white z-20 relative">
          {/* Left Title Module */}
          <div className="flex items-center gap-4 h-full border-r border-dashed border-gray-300 pr-6">
            <div className="bg-black text-white p-2">
              <MapIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">
                BẢN ĐỒ SỐ
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-none animate-pulse"></span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  CẦN THƠ // TRỰC TUYẾN
                </span>
              </div>
            </div>
          </div>

          {/* Center Search & Filter Module */}
          <div className="flex-1 flex items-center justify-center gap-4">
            {/* Tim Search Bar */}
            <div className="flex items-center shadow-sm w-96 group">
              <div className="h-10 w-10 bg-gray-100 border border-black border-r-0 flex items-center justify-center group-hover:bg-primary transition-colors">
                <Search className="h-4 w-4 text-black" />
              </div>
              <input
                placeholder="TÌM KIẾM ĐỊA ĐIỂM..."
                className="h-10 flex-1 border border-black px-4 font-mono text-xs uppercase focus:outline-none focus:bg-yellow-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-none border border-black hover:bg-black hover:text-white font-mono text-xs uppercase"
                >
                  <Filter className="h-3 w-3 mr-2" />
                  DANH MỤC
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-none border-black">
                <DropdownMenuItem
                  onClick={() => setSelectedCategory("all")}
                  className="font-mono text-xs uppercase cursor-pointer hover:bg-primary"
                >
                  TẤT CẢ
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    className="font-mono text-xs uppercase cursor-pointer"
                  >
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 border-l border-dashed border-gray-300 pl-6 h-full">
            <Button
              className={`h-10 w-10 p-0 rounded-none border border-black ${viewMode === "map" ? "bg-primary text-black" : "bg-white text-gray-400 hover:bg-black hover:text-white"}`}
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-5 w-5" />
            </Button>
            <Button
              className={`h-10 w-10 p-0 rounded-none border border-black ${viewMode === "list" ? "bg-primary text-black" : "bg-white text-gray-400 hover:bg-black hover:text-white"}`}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {viewMode === "map" ? (
            <div className="absolute inset-0 w-full h-full">
              <MapGL
                ref={mapRef}
                initialViewState={viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle={DEFAULT_MAP_STYLE}
                attributionControl={false}
              >
                <NavigationControl
                  position="bottom-right"
                  showCompass={false}
                />

                {/* Markers */}
                {filteredPlaces.map(
                  (place) =>
                    place.latitude &&
                    place.longitude && (
                      <Marker
                        key={place.id}
                        latitude={place.latitude}
                        longitude={place.longitude}
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedPlace(place);
                        }}
                      >
                        <div className="relative group cursor-pointer hover:z-50">
                          <div className="w-8 h-8 bg-black text-white flex items-center justify-center border border-primary shadow-hard hover:bg-primary hover:text-black transition-colors">
                            <MapIcon className="w-4 h-4" />
                          </div>
                          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border border-black px-2 py-1 text-[10px] whitespace-nowrap hidden group-hover:block font-bold">
                            {place.name}
                          </div>
                        </div>
                      </Marker>
                    ),
                )}

                {/* Cleanup Selected Place on Map Click */}
                {selectedPlace && (
                  <Popup
                    latitude={selectedPlace.latitude}
                    longitude={selectedPlace.longitude}
                    onClose={() => setSelectedPlace(null)}
                    closeButton={false}
                    className="z-50"
                    maxWidth="300px"
                  >
                    <div className="p-0 font-sans">
                      <div className="p-3 border border-black bg-white shadow-hard relative">
                        <button
                          onClick={() => setSelectedPlace(null)}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black text-white text-xs font-bold hover:bg-red-500"
                        >
                          X
                        </button>
                        <h3 className="font-bold text-sm uppercase pr-6 mb-1">
                          {selectedPlace.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2 font-mono">
                          {selectedPlace.address}
                        </p>
                        <div className="h-24 bg-gray-100 mb-2 overflow-hidden border border-black/10">
                          {selectedPlace.images?.[0] ? (
                            <img
                              src={
                                selectedPlace.images[0].imageData ||
                                selectedPlace.images[0]
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 uppercase">
                              NO_IMG
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setIsDetailOpen(true)}
                          className="w-full h-8 rounded-none bg-primary text-black font-bold uppercase hover:bg-yellow-400 text-xs"
                        >
                          XEM CHI TIẾT
                        </Button>
                      </div>
                    </div>
                  </Popup>
                )}
              </MapGL>

              {/* Info Panel Left Overlay */}
              <div className="absolute top-6 left-6 w-64 bg-white/90 backdrop-blur border border-black p-4 shadow-hard pointer-events-none">
                <div className="text-[10px] font-mono text-gray-400 uppercase mb-2">
                  THÔNG TIN KHU VỰC
                </div>
                <div className="text-2xl font-black font-technical uppercase">
                  TRUNG TÂM CẦN THƠ
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-mono border-b border-gray-200 pb-1">
                    <span>TỔNG ĐIỂM</span>
                    <span className="font-bold">{places.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono border-b border-gray-200 pb-1">
                    <span>HIỂN THỊ</span>
                    <span className="font-bold">{filteredPlaces.length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono pb-1">
                    <span>TOẠ ĐỘ</span>
                    <span className="font-bold">
                      {viewState.latitude.toFixed(4)} /{" "}
                      {viewState.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 h-full overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="bg-white border border-black p-4 group hover:shadow-hard transition-all cursor-pointer"
                  >
                    <div className="h-32 bg-gray-200 mb-4 relative overflow-hidden">
                      {/* Image Placeholder */}
                      {place.images?.[0] ? (
                        <img
                          src={place.images[0].imageData || place.images[0]}
                          alt=""
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-mono text-xs uppercase">
                          KHÔNG CÓ TÍN HIỆU
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-black text-[10px] font-bold uppercase">
                        {place.status === "approved"
                          ? "ĐÃ DUYỆT"
                          : place.status}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm uppercase truncate mb-1">
                      {place.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono truncate mb-4">
                      {place.address}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                        <Heart className="h-3 w-3" />
                        {place.favoriteCount || 0}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] font-bold uppercase hover:bg-black hover:text-white rounded-none"
                      >
                        CHI TIẾT &rarr;
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Status Bar */}
        <div className="h-8 bg-black border-t border-white/20 flex items-center justify-between px-4 text-[10px] font-mono text-gray-400 uppercase">
          <div className="flex gap-4">
            <span>CHẾ ĐỘ: {viewMode === "map" ? "BẢN ĐỒ" : "DANH SÁCH"}</span>
            <span>
              BỘ LỌC: {selectedCategory === "all" ? "KHÔNG" : selectedCategory}
            </span>
          </div>
          <div className="flex gap-4">
            <span>ĐỒNG BỘ: TỰ ĐỘNG</span>
            <span className="text-primary">MẠNG: ỔN ĐỊNH</span>
          </div>
        </div>
      </div>
      {/* Detail Dialog */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <PlaceDetailDialog
          place={selectedPlace}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      </Suspense>
    </div>
  );
};

export default MapPage;
