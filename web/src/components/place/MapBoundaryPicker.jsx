import { useState, useEffect, useRef, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import { Marker } from "react-map-gl";
import { MapPin, Info, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * MAP BOUNDARY PICKER - Cần Thơ
 * 
 * Component chọn khu vực Cần Thơ (Quận/Phường) với:
 * - Click để chọn → Tô sáng + Pin đỏ → Lấy centroid từ API
 * - Hover để xem thông tin
 * - Feature-state cho highlight
 */

const STYLE_URL = "http://localhost:8081/api/boundaries/style";
const CAN_THO_CENTER = [105.7200532, 10.0345852]; // [lng, lat]

const MapBoundaryPicker = ({ onSelect, className }) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    latitude: CAN_THO_CENTER[1],
    longitude: CAN_THO_CENTER[0],
    zoom: 11,
  });

  const [selectedArea, setSelectedArea] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clear previous selection state
  const clearSelection = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !selectedArea) return;

    const source = selectedArea.isDistrict ? "cantho-districts" : "cantho-wards";
    
    map.removeFeatureState({
      source,
      id: selectedArea.featureId,
    });

    setSelectedArea(null);
    setMarkerPosition(null);
  }, [selectedArea]);

  // Handle map click
  const handleMapClick = useCallback(
    async (event) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      // Query features at click point
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["districts-circle", "wards-circle"],
      });

      if (features.length === 0) return;

      const feature = features[0];
      const isDistrict = feature.layer.id === "districts-circle";
      const properties = feature.properties;

      setLoading(true);
      
      // Clear old selection
      clearSelection();

      // Set feature state
      map.setFeatureState(
        {
          source: isDistrict ? "cantho-districts" : "cantho-wards",
          id: feature.id,
        },
        { selected: true }
      );

      try {
        // Fetch centroid từ API
        const apiUrl = isDistrict
          ? `/api/boundaries/districts/${properties.code}/center`
          : `/api/boundaries/wards/${feature.id}/center`;

        const response = await fetch(`http://localhost:8081${apiUrl}`);
        const data = await response.json();

        if (data.success) {
          const { latitude, longitude, name, districtName } = data.data;

          setMarkerPosition({ latitude, longitude });
          setSelectedArea({
            featureId: feature.id,
            isDistrict,
            name,
            districtName,
            latitude,
            longitude,
          });

          // Fly to location
          map.flyTo({
            center: [longitude, latitude],
            zoom: isDistrict ? 12 : 14,
            duration: 1000,
          });

          // Callback
          onSelect?.({
            districtId: isDistrict ? feature.id : properties.district_id,
            wardId: isDistrict ? null : feature.id,
            latitude,
            longitude,
            name,
            districtName: isDistrict ? name : districtName,
          });
        }
      } catch (error) {
        console.error("Failed to fetch centroid:", error);
      } finally {
        setLoading(false);
      }
    },
    [clearSelection, onSelect]
  );

  // Handle hover
  const handleMouseMove = useCallback((event) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: ["districts-circle", "wards-circle"],
    });

    if (features.length > 0) {
      const feature = features[0];
      map.getCanvas().style.cursor = "pointer";

      // Update hover state
      if (hoveredFeature && hoveredFeature.id !== feature.id) {
        map.setFeatureState(
          {
            source: hoveredFeature.source,
            id: hoveredFeature.id,
          },
          { hover: false }
        );
      }

      setHoveredFeature({
        id: feature.id,
        source: feature.layer.source,
        name: feature.properties.name,
      });

      map.setFeatureState(
        {
          source: feature.layer.source,
          id: feature.id,
        },
        { hover: true }
      );
    } else {
      map.getCanvas().style.cursor = "";
      
      if (hoveredFeature) {
        map.setFeatureState(
          {
            source: hoveredFeature.source,
            id: hoveredFeature.id,
          },
          { hover: false }
        );
        setHoveredFeature(null);
      }
    }
  }, [hoveredFeature]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Chọn khu vực Cần Thơ</h3>
          <p className="text-sm text-muted-foreground">
            Click vào quận/huyện hoặc phường/xã trên bản đồ
          </p>
        </div>
        {selectedArea && (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4 mr-2" />
            Xóa chọn
          </Button>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-300 shadow-2xl">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          mapStyle={STYLE_URL}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={["districts-circle", "wards-circle"]}
        >
          {/* Marker Pin */}
          {markerPosition && (
            <Marker
              latitude={markerPosition.latitude}
              longitude={markerPosition.longitude}
              anchor="bottom"
              style={{ zIndex: 9999 }}
            >
              <div className="relative z-[9999]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/20 rounded-full animate-ping" />
                <MapPin
                  className="h-12 w-12 text-red-500 drop-shadow-2xl relative z-[10000]"
                  fill="currentColor"
                  strokeWidth={2.5}
                />
              </div>
            </Marker>
          )}
        </Map>

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {selectedArea && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border max-w-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Info className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900">
                  {selectedArea.name}
                </h4>
                {!selectedArea.isDistrict && (
                  <p className="text-xs text-gray-600">
                    {selectedArea.districtName}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {selectedArea.latitude.toFixed(6)},{" "}
                  {selectedArea.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredFeature && !selectedArea && (
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <p className="text-sm text-white font-medium">
              {hoveredFeature.name}
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <div className="text-2xl">💡</div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-blue-900 mb-1">
            Hướng dẫn sử dụng
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>Click</strong> vào điểm tròn trên bản đồ để chọn khu vực</li>
            <li>• <strong>Hover</strong> để xem tên quận/phường</li>
            <li>• <strong>Zoom</strong> in để xem chi tiết phường/xã (từ zoom 12+)</li>
            <li>• Pin đỏ sẽ đánh dấu tâm khu vực đã chọn</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapBoundaryPicker;
