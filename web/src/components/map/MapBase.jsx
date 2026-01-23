import { forwardRef } from "react";
import Map from "react-map-gl/maplibre";
import { useMapContext } from "@/providers";
import { MAP_CONFIGS, DEFAULT_MAP_STYLE } from "@/constants/mapConfigs";
import "maplibre-gl/dist/maplibre-gl.css";

const MapBase = forwardRef(({ children, className, ...props }, ref) => {
  const { viewState, setViewState } = useMapContext();
  
  // Allow props to override viewState control if needed (e.g. controlled mode), 
  // but context is primary. 
  // Actually, props passed to Map override context if conflict? 
  // Let's pass ...props AFTER viewState to allow override? 
  // No, viewState in context is the source of truth for the base map.
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
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
      </Map>
    </div>
  );
});

MapBase.displayName = "MapBase";

export default MapBase;
