import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
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
  ShieldCheck,
  AlertTriangle,
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
import {
  findDistrictFeature,
  getDistrictSelectionState,
  getDistrictViewport,
} from "./placeMapDistrictGuard";

/**
 * MAP PICKER - CAN THO MODULE
 * Uses strict MapBase and MapProvider for consistency.
 */

// Inner Component to consume Context
const MapPickerInner = memo(({ latitude, longitude, onChange, error, districtId }) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  const lastRightClickRef = useRef(0);
  const lastValidMarkerRef = useRef(null);
  const { setViewState, selectArea } = useMapContext();
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
  const [selectionError, setSelectionError] = useState("");

  const selectedDistrictFeature = useMemo(
    () => findDistrictFeature(districts, districtId),
    [districts, districtId],
  );
  const selectedDistrictName = selectedDistrictFeature?.properties?.name ?? "";
  const districtViewport = useMemo(
    () => getDistrictViewport({ districts, districtId }),
    [districts, districtId],
  );
  const districtLockEnabled = Boolean(districtId && selectedDistrictFeature);

  useEffect(() => {
    lastValidMarkerRef.current = {
      latitude: Number(latitude) || CAN_THO_CENTER.lat,
      longitude: Number(longitude) || CAN_THO_CENTER.lng,
    };
  }, []);

  const updateLocation = useCallback(
    (lat, lng, options = {}) => {
      const { moveView = false } = options;
      const districtState = getDistrictSelectionState({
        districts,
        districtId,
        latitude: lat,
        longitude: lng,
      });

      if (districtState.locked && !districtState.inside) {
        const message = t("map.picker.outsideDistrict", {
          district: selectedDistrictName,
          defaultValue: selectedDistrictName
            ? `Chỉ được chọn vị trí trong ${selectedDistrictName}.`
            : "Chỉ được chọn vị trí trong quận/huyện đã chọn.",
        });
        setSelectionError(message);

        const lastValid = lastValidMarkerRef.current;
        if (lastValid) {
          setMarker(lastValid);
          setViewState((prev) => ({
            ...prev,
            latitude: lastValid.latitude,
            longitude: lastValid.longitude,
          }));
        }
        return false;
      }

      setSelectionError("");
      lastValidMarkerRef.current = { latitude: lat, longitude: lng };
      setMarker({ latitude: lat, longitude: lng });
      onChange?.(lat, lng);

      if (moveView) {
        setViewState((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          zoom: Math.max(prev.zoom || 0, 15),
        }));
      }

      return true;
    },
    [districtId, districts, onChange, selectedDistrictName, setViewState, t],
  );

  useEffect(() => {
    if (!selectedDistrictFeature) return;
    selectArea(
      {
        id: selectedDistrictFeature.properties?.id,
        properties: selectedDistrictFeature.properties,
      },
      "district",
    );
  }, [selectArea, selectedDistrictFeature]);

  useEffect(() => {
    if (!districtViewport) return;

    setViewState((prev) => ({
      ...prev,
      latitude: districtViewport.latitude,
      longitude: districtViewport.longitude,
      zoom: districtViewport.zoom,
    }));

    if (!latitude || !longitude) {
      updateLocation(districtViewport.latitude, districtViewport.longitude);
      return;
    }

    const districtState = getDistrictSelectionState({
      districts,
      districtId,
      latitude,
      longitude,
    });

    if (districtState.locked && !districtState.inside) {
      updateLocation(districtViewport.latitude, districtViewport.longitude);
    }
  }, [
    districtId,
    districtViewport,
    districts,
    latitude,
    longitude,
    setViewState,
    updateLocation,
  ]);

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
        const nextMarker = {
          latitude: Number(latitude),
          longitude: Number(longitude),
        };
        const districtState = getDistrictSelectionState({
          districts,
          districtId,
          ...nextMarker,
        });

        if (!districtState.locked || districtState.inside) {
          lastValidMarkerRef.current = nextMarker;
          setMarker(nextMarker);
        }
      });
      return () => cancelAnimationFrame(id);
    }
  }, [districtId, districts, latitude, longitude]);

  // Sync geolocation result to map when position updates
  useEffect(() => {
    if (geoLat != null && geoLng != null) {
      updateLocation(geoLat, geoLng, { moveView: true });
    }
  }, [geoLat, geoLng, updateLocation]);

  // Show geolocation error
  useEffect(() => {
    if (geoError) {
      alert(t("location.locationError", { message: geoError }));
    }
  }, [geoError]);

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
      updateLocation(lat, lng, { moveView: true });
    },
    [updateLocation],
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
    updateLocation(newMarker.latitude, newMarker.longitude, { moveView: true });
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-xl transition-all duration-500",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[650px]",
      )}
    >
      {/* MAP HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          {/* Title Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md">
            <div className="rounded-xl bg-zinc-950 p-2 text-white">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                {t("map.picker.selectLocation")}
              </p>
              <p className="text-xs text-zinc-500">
                {districtLockEnabled
                  ? t("map.picker.lockedDistrict", {
                      district: selectedDistrictName,
                      defaultValue: `Đang khóa theo ${selectedDistrictName}`,
                    })
                  : t("map.picker.noDistrictLock", {
                      defaultValue: "Chọn quận/huyện ở bước 1 để khóa vùng.",
                    })}
              </p>
            </div>
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
              className="h-10 rounded-full border border-zinc-200 bg-white/95 px-4 font-medium text-zinc-950 shadow-sm backdrop-blur-md hover:bg-zinc-50"
            >
              <Locate className="mr-2 h-4 w-4" />
              {geoLoading ? t("location.gettingLocation") : t("map.picker.myLocation")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-10 w-10 rounded-full border border-zinc-200 bg-white/95 shadow-sm backdrop-blur-md"
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
            <div className="absolute -bottom-1 left-1/2 h-8 w-8 -translate-x-1/2 animate-ping rounded-full bg-black/20" />

            {/* Marker Body */}
            <div
              className={cn(
                "relative flex flex-col items-center transition-transform duration-300",
                isDragging ? "scale-110 -translate-y-4" : "hover:scale-105",
              )}
            >
              <div className="rotate-45 transform rounded-xl border-2 border-white bg-black p-2.5 text-white shadow-xl shadow-black/25">
                <Crosshair className="h-5 w-5 -rotate-45" />
              </div>
              <div className="mt-1 h-3 w-1 rounded-full bg-black/80"></div>
              <div className="mt-0.5 h-1 w-4 rounded-full bg-black/20 blur-sm"></div>
            </div>

            {/* Tooltip */}
            <div
              className={cn(
                "absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-950 px-2.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition-all pointer-events-none group-hover:opacity-100",
                isDragging && "opacity-100 translate-y-1",
              )}
            >
              {isDragging ? t("map.picker.dropToSelect") : t("map.picker.dragToMove")}
              <div className="absolute bottom-[-4px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-zinc-950"></div>
            </div>
          </div>
        </Marker>
      </MapBase>

      {/* FLOATING SIDE PANEL (Right) */}
      <div className="pointer-events-none absolute right-4 top-24 z-20 flex w-72 flex-col gap-3">
        {districtLockEnabled && (
          <Card className="pointer-events-auto rounded-2xl border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-zinc-950 p-2 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  {selectedDistrictName}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                  {t("map.picker.districtLockHint", {
                    defaultValue:
                      "Điểm đánh dấu chỉ được đặt bên trong quận/huyện này.",
                  })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Coordinates Card */}
        <Card className="pointer-events-auto rounded-2xl border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all hover:shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-black">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t("map.picker.selectedCoords")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2">
              <span className="text-xs font-medium text-zinc-500">Lat</span>
              <span className="font-mono text-sm font-bold text-zinc-800">
                {Number(marker.latitude).toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-2">
              <span className="text-xs font-medium text-zinc-500">Lng</span>
              <span className="font-mono text-sm font-bold text-zinc-800">
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
            className="group h-12 w-full justify-between rounded-xl border border-zinc-200 bg-white/95 px-4 shadow-lg backdrop-blur-sm hover:bg-zinc-50"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-black transition-colors" />
              <span className="text-sm font-medium text-zinc-700">
                {t("map.picker.manualInput")}
              </span>
            </div>
            {showManualInput ? (
              <Check className="h-4 w-4 text-black" />
            ) : (
              <span className="text-xs text-zinc-400">Tắt</span>
            )}
          </Button>

          {showManualInput && (
            <Card className="animate-in mt-2 rounded-2xl border-zinc-200 bg-white/95 p-4 shadow-xl backdrop-blur-md slide-in-from-top-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Latitude</Label>
                  <Input
                    type="number"
                    value={marker.latitude}
                    onChange={(e) =>
                      handleManualChange("latitude", e.target.value)
                    }
                    className="h-9 border-zinc-200 bg-zinc-50 font-mono text-xs focus:border-black"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Longitude</Label>
                  <Input
                    type="number"
                    value={marker.longitude}
                    onChange={(e) =>
                      handleManualChange("longitude", e.target.value)
                    }
                    className="h-9 border-zinc-200 bg-zinc-50 font-mono text-xs focus:border-black"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* BOTTOM LEFT INFO */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
        <div className="pointer-events-auto max-w-xs rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-xl bg-zinc-100 p-2 text-black">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">{t("map.picker.quickTip")}</h4>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {t("map.picker.tipText")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR OVERLAY */}
      {(error || selectionError) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 rounded-full bg-black px-6 py-3 font-medium text-white shadow-2xl">
            <div className="rounded-full bg-white/15 p-1">
              <AlertTriangle className="h-4 w-4" />
            </div>
            {selectionError || error}
          </div>
        </div>
      )}

      {/* DRAGGING OVERLAY */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black/10">
          <div className="animate-pulse rounded-full bg-black px-6 py-2 font-bold text-white shadow-2xl">
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
