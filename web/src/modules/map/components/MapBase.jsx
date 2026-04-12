import { forwardRef, useCallback, useRef } from "react";
import { MapGL } from "../adapters";
import { useMapContext } from "../hooks/useMapContext";
import { MAP_CONFIGS, LAYER_IDS } from "../config/mapConfig";

const INTERACTIVE_LAYERS = [
  LAYER_IDS.DISTRICT_FILL,
  LAYER_IDS.WARD_FILL,
  LAYER_IDS.WARD_LINE,
];

function hidePOIIconLayers(map) {
  const style = map.getStyle();
  if (!style?.layers) return;
  style.layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout?.["icon-image"]) {
      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch {
        // layer may not exist yet
      }
    }
  });
}

const MapBase = forwardRef(
  ({ children, className = "", onBoundaryClick, ...props }, ref) => {
    const { viewState, setViewState, basemap, setHoveredFeature, mapRef } =
      useMapContext();
    const { BOUNDS, CONSTRAINTS } = MAP_CONFIGS;

    /**
     * Track the previously hovered feature so we can clear its feature-state.
     * Using a ref so the handler doesn't need to be recreated on every change.
     */
    const prevHoveredRef = useRef({ id: null, source: null });

    const handleLoad = useCallback((evt) => {
      hidePOIIconLayers(evt.target);
    }, []);

    const handleStyleData = useCallback((evt) => {
      hidePOIIconLayers(evt.target);
    }, []);

    const handleClick = useCallback(
      (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const type = feature.layer.id.includes("ward") ? "ward" : "district";
        onBoundaryClick?.(feature, type);
      },
      [onBoundaryClick],
    );

    const handleMouseMove = useCallback(
      (e) => {
        const feature = e.features?.[0];
        const map = e.target;
        const prev = prevHoveredRef.current;

        // ── Clear previous hover state (directly on GPU, no React re-render) ──
        if (prev.id !== null) {
          try {
            map.setFeatureState(
              { source: prev.source, id: prev.id },
              { hover: false },
            );
          } catch {
            // Ignore invalid feature-state transitions on stale features.
          }
        }

        if (feature) {
          const source = feature.source; // 'districts-source' | 'wards-source'
          try {
            map.setFeatureState({ source, id: feature.id }, { hover: true });
          } catch {
            // Ignore invalid feature-state transitions on stale features.
          }
          prevHoveredRef.current = { id: feature.id, source };
          map.getCanvas().style.cursor = "pointer";

          // Update React state only when the feature identity changes —
          // this is for sidebar / other consumers, not for re-painting layers
          const newId = feature.properties?.id ?? null;
          setHoveredFeature((prev) => {
            const prevId = prev?.properties?.id ?? null;
            if (prevId === newId) return prev;
            return { id: feature.id, properties: feature.properties };
          });
        } else {
          prevHoveredRef.current = { id: null, source: null };
          map.getCanvas().style.cursor = "";
          setHoveredFeature(null);
        }
      },
      [setHoveredFeature],
    );

    const handleMouseLeave = useCallback(
      (e) => {
        const prev = prevHoveredRef.current;
        if (prev.id !== null) {
          try {
            e.target.setFeatureState(
              { source: prev.source, id: prev.id },
              { hover: false },
            );
          } catch {
            // Ignore invalid feature-state transitions on stale features.
          }
          prevHoveredRef.current = { id: null, source: null };
        }
        e.target.getCanvas().style.cursor = "";
        setHoveredFeature(null);
      },
      [setHoveredFeature],
    );

    return (
      <div className={`relative w-full h-full ${className}`}>
        <MapGL
          ref={(node) => {
            mapRef.current = node;
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
          interactiveLayerIds={INTERACTIVE_LAYERS}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onLoad={handleLoad}
          onStyleData={handleStyleData}
          {...props}
        >
          {children}
        </MapGL>
      </div>
    );
  },
);

MapBase.displayName = "MapBase";

export default MapBase;
