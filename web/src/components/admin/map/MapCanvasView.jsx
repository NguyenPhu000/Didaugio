import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  BoundaryLayer,
  PlaceMarkers,
  MapControls,
  MapBase,
} from "@/modules/map";
import DistrictLabels from "@/modules/map/components/DistrictLabels";
import WardLabels from "@/modules/map/components/WardLabels";
import MapListView from "./MapListView";

export const MapCanvasView = memo(
  ({
    viewMode,
    loading,
    error,
    retry,
    selectArea,
    canThoMask,
    districts,
    wards,
    filteredPlaces,
    selectedDistrictId,
    selectedDistrict,
    displayPlaces,
    handlePlaceFly,
  }) => {
    const { t } = useTranslation();

    if (viewMode === "list") {
      return (
        <MapListView places={displayPlaces} onPlaceClick={handlePlaceFly} />
      );
    }

    return (
      <div className="flex-1 relative overflow-hidden bg-[#F4F2EC]">
        {loading && (
          <div className="w-full h-full flex items-center justify-center bg-[#FAF9F5]">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                {t("admin.map.loading")}
              </p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF9F5] gap-3">
            <AlertTriangle className="h-10 w-10 text-rose-400 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-700">
              {t("admin.map.loadError")}
            </p>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-950 rounded-full hover:bg-black transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("admin.map.retry")}
            </button>
          </div>
        )}
        {!loading && !error && (
          <MapBase
            className="w-full h-full"
            onBoundaryClick={(f, type) => selectArea(f, type)}
          >
            <BoundaryLayer
              mask={canThoMask}
              districts={districts}
              wards={wards}
            />
            <PlaceMarkers />
            {districts && <DistrictLabels districts={districts} />}
            {wards && <WardLabels wards={wards} />}
            <MapControls />
          </MapBase>
        )}

        {/* Floating Pill on Map */}
        <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700 shadow-lg pointer-events-none">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span>
            <strong className="text-slate-950 font-bold font-mono tabular-nums">
              {filteredPlaces.length}
            </strong>{" "}
            {t("admin.map.places").toLowerCase()}
          </span>
          {selectedDistrictId && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-950 font-bold">
                {selectedDistrict?.properties?.name}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }
);

MapCanvasView.displayName = "MapCanvasView";
export default MapCanvasView;
