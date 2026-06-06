import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MapView } from "@/modules/map";
import * as turf from "@turf/turf";

const MapBoundaryPicker = ({ onSelect, className }) => {
  const { t } = useTranslation();
  const [selectedInfo, setSelectedInfo] = useState(null);

  const handleAreaSelect = useCallback(
    (feature, type) => {
      if (!feature) return;

      // Calculate centroid client-side using Turf
      // feature is a GeoJSON feature
      try {
        const centroid = turf.centroid(feature);
        const [longitude, latitude] = centroid.geometry.coordinates;

        const info = {
          name: feature.properties.name,
          type,
          latitude,
          longitude,
          // Mocking districtName if it's a ward (usually available in properties if joined,
          // but existing GeoJSON might just have district_id.
          // For now, let's assume properties has what we need or simplistic display)
          districtName: feature.properties.district_name || "",
          featureId: feature.id,
        };

        setSelectedInfo(info);

        onSelect?.({
          districtId:
            type === "district" ? feature.id : feature.properties.district_id,
          wardId: type === "ward" ? feature.id : null,
          latitude,
          longitude,
          name: info.name,
          districtName: info.districtName,
        });
      } catch (err) {
        console.error("Error calculating centroid:", err);
      }
    },
    [onSelect],
  );

  const clearSelection = () => {
    setSelectedInfo(null);
    // Note: CanThoMap doesn't currently expose a "clearSelection" method imperatively
    // unless we access context. But for visual feedback,
    // the internal selection state in MapContext acts on user click.
    // If we want to clear it from here, we might need to recreate the map component
    // or extend CanThoMap to accept a "selectedId" prop.
    // For now, local state clear is enough for the picker UI.
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("map.boundaryPicker.selectArea")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("map.boundaryPicker.instructions")}
            độ
          </p>
        </div>
        {selectedInfo && (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4 mr-2" />
            {t("map.boundaryPicker.clearSelection")}
          </Button>
        )}
      </div>

      {/* Map Container - Reusing CanThoMap */}
      <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border shadow-sm">
        <MapView
          showMarkers={false}
          interactive={true}
          onSelectArea={handleAreaSelect}
        />

        {/* Info Overlay */}
        {selectedInfo && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border max-w-xs z-50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-foreground">
                  {selectedInfo.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {selectedInfo.latitude.toFixed(6)},{" "}
                  {selectedInfo.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="text-xl">💡</div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary mb-1">
            {t("map.boundaryPicker.usageGuide")}
          </h4>
          <ul className="text-xs text-primary/80 space-y-1">
            <li>
              • <strong>Click</strong> vào vùng bản đồ để chọn Quận/Huyện
            </li>
            <li>
              • <strong>Zoom</strong> vào để xem và chọn Phường/Xã
            </li>
            <li>• Hệ thống sẽ tự động tính toán tọa độ trung tâm (Centroid)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MapBoundaryPicker;
