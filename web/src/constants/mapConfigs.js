/**
 * MAP CONFIGURATIONS
 * Centralized constants for map styling and behavior
 */

export const MAP_CONFIGS = {
  // Can Tho Bounds [Southwest, Northeast]
  // Adjusted slightly to focus tightly on the city
  BOUNDS: [
    [105.18, 9.9], // SW
    [105.9, 10.4], // NE
  ],

  // Initial View State
  INITIAL_VIEW: {
    latitude: 10.0345852,
    longitude: 105.7200532,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  },

  // Map Constraints
  CONSTRAINTS: {
    minZoom: 10,
    maxZoom: 18,
    dragRotate: false, // Keep map North-up for better UX
  },
};

// Can Tho Center Point (frequently used)
export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_THEME = {
  // Brand Colors
  PRIMARY_BLUE: "#0E6BA8",
  ACCENT_BLUE: "#A6E1FA",
  
  // Mask & background
  MASK_COLOR: "rgba(240, 245, 250, 0.8)", // Light blue-ish fog to hide outside areas
  MASK_OPACITY: 1,

  // Boundary Styles
  DISTRICT: {
    LINE_COLOR: "#0E6BA8",
    LINE_WIDTH: 2,
    FILL_COLOR: "rgba(14, 107, 168, 0.0)", // Transparent by default
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

export const LAYER_IDS = {
  MASK: "world-mask",
  DISTRICT_LINE: "district-line",
  DISTRICT_FILL: "district-fill",
  WARD_LINE: "ward-line",
  WARD_FILL: "ward-fill",
  LABELS: "place-labels", // Standard map labels to position mask below
};

export const DEFAULT_MAP_STYLE = {
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
        "raster-saturation": -0.2, // Desaturated for cleaner look
        "raster-contrast": 0.1,
      },
    },
  ],
};
