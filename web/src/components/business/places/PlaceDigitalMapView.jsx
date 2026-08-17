import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, MapPin, X, Navigation2, Maximize2, Minimize2, Star } from "lucide-react";
import {
  useMapContext,
  MapBase,
  BoundaryLayer,
  PlaceMarkers,
  MapControls,
} from "@/modules/map";
import DistrictLabels from "@/modules/map/components/DistrictLabels";
import WardLabels from "@/modules/map/components/WardLabels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { STATUS_CONFIGS, getImageSrc } from "./placesConstants";

export const PlaceDigitalMapView = ({ places, onPlaceSelect }) => {
  const { t } = useTranslation();
  const { flyTo, setOnSelectPlace, setPlaces, setFilteredPlaces } = useMapContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (places.length > 0) {
      setPlaces(places);
      setFilteredPlaces(places);
    }
  }, [places, setPlaces, setFilteredPlaces]);

  useEffect(() => {
    setOnSelectPlace((place) => {
      onPlaceSelect(place);
      if (place.latitude && place.longitude) {
        flyTo({ lat: Number(place.latitude), lng: Number(place.longitude) }, 16);
      }
    });
    return () => setOnSelectPlace(null);
  }, [setOnSelectPlace, onPlaceSelect, flyTo]);

  useEffect(() => {
    const placeWithCoords = places.find((p) => p.latitude && p.longitude);
    if (placeWithCoords) {
      const timer = setTimeout(() => {
        flyTo({ lat: Number(placeWithCoords.latitude), lng: Number(placeWithCoords.longitude) }, 13);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [places.length]);

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)
    );
  }, [places, searchQuery]);

  return (
    <div ref={containerRef} className="relative h-[650px] rounded-[36px] overflow-hidden border border-slate-200/80 dark:border-border/80 shadow-md bg-white dark:bg-card flex">
      {/* Sidebar List */}
      {sidebarOpen && (
        <aside className="w-80 border-r border-slate-200/80 dark:border-border/80 bg-white/95 dark:bg-card/95 backdrop-blur-md flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-slate-200/80 dark:border-border/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cơ sở trên bản đồ ({filteredPlaces.length})
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-muted flex items-center justify-center text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm cơ sở..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-muted border-none focus:outline-hidden focus:ring-1 focus:ring-slate-950 font-medium"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {filteredPlaces.map((p) => {
                const config = STATUS_CONFIGS[p.status] || STATUS_CONFIGS.draft;
                const hasCoords = p.latitude && p.longitude;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onPlaceSelect(p);
                      if (hasCoords) {
                        flyTo({ lat: Number(p.latitude), lng: Number(p.longitude) }, 16);
                      }
                    }}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {p.name}
                      </span>
                      <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{p.address || "Cần Thơ"}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </aside>
      )}

      {/* Map Canvas */}
      <div className="flex-1 relative h-full">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 px-3.5 py-2 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-md shadow-md text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border border-slate-200/80"
          >
            <MapPin className="w-3.5 h-3.5" /> Hiện danh sách cơ sở
          </button>
        )}

        <MapBase>
          <BoundaryLayer />
          <DistrictLabels />
          <WardLabels />
          <PlaceMarkers />
          <MapControls position="top-right" showCompass showZoom />
        </MapBase>
      </div>
    </div>
  );
};

export default PlaceDigitalMapView;
