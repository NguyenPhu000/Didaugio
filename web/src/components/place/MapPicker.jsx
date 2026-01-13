import { useState, useEffect, useRef, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import { Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Locate, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";

/**
 * MAP PICKER with MapLibre GL JS
 * Sử dụng OpenStreetMap tiles miễn phí
 * Custom style theo màu sắc dự án "Đi Đâu Giờ"
 */

// Custom MapLibre style với màu sắc dự án
const MAP_STYLE = {
  version: 8,
  name: "Đi Đâu Giờ - Custom Style",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

const MapPicker = ({ latitude, longitude, onChange, error }) => {
  const mapRef = useRef();
  const lastRightClickRef = useRef(0);
  const [viewState, setViewState] = useState({
    latitude: latitude || CAN_THO_CENTER.lat,
    longitude: longitude || CAN_THO_CENTER.lng,
    zoom: 15,
  });

  const [marker, setMarker] = useState({
    latitude: latitude || CAN_THO_CENTER.lat,
    longitude: longitude || CAN_THO_CENTER.lng,
  });

  const [manualInput, setManualInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Update marker khi props thay đổi
  useEffect(() => {
    if (latitude && longitude) {
      setMarker({ latitude, longitude });
      setViewState((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));
    }
  }, [latitude, longitude]);

  // Handle marker drag
  const onMarkerDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onMarkerDrag = useCallback((event) => {
    setMarker({
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng,
    });
  }, []);

  const onMarkerDragEnd = useCallback(
    (event) => {
      setIsDragging(false);
      const newLat = event.lngLat.lat;
      const newLng = event.lngLat.lng;
      setMarker({ latitude: newLat, longitude: newLng });
      onChange(newLat, newLng);
    },
    [onChange]
  );

  // Handle map click to place marker
  const onMapClick = useCallback(
    (event) => {
      const newLat = event.lngLat.lat;
      const newLng = event.lngLat.lng;
      setMarker({ latitude: newLat, longitude: newLng });
      onChange(newLat, newLng);
    },
    [onChange]
  );

  // Handle double right-click to place marker
  const onMapRightDoubleClick = useCallback(
    (event) => {
      event.preventDefault();
      const now = Date.now();
      const isSecondClick = now - lastRightClickRef.current < 600;
      lastRightClickRef.current = now;

      if (!isSecondClick) return;

      const newLat = event.lngLat.lat;
      const newLng = event.lngLat.lng;
      setMarker({ latitude: newLat, longitude: newLng });
      setViewState((prev) => ({
        ...prev,
        latitude: newLat,
        longitude: newLng,
      }));
      onChange(newLat, newLng);
    },
    [onChange]
  );

  // Use current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setMarker({ latitude: newLat, longitude: newLng });
          setViewState((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
            zoom: 16,
          }));
          onChange(newLat, newLng);
        },
        (error) => {
          alert("Không thể lấy vị trí hiện tại: " + error.message);
        }
      );
    } else {
      alert("Trình duyệt không hỗ trợ Geolocation");
    }
  };

  // Manual coordinate input
  const handleManualChange = (field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newMarker = {
      ...marker,
      [field === "lat" ? "latitude" : "longitude"]: numValue,
    };
    setMarker(newMarker);
    setViewState((prev) => ({
      ...prev,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
    }));
    onChange(newMarker.latitude, newMarker.longitude);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <Label className="text-base font-semibold">
            Vị trí trên bản đồ <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Kéo thả marker, click trái, hoặc nhấp chuột phải 2 lần để đặt vị trí
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleUseCurrentLocation}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Locate className="mr-2 h-4 w-4" />
          Vị trí của tôi
        </Button>
      </div>

      {/* MapLibre GL JS Map */}
      <div
        className={cn(
          "relative w-full h-[600px] rounded-xl overflow-hidden border-2 shadow-2xl transition-all",
          error ? "border-red-500 ring-2 ring-red-200" : "border-gray-300",
          isDragging && "cursor-grabbing scale-[0.99]"
        )}
      >
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={onMapClick}
          onContextMenu={onMapRightDoubleClick}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
          attributionControl={true}
        >
          {/* Navigation Controls */}
          <NavigationControl position="top-right" />

          {/* Geolocate Control */}
          <GeolocateControl
            position="top-right"
            trackUserLocation
            onGeolocate={(e) => {
              const newLat = e.coords.latitude;
              const newLng = e.coords.longitude;
              setMarker({ latitude: newLat, longitude: newLng });
              onChange(newLat, newLng);
            }}
          />

          {/* Draggable Marker - Enhanced */}
          <Marker
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
            draggable
            onDragStart={onMarkerDragStart}
            onDrag={onMarkerDrag}
            onDragEnd={onMarkerDragEnd}
          >
            <div className="relative group cursor-grab active:cursor-grabbing">
              {/* Ripple effect khi idle */}
              {!isDragging && (
                <>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/20 rounded-full animate-ping" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-500/30 rounded-full animate-pulse" />
                </>
              )}

              {/* Marker Icon */}
              <div className="relative z-10">
                <MapPin
                  className={cn(
                    "h-14 w-14 text-red-500 transition-all duration-200 filter",
                    isDragging
                      ? "scale-125 drop-shadow-2xl brightness-110"
                      : "scale-100 drop-shadow-xl group-hover:scale-110 group-hover:brightness-110"
                  )}
                  fill="currentColor"
                  strokeWidth={2.5}
                />
                {/* Dot ở giữa */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-red-600" />
              </div>

              {/* Shadow động */}
              <div
                className={cn(
                  "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full blur-lg transition-all",
                  isDragging
                    ? "w-10 h-10 bg-red-500/60"
                    : "w-6 h-6 bg-red-500/40 group-hover:w-8 group-hover:h-8"
                )}
              />

              {/* Label "Kéo tôi" luôn hiện */}
              <div
                className={cn(
                  "absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200",
                  isDragging ? "opacity-0 scale-0" : "opacity-100 scale-100"
                )}
              >
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border-2 border-white animate-bounce">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Kéo tôi
                </div>
                {/* Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
              </div>
            </div>
          </Marker>
        </Map>

        {/* Coordinates Display - Improved */}
        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-white/20">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                Tọa độ
              </div>
              <div className="font-mono font-bold text-sm">
                {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="text-gray-500">Zoom:</div>
            <div className="font-bold text-emerald-600">
              {viewState.zoom.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Dragging Indicator */}
        {isDragging && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl text-base font-bold animate-pulse border-2 border-white z-20">
            ✋ Kéo thả để chọn vị trí chính xác
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-lg">
          <div className="text-red-500 text-lg">⚠️</div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Manual Input Toggle */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setManualInput(!manualInput)}
          className="w-full border-2 hover:bg-gray-50 transition-colors"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          {manualInput ? "Ẩn" : "Hiện"} nhập tọa độ thủ công
        </Button>

        {manualInput && (
          <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl shadow-inner">
            <div className="space-y-2">
              <Label
                htmlFor="latitude"
                className="text-xs font-semibold text-gray-700 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Latitude (Vĩ độ)
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={marker.latitude}
                onChange={(e) => handleManualChange("lat", e.target.value)}
                placeholder="10.0345852"
                className="font-mono text-sm bg-white border-2 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500">Ví dụ: 10.0345852</p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="longitude"
                className="text-xs font-semibold text-gray-700 flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Longitude (Kinh độ)
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={marker.longitude}
                onChange={(e) => handleManualChange("lng", e.target.value)}
                placeholder="105.7200532"
                className="font-mono text-sm bg-white border-2 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">Ví dụ: 105.7200532</p>
            </div>
            <div className="col-span-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
              <div className="text-amber-600 text-base">💡</div>
              <p className="text-xs text-amber-800">
                <strong>Mẹo:</strong> Bạn có thể copy tọa độ từ Google Maps bằng
                cách nhấp chuột phải vào địa điểm và chọn tọa độ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quick Tips */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
          <div className="bg-blue-500 text-white p-2 rounded-lg text-xl">
            🎯
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">
              Chọn vị trí chính xác
            </h4>
            <p className="text-xs text-blue-700">
              Zoom vào bản đồ để xác định vị trí chi tiết. Kéo thả marker đỏ để
              điều chỉnh.
            </p>
          </div>
        </div>

        {/* Current Location */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl">
          <div className="bg-emerald-500 text-white p-2 rounded-lg text-xl">
            📍
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 mb-1">
              Định vị tự động
            </h4>
            <p className="text-xs text-emerald-700">
              Nhấn nút "Vị trí của tôi" để tự động xác định vị trí hiện tại của
              bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Map Stats */}
      <div className="flex items-center justify-center gap-6 p-3 bg-gray-50 border rounded-lg text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Bản đồ OpenStreetMap</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Miễn phí 100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span>Cập nhật thường xuyên</span>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
