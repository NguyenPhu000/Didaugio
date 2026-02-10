import { forwardRef } from "react";
import { MapGL } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MAP_CONFIGS, DEFAULT_MAP_STYLE } from "../config/mapConfig";

const MapBase = forwardRef(({ children, className = "", ...props }, ref) => {
  const { viewState, setViewState } = useMapContext();

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapGL
        ref={ref}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={DEFAULT_MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        maxBounds={MAP_CONFIGS.BOUNDS}
        minZoom={MAP_CONFIGS.CONSTRAINTS.minZoom}
        maxZoom={MAP_CONFIGS.CONSTRAINTS.maxZoom}
        dragRotate={MAP_CONFIGS.CONSTRAINTS.dragRotate}
        {...props}
      >
        {children}
      </MapGL>
    </div>
  );
});

MapBase.displayName = "MapBase";

export default MapBase;
