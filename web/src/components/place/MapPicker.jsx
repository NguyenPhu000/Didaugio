import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  MapPin,
  Locate,
  Maximize2,
  Minimize2,
  Settings,
  Info,
  Check,
  Navigation,
  Crosshair,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input, Button, Label, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import useGeolocation from "@/hooks/useGeolocation";
import {
  Marker,
  NavigationControl,
  MapProvider,
  useMapContext,
  MapBase,
  BoundaryLayer,
  useMapData,
  CAN_THO_CENTER,
} from "@/modules/map";

/**
 * MAP PICKER - CAN THO MODULE
 * Uses strict MapBase and MapProvider for consistency.
 */

// Inner Component to consume Context
const MapPickerInner = memo(({ latitude, longitude, onChange, error }) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  const lastRightClickRef = useRef(0);
  const { setViewState } = useMapContext();
  const { districts, wards, canThoMask } = useMapData();
  const {
    latitude: geoLat,
    longitude: geoLng,
    locateNow: geoLocate,
    loading: geoLoading,
    error: geoError,
  } = useGeolocation();

  // Local state for UI only (marker position)
  const [marker, setMarker] = useState(() => ({
    latitude: Number(latitude) || CAN_THO_CENTER.lat,
    longitude: Number(longitude) || CAN_THO_CENTER.lng,
  }));

  const [showManualInput, setShowManualInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initial Sync ViewState (Only once on mount if not set)
  useEffect(() => {
    if (
      latitude &&
      longitude &&
      (latitude !== CAN_THO_CENTER.lat || longitude !== CAN_THO_CENTER.lng)
    ) {
      setViewState((prev) => ({
        ...prev,
        latitude,
        longitude,
        zoom: 15,
      }));
    }
  }, [latitude, longitude, setViewState]);

  // Sync props to state (Marker only)
  useEffect(() => {
    if (latitude && longitude) {
      const id = requestAnimationFrame(() => {
        setMarker({ latitude: Number(latitude), longitude: Number(longitude) });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [latitude, longitude]);

  // Sync geolocation result to map when position updates
  useEffect(() => {
    if (geoLat != null && geoLng != null) {
      updateLocation(geoLat, geoLng);
      setViewState((prev) => ({
        ...prev,
        latitude: geoLat,
        longitude: geoLng,
        zoom: 16,
      }));
    }
  }, [geoLat, geoLng]);

  // Show geolocation error
  useEffect(() => {
    if (geoError) {
      alert(t("location.locationError", { message: geoError }));
    }
  }, [geoError]);

  const updateLocation = useCallback(
    (lat, lng) => {
      setMarker({ latitude: lat, longitude: lng });
      onChange?.(lat, lng);
    },
    [onChange],
  );

  const onMarkerDragStart = useCallback(() => setIsDragging(true), []);
  const onMarkerDrag = useCallback((event) => {
    setMarker({
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng,
    });
  }, []);
  const onMarkerDragEnd = useCallback(
    (event) => {
      setIsDragging(false);
      updateLocation(event.lngLat.lat, event.lngLat.lng);
    },
    [updateLocation],
  );

  const onMapClick = useCallback(
    (event) => {
      updateLocation(event.lngLat.lat, event.lngLat.lng);
    },
    [updateLocation],
  );

  const onMapRightDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      const now = Date.now();
      const isSecondClick = now - lastRightClickRef.current < 600;
      lastRightClickRef.current = now;
      if (!isSecondClick) return;

      const { lat, lng } = event.lngLat;
      updateLocation(lat, lng);
      setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    },
    [updateLocation, setViewState],
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t("location.notSupported"));
      return;
    }
    geoLocate();
  };

  const handleManualChange = (field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    const newMarker = { ...marker, [field]: numValue };
    setMarker(newMarker);
    setViewState((prev) => ({
      ...prev,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
    }));
    onChange(newMarker.latitude, newMarker.longitude);
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50 transition-all duration-500",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[650px]",
      )}
    >
      {/* MAP HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Title Pill */}
          <div className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-100 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-full">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">
              {t("map.picker.selectLocation")}
            </span>
            {error && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {t("map.picker.notSelected")}
              </Badge>
            )}
          </div>

          {/* Top Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUseCurrentLocation}
              className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-white text-primary font-medium rounded-full h-10 px-4"
            >
              <Locate className="mr-2 h-4 w-4" />
              {geoLoading ? t("location.gettingLocation") : t("map.picker.myLocation")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white/90 backdrop-blur-md shadow-sm border border-slate-100 rounded-full h-10 w-10"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <MapBase
        ref={mapRef}
        onClick={onMapClick}
        onContextMenu={onMapRightDoubleClick}
        interactive={true}
        className="w-full h-full"
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Render Boundaries for Visual Context */}
        <BoundaryLayer mask={canThoMask} districts={districts} wards={wards} />

        {/* CUSTOM MARKER */}
        <Marker
          latitude={marker.latitude}
          longitude={marker.longitude}
          anchor="bottom"
          draggable
          onDragStart={onMarkerDragStart}
          onDrag={onMarkerDrag}
          onDragEnd={onMarkerDragEnd}
        >
          <div className="relative group cursor-grab active:cursor-grabbing -translate-y-1">
            {/* Ping animation */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary/30 rounded-full animate-ping" />

            {/* Marker Body */}
            <div
              className={cn(
                "relative flex flex-col items-center transition-transform duration-300",
                isDragging ? "scale-110 -translate-y-4" : "hover:scale-105",
              )}
            >
              <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-xl shadow-primary/40 transform rotate-45 border-2 border-white">
                <Crosshair className="h-5 w-5 -rotate-45" />
              </div>
              <div className="w-1 h-3 bg-primary/80 rounded-full mt-1"></div>
              <div className="w-4 h-1 g-black/20 blur-sm rounded-full mt-0.5"></div>
            </div>

            {/* Tooltip */}
            <div
              className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none",
                isDragging && "opacity-100 translate-y-1",
              )}
            >
              {isDragging ? t("map.picker.dropToSelect") : t("map.picker.dragToMove")}
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-800"></div>
            </div>
          </div>
        </Marker>
      </MapBase>

      {/* FLOATING SIDE PANEL (Right) */}
      <div className="absolute top-20 right-4 w-72 z-20 flex flex-col gap-3 pointer-events-none">
        {/* Coordinates Card */}
        <Card className="p-4 bg-white/95 backdrop-blur-md border-slate-100 shadow-xl rounded-2xl pointer-events-auto transition-all hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("map.picker.selectedCoords")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Lat</span>
              <span className="text-sm font-mono font-bold text-slate-700">
                {Number(marker.latitude).toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Lng</span>
              <span className="text-sm font-mono font-bold text-slate-700">
                {Number(marker.longitude).toFixed(6)}
              </span>
            </div>
          </div>
        </Card>

        {/* Manual Input Toggle Card */}
        <div className="pointer-events-auto">
          <Button
            variant="ghost"
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-full justify-between bg-white/90 backdrop-blur-sm shadow-lg border border-slate-100 rounded-xl hover:bg-white h-12 px-4 group"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-slate-600">
                {t("map.picker.manualInput")}
              </span>
            </div>
            {showManualInput ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <span className="text-xs text-slate-400">Tắt</span>
            )}
          </Button>

          {showManualInput && (
            <Card className="mt-2 p-4 bg-white/95 backdrop-blur-md border-slate-100 shadow-xl rounded-2xl animate-in slide-in-from-top-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Latitude</Label>
                  <Input
                    type="number"
                    value={marker.latitude}
                    onChange={(e) =>
                      handleManualChange("latitude", e.target.value)
                    }
                    className="h-9 bg-slate-50 border-slate-200 focus:border-primary font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Longitude</Label>
                  <Input
                    type="number"
                    value={marker.longitude}
                    onChange={(e) =>
                      handleManualChange("longitude", e.target.value)
                    }
                    className="h-9 bg-slate-50 border-slate-200 focus:border-primary font-mono text-xs"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* BOTTOM LEFT INFO */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-2xl p-4 max-w-xs pointer-events-auto">
          <div className="flex items-start gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 mt-1">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{t("map.picker.quickTip")}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {t("map.picker.tipText")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR OVERLAY */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-medium">
            <div className="p-1 bg-white/20 rounded-full">
              <Info className="h-4 w-4" />
            </div>
            {error}
          </div>
        </div>
      )}

      {/* DRAGGING OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 z-0 bg-primary/10 pointer-events-none flex items-center justify-center">
          <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full shadow-2xl font-bold animate-pulse">
            {t("map.picker.dropToSet")}
          </div>
        </div>
      )}
    </div>
  );
});

// Wrapper to provide MapContext
const MapPicker = (props) => (
  <MapProvider>
    <MapPickerInner {...props} />
  </MapProvider>
);

MapPicker.displayName = "MapPicker";

export default MapPicker;
