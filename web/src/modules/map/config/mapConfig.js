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
  // Pure white canvas — no tiles, only boundary lines & fills
  BLANK: {
    version: 8,
    name: "Thuần tú",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#ffffff" },
      },
    ],
  },

  // Colorful raster — CartoDB Voyager roads/colors (no POI icons, no labels in base tile)
  // then a labels-only tile on top for street/place names
  OSM: {
    version: 8,
    name: "Bản đồ",
    sources: {
      voyager_base: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; CartoDB &copy; OpenStreetMap contributors",
      },
      voyager_labels: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: "voyager-base", type: "raster", source: "voyager_base" },
      { id: "voyager-labels", type: "raster", source: "voyager_labels" },
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

  // Minimal admin style — faint street context, no label clutter
  ADMIN: {
    version: 8,
    name: "Hành chính",
    sources: {
      carto_nl: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; CartoDB &copy; OSM contributors",
      },
    },
    layers: [
      {
        id: "carto_nl",
        type: "raster",
        source: "carto_nl",
        paint: { "raster-opacity": 0.55, "raster-saturation": -0.6 },
      },
    ],
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
  // Professional cartographic pastel palette — adjacent districts contrast well
  {
    fill: "rgba(186,215,233,0.72)",
    line: "#2B7CB8",
    hover: "rgba(186,215,233,0.92)",
    selected: "rgba(43,124,184,0.38)",
  }, // steel blue
  {
    fill: "rgba(166,220,195,0.72)",
    line: "#1E8A5E",
    hover: "rgba(166,220,195,0.92)",
    selected: "rgba(30,138,94,0.38)",
  }, // emerald
  {
    fill: "rgba(250,224,178,0.72)",
    line: "#C47F17",
    hover: "rgba(250,224,178,0.92)",
    selected: "rgba(196,127,23,0.38)",
  }, // amber
  {
    fill: "rgba(240,188,188,0.72)",
    line: "#B83040",
    hover: "rgba(240,188,188,0.92)",
    selected: "rgba(184,48,64,0.38)",
  }, // rose
  {
    fill: "rgba(208,195,232,0.72)",
    line: "#6840A8",
    hover: "rgba(208,195,232,0.92)",
    selected: "rgba(104,64,168,0.38)",
  }, // violet
  {
    fill: "rgba(178,226,218,0.72)",
    line: "#1A8A7F",
    hover: "rgba(178,226,218,0.92)",
    selected: "rgba(26,138,127,0.38)",
  }, // teal
  {
    fill: "rgba(248,203,168,0.72)",
    line: "#B85520",
    hover: "rgba(248,203,168,0.92)",
    selected: "rgba(184,85,32,0.38)",
  }, // burnt orange
  {
    fill: "rgba(185,202,230,0.72)",
    line: "#3450A0",
    hover: "rgba(185,202,230,0.92)",
    selected: "rgba(52,80,160,0.38)",
  }, // indigo
  {
    fill: "rgba(195,222,180,0.72)",
    line: "#3A7830",
    hover: "rgba(195,222,180,0.92)",
    selected: "rgba(58,120,48,0.38)",
  }, // sage green
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
  PRIMARY_BLUE: "#334155",
  ACCENT_BLUE: "#94a3b8",

  // Outside-Cần Thơ mask: very faint so it doesn't distract
  MASK_COLOR: "#f1f5f9",
  MASK_OPACITY: 0.75,

  DISTRICT: {
    // Minimalist outline — no fill used by default
    STROKE_COLOR: "#334155",
    STROKE_WIDTH: 1.8,
    STROKE_WIDTH_HOVER: 2.8,
    STROKE_WIDTH_SELECTED: 3.2,
    HOVER_FILL: "rgba(51,65,85,0.05)", // barely visible tint on hover
    SELECTED_FILL: "rgba(51,65,85,0.10)", // slightly more visible when selected
  },

  WARD: {
    LINE_COLOR: "rgba(148,163,184,0.5)",
    LINE_WIDTH: 0.7,
    HOVER_FILL: "rgba(148,163,184,0.08)",
  },
};

// =============================================================================
// LAYER IDS (for MapLibre source/layer references)
// =============================================================================

export const LAYER_IDS = {
  MASK: "world-mask",
  DISTRICT_CASING: "district-casing",
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
