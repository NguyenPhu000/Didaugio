import { forwardRef, useRef, useCallback } from "react";
import { MapGL } from "../adapters";
import { useMapContext } from "../context/MapProvider";
import { MAP_CONFIGS } from "../config/mapConfig";

/**
 * After every style load (initial + basemap switch), hide any symbol layer
 * that renders a POI icon-image. Road-name labels (text-only) are kept.
 */
function hidePOIIconLayers(map) {
  const style = map.getStyle();
  if (!style?.layers) return;
  style.layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout?.["icon-image"]) {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // layer may not exist yet – safe to ignore
      }
    }
  });
}

const MapBase = forwardRef(({ children, className = "", ...props }, ref) => {
  const { viewState, setViewState, basemap } = useMapContext();
  const { BOUNDS, CONSTRAINTS } = MAP_CONFIGS;
  const internalRef = useRef(null);

  const handleLoad = useCallback((evt) => {
    hidePOIIconLayers(evt.target);
  }, []);

  // Re-run whenever the style is swapped at runtime
  const handleStyleData = useCallback((evt) => {
    hidePOIIconLayers(evt.target);
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapGL
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
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
        onLoad={handleLoad}
        onStyleData={handleStyleData}
        {...props}
      >
        {children}
      </MapGL>
    </div>
  );
});

MapBase.displayName = "MapBase";

export default MapBase;
