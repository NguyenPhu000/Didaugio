/**
 * MAP MODULE CONFIGURATION
 * Single source of truth for all map constants, themes, and styles.
 */

// =============================================================================
// TILE STYLES
// =============================================================================

const ESRI_SATELLITE_TILES = [
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];
const ESRI_ATTRIBUTION =
  "© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN";

export const MAP_STYLES = {
  OSM: {
    version: 8,
    name: "Bản đồ",
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
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
        paint: { "raster-saturation": -0.2, "raster-contrast": 0.1 },
      },
    ],
  },

  CARTO_LIGHT: {
    version: 8,
    name: "Tối giản",
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
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  },

  SATELLITE: {
    version: 8,
    name: "Vệ tinh",
    sources: {
      satellite: {
        type: "raster",
        tiles: ESRI_SATELLITE_TILES,
        tileSize: 256,
        attribution: ESRI_ATTRIBUTION,
      },
    },
    layers: [{ id: "satellite", type: "raster", source: "satellite" }],
  },

  HYBRID: {
    version: 8,
    name: "Vệ tinh + Nhãn",
    sources: {
      satellite: {
        type: "raster",
        tiles: ESRI_SATELLITE_TILES,
        tileSize: 256,
        attribution: ESRI_ATTRIBUTION,
      },
      labels: {
        type: "raster",
        tiles: [
          "https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: "satellite", type: "raster", source: "satellite" },
      { id: "labels", type: "raster", source: "labels" },
    ],
  },
};

export const DEFAULT_MAP_STYLE = MAP_STYLES.OSM;

// =============================================================================
// MAP REGION: CẦN THƠ
// =============================================================================

export const CAN_THO_CENTER = {
  lat: 10.0345852,
  lng: 105.7200532,
};

export const MAP_CONFIGS = {
  BOUNDS: [
    [105.18, 9.85],
    [106.0, 10.45],
  ],
  INITIAL_VIEW: {
    latitude: CAN_THO_CENTER.lat,
    longitude: CAN_THO_CENTER.lng,
    zoom: 11,
    bearing: 0,
    pitch: 0,
  },
  CONSTRAINTS: {
    minZoom: 9,
    maxZoom: 19,
    dragRotate: true,
    pitchWithRotate: true,
    maxPitch: 60,
  },
};

// =============================================================================
// DISTRICT COLOR PALETTE (9 districts — consistent mapping by index)
// =============================================================================

export const DISTRICT_COLORS = [
  {
    fill: "rgba(59,130,246,0.18)",
    line: "#3b82f6",
    hover: "rgba(59,130,246,0.35)",
    selected: "rgba(59,130,246,0.5)",
  }, // blue
  {
    fill: "rgba(16,185,129,0.18)",
    line: "#10b981",
    hover: "rgba(16,185,129,0.35)",
    selected: "rgba(16,185,129,0.5)",
  }, // emerald
  {
    fill: "rgba(245,158,11,0.18)",
    line: "#f59e0b",
    hover: "rgba(245,158,11,0.35)",
    selected: "rgba(245,158,11,0.5)",
  }, // amber
  {
    fill: "rgba(239,68,68,0.18)",
    line: "#ef4444",
    hover: "rgba(239,68,68,0.35)",
    selected: "rgba(239,68,68,0.5)",
  }, // red
  {
    fill: "rgba(139,92,246,0.18)",
    line: "#8b5cf6",
    hover: "rgba(139,92,246,0.35)",
    selected: "rgba(139,92,246,0.5)",
  }, // violet
  {
    fill: "rgba(236,72,153,0.18)",
    line: "#ec4899",
    hover: "rgba(236,72,153,0.35)",
    selected: "rgba(236,72,153,0.5)",
  }, // pink
  {
    fill: "rgba(20,184,166,0.18)",
    line: "#14b8a6",
    hover: "rgba(20,184,166,0.35)",
    selected: "rgba(20,184,166,0.5)",
  }, // teal
  {
    fill: "rgba(249,115,22,0.18)",
    line: "#f97316",
    hover: "rgba(249,115,22,0.35)",
    selected: "rgba(249,115,22,0.5)",
  }, // orange
  {
    fill: "rgba(6,182,212,0.18)",
    line: "#06b6d4",
    hover: "rgba(6,182,212,0.35)",
    selected: "rgba(6,182,212,0.5)",
  }, // cyan
];

// Build MapLibre match expressions from a sorted list of district ids
export function buildDistrictColorExpression(districtIds, colorKey, fallback) {
  const expr = ["match", ["to-string", ["get", "id"]]];
  districtIds.forEach((id, idx) => {
    expr.push(String(id));
    expr.push(DISTRICT_COLORS[idx % DISTRICT_COLORS.length][colorKey]);
  });
  expr.push(fallback);
  return expr;
}

// =============================================================================
// VISUAL THEME
// =============================================================================

export const MAP_THEME = {
  PRIMARY_BLUE: "#0E6BA8",
  ACCENT_BLUE: "#A6E1FA",

  MASK_COLOR: "#e8eef4",
  MASK_OPACITY: 0.88,

  DISTRICT: {
    LINE_WIDTH: 2.5,
    LINE_WIDTH_SELECTED: 3.5,
  },

  WARD: {
    LINE_COLOR: "rgba(100,116,139,0.35)",
    LINE_WIDTH: 1,
    HOVER_FILL: "rgba(100,116,139,0.2)",
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
