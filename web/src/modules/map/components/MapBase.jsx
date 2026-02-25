import { forwardRef } from "react";
import { MapGL } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MAP_CONFIGS } from "../config/mapConfig";

const MapBase = forwardRef(({ children, className = "", ...props }, ref) => {
  const { viewState, setViewState, basemap } = useMapContext();
  const { BOUNDS, CONSTRAINTS } = MAP_CONFIGS;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapGL
        ref={ref}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={basemap}
        style={{ width: "100%", height: "100%" }}
        maxBounds={BOUNDS}
        minZoom={CONSTRAINTS.minZoom}
        maxZoom={CONSTRAINTS.maxZoom}
        maxPitch={CONSTRAINTS.maxPitch}
        dragRotate={CONSTRAINTS.dragRotate}
        pitchWithRotate={CONSTRAINTS.pitchWithRotate}
        {...props}
      >
        {children}
      </MapGL>
    </div>
  );
});

MapBase.displayName = "MapBase";

export default MapBase;
