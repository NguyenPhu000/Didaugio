/**
 * MAP MODULE CONFIGURATION
 * Single source of truth for all map constants, themes, and styles.
 * To change map behavior, only edit this file.
 */

// =============================================================================
// MAP ENGINE & TILE SOURCES
// =============================================================================

/**
 * Available map styles — swap tile provider by changing DEFAULT_MAP_STYLE.
 * Supported alternatives can be added here.
 */
export const MAP_STYLES = {
  OSM: {
    version: 8,
    name: "Clean OSM",
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-saturation": -0.2,
          "raster-contrast": 0.1,
        },
      },
    ],
  },

  CARTO_LIGHT: {
    version: 8,
    name: "CartoDB Light",
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; CartoDB &copy; OSM contributors",
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
  },
};

/** Active style — change this to swap tile provider globally */
export const DEFAULT_MAP_STYLE = MAP_STYLES.OSM;

// =============================================================================
// MAP REGION: CAN THO
// =============================================================================

export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_CONFIGS = {
  BOUNDS: [
    [105.18, 9.9], // SW
    [105.9, 10.4], // NE
  ],
  INITIAL_VIEW: {
    latitude: CAN_THO_CENTER.lat,
    longitude: CAN_THO_CENTER.lng,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  },
  CONSTRAINTS: {
    minZoom: 10,
    maxZoom: 18,
    dragRotate: false,
  },
};

// =============================================================================
// VISUAL THEME
// =============================================================================

export const MAP_THEME = {
  PRIMARY_BLUE: "#0E6BA8",
  ACCENT_BLUE: "#A6E1FA",

  MASK_COLOR: "rgba(240, 245, 250, 0.8)",
  MASK_OPACITY: 1,

  DISTRICT: {
    LINE_COLOR: "#0E6BA8",
    LINE_WIDTH: 2,
    FILL_COLOR: "rgba(14, 107, 168, 0.0)",
    HOVER_FILL: "rgba(14, 107, 168, 0.05)",
    SELECTED_FILL: "rgba(14, 107, 168, 0.1)",
  },

  WARD: {
    LINE_COLOR: "rgba(14, 107, 168, 0.3)",
    LINE_WIDTH: 1,
    HOVER_FILL: "rgba(14, 107, 168, 0.2)",
    SELECTED_FILL: "rgba(14, 107, 168, 0.3)",
  },
};

// =============================================================================
// LAYER IDS (for MapLibre source/layer references)
// =============================================================================

export const LAYER_IDS = {
  MASK: "world-mask",
  DISTRICT_LINE: "district-line",
  DISTRICT_FILL: "district-fill",
  WARD_LINE: "ward-line",
  WARD_FILL: "ward-fill",
};

// =============================================================================
// API ENDPOINTS (appended to API_BASE_URL)
// =============================================================================

export const MAP_API_PATHS = {
  DISTRICTS_GEOJSON: "/boundaries/districts",
  WARDS_GEOJSON: "/boundaries/wards",
};
