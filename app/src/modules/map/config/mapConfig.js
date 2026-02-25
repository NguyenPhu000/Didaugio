/**
 * MAP MODULE CONFIGURATION — React Native
 * Mirrors web/src/modules/map/config/mapConfig.js
 * Single source of truth for all map constants shared between web & app.
 */

// =============================================================================
// MAP REGION: CAN THO
// =============================================================================

export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_CONFIGS = {
  BOUNDS: [
    [105.18, 9.9], // SW [lng, lat]
    [105.9, 10.4], // NE [lng, lat]
  ],
  INITIAL_VIEW: {
    centerCoordinate: [CAN_THO_CENTER.lng, CAN_THO_CENTER.lat],
    zoomLevel: 11,
  },
  CONSTRAINTS: {
    minZoomLevel: 10,
    maxZoomLevel: 18,
  },
};

// =============================================================================
// MAP TILE STYLE (OSM Raster — identical to web)
// =============================================================================

export const MAP_STYLE = {
  version: 8,
  name: "CartoDB Light",
  sources: {
    carto: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© CartoDB © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// =============================================================================
// VISUAL THEME
// =============================================================================

export const MAP_THEME = {
  PRIMARY: "#0576b3",
  GOLD: "#C5A028",
  PRIMARY_DARK: "#0E6BA8",
};

// =============================================================================
// CATEGORY ICON MAP (Material Icons name → data)
// =============================================================================

export const CATEGORY_ICON_MAP = {
  "Ăn uống": { icon: "restaurant", color: "#FF6B35" },
  "Lưu trú": { icon: "hotel", color: "#0576b3" },
  "Tham quan": { icon: "camera-alt", color: "#9C27B0" },
  "Mua sắm": { icon: "shopping-bag", color: "#4CAF50" },
  "Giải trí": { icon: "sports-esports", color: "#FF5722" },
  "Dịch vụ": { icon: "miscellaneous-services", color: "#607D8B" },
};

export const DEFAULT_CATEGORY_ICON = { icon: "place", color: "#737373" };
