/**
 * MAP MODULE — PUBLIC API
 *
 * Usage:
 *   import { MapView, MapBase, useMapData, MAP_CONFIGS } from "@/modules/map";
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────┐
 *   │  MapView (full map with data + boundaries)   │
 *   │  ├── MapBase (core map wrapper)              │
 *   │  ├── BoundaryLayer (GeoJSON overlays)        │
 *   │  ├── PlaceMarkers (place pins + popups)      │
 *   │  └── MapControls (nav/scale/locate)          │
 *   ├── useMapData (API → GeoJSON)                 │
 *   ├── MapProvider / useMapContext (state mgmt)    │
 *   └── Adapter (MapLibre — swappable)             │
 *   └─────────────────────────────────────────────┘
 *
 * To swap map engine:
 *   1. Create adapters/NewEngineAdapter.js
 *   2. Update adapters/index.js to re-export it
 */

export { default as MapView } from "./components/MapView";
export { default as MapBase } from "./components/MapBase";
export { default as BoundaryLayer } from "./components/BoundaryLayer";
export { default as PlaceMarkers } from "./components/PlaceMarkers";
export { default as MapControls } from "./components/MapControls";
export { default as DistrictLabels } from "./components/DistrictLabels";
export { default as WardLabels } from "./components/WardLabels";
export { default as RouteLayer } from "./components/RouteLayer";

// Context & Hooks
export { MapProvider } from "./context/MapProvider";
export { useMapContext } from "./hooks/useMapContext";
export { useMapData } from "./hooks/useMapData";
export { useRouting } from "./hooks/useRouting";

// Configuration
export {
  MAP_CONFIGS,
  MAP_STYLES,
  DEFAULT_MAP_STYLE,
  CAN_THO_CENTER,
  MAP_THEME,
  LAYER_IDS,
  MAP_API_PATHS,
  DISTRICT_COLORS,
  buildDistrictColorExpression,
} from "./config/mapConfig";

// Adapter (for advanced custom map usage)
export {
  MapGL,
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  GeolocateControl,
  ENGINE_NAME,
} from "./adapters";

// Place map configuration
export {
  CATEGORY_CONFIG,
  DEFAULT_CATEGORY,
  getCategoryConfig,
  PRICE_LABELS,
} from "./config/placeMapConfig";

// Utilities
export { generateCanThoMask } from "./utils/geoUtils";
